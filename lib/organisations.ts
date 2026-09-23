import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool, query } from './db';
import { limits } from './model';
import { memberRoles } from './permissions';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const json = (b: unknown,status=200) => NextResponse.json(b,{status,headers:{'Cache-Control':'no-store'}});
type Account = {id:string;email:string;email_verified:boolean};
export async function organisationApi(req:NextRequest,u:Account,id?:string,action?:string) {
  if (!id && req.method === 'GET') return json(await query("SELECT o.id,o.name,m.role FROM organisations o JOIN organisation_members m ON m.organisation_id=o.id WHERE m.user_id=$1 ORDER BY o.created_at",[u.id]));
  if (id === 'accept' && req.method === 'POST') {
    if (!u.email_verified) return json({error:'Verify your account email before accepting an invitation.'},403);
    const {token} = z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).parse(await req.json());
    const client=await pool.connect();
    try {
      await client.query('BEGIN');
      const {rows:[invite]}=await client.query('SELECT * FROM organisation_invitations WHERE token_hash=$1',[hash(token)]);
      if (!invite) {await client.query('ROLLBACK');return json({error:'Invitation is invalid or expired.'},404);}
      await client.query('SELECT id FROM organisations WHERE id=$1 FOR UPDATE',[invite.organisation_id]);
      const {rows:[current]}=await client.query('SELECT * FROM organisation_invitations WHERE id=$1 FOR UPDATE',[invite.id]);
      if(current.revoked_at || current.accepted_at || new Date(current.expires_at)<=new Date() || current.email.toLowerCase()!==u.email.toLowerCase()) {await client.query('ROLLBACK');return json({error:'Invitation is invalid, expired or belongs to a different email address.'},403);}
      const capacity=await seatCapacity(client,invite.organisation_id);
      const {rows:[existing]}=await client.query('SELECT 1 FROM organisation_members WHERE organisation_id=$1 AND user_id=$2',[invite.organisation_id,u.id]);
      if(existing || capacity.members>=capacity.limit) {await client.query('ROLLBACK');return json({error:existing?'You already belong to this organisation.':'No team seats are available. Ask the owner to review the plan.'},409);}
      await client.query('INSERT INTO organisation_members(organisation_id,user_id,role) VALUES($1,$2,$3)',[invite.organisation_id,u.id,invite.role]);
      await client.query('UPDATE organisation_invitations SET accepted_at=now() WHERE id=$1',[invite.id]);
      await client.query("INSERT INTO audit(actor,action,target) VALUES($1,'organisation.invitation.accepted',$2)",[u.id,invite.id]);
      await client.query('COMMIT'); return json({success:true});
    } catch(e) {await client.query('ROLLBACK');throw e;} finally {client.release();}
  }
  if (!z.uuid().safeParse(id).success) return json({error:'Organisation not found.'},404);
  const [org]=await query<{id:string;name:string;role:string;owner_id:string}>('SELECT o.*,m.role FROM organisations o JOIN organisation_members m ON m.organisation_id=o.id WHERE o.id=$1 AND m.user_id=$2',[id,u.id]);
  if(!org) return json({error:'Organisation not found.'},404);
  if(req.method==='GET') {
    if(org.role!=='owner') return json({id:org.id,name:org.name,role:org.role});
    return json({...org,...await seatCapacity(pool,id!),members:await query('SELECT m.user_id,m.role,u.name,u.email FROM organisation_members m JOIN users u ON u.id=m.user_id WHERE m.organisation_id=$1 ORDER BY m.joined_at',[id]),invitations:await query('SELECT id,email,role,expires_at FROM organisation_invitations WHERE organisation_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()',[id])});
  }
  if(org.role!=='owner') return json({error:'Only the organisation owner can manage membership.'},403);
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  const b=z.object({email:z.email().transform(v=>v.toLowerCase().trim()).optional(),role:z.enum(memberRoles).optional(),userId:z.uuid().optional(),invitationId:z.uuid().optional(),name:z.string().min(2).max(120).optional()}).parse(await req.json());
  const client=await pool.connect();
  try {
    await client.query('BEGIN');await client.query('SELECT id FROM organisations WHERE id=$1 FOR UPDATE',[id]);
    if(action==='invite') {
      if(!u.email_verified || !b.email || !b.role) {await client.query('ROLLBACK');return json({error:'Verify your email and provide an invitation email and role.'},400);}
      const capacity=await seatCapacity(client,id!);
      if(capacity.members+capacity.pending>=capacity.limit) {await client.query('ROLLBACK');return json({error:`This plan has ${capacity.limit} team seat(s), including the owner and pending invitations.`},409);}
      const {rows}=await client.query("SELECT 1 FROM organisation_members m JOIN users u ON u.id=m.user_id WHERE m.organisation_id=$1 AND lower(u.email)=$2 UNION ALL SELECT 1 FROM organisation_invitations WHERE organisation_id=$1 AND email=$2 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()",[id,b.email]);
      if(rows.length) {await client.query('ROLLBACK');return json({error:'This email is already a member or has a pending invitation.'},409);}
      const token=randomBytes(32).toString('hex');
      await client.query('INSERT INTO organisation_invitations(organisation_id,email,role,token_hash,invited_by) VALUES($1,$2,$3,$4,$5)',[id,b.email,b.role,hash(token),u.id]);
      const url=new URL('/account/team',process.env.APP_URL);url.searchParams.set('invitation',token);
      await client.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Invitation to an Omnyvox workspace',$2)",[b.email,`You were invited to ${org.name} as ${b.role.replace('_',' ')}. Sign in with this email, verify it, then open ${url.href}. This invitation expires in seven days.`]);
    } else if(action==='revoke' && b.invitationId) {
      await client.query('UPDATE organisation_invitations SET revoked_at=now() WHERE id=$1 AND organisation_id=$2 AND accepted_at IS NULL',[b.invitationId,id]);
    } else if(['remove','role'].includes(action||'') && b.userId) {
      if(b.userId===org.owner_id) {await client.query('ROLLBACK');return json({error:'The owner cannot be removed or demoted.'},409);}
      if(action==='role' && b.role) await client.query('UPDATE organisation_members SET role=$3 WHERE organisation_id=$1 AND user_id=$2',[id,b.userId,b.role]);
      else if(action==='remove') await client.query('DELETE FROM organisation_members WHERE organisation_id=$1 AND user_id=$2',[id,b.userId]);
      else {await client.query('ROLLBACK');return json({error:'Choose a role.'},400);}
    } else if(action==='rename' && b.name) await client.query('UPDATE organisations SET name=$2 WHERE id=$1',[id,b.name]);
    else {await client.query('ROLLBACK');return json({error:'Unknown membership action.'},400);}
    await client.query('INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)',[u.id,'organisation.'+action,id]);
    await client.query('COMMIT');return json({success:true});
  } catch(e) {await client.query('ROLLBACK');throw e;} finally {client.release();}
}
async function seatCapacity(db:Pick<typeof pool,'query'>,org:string) {
  const {rows:[counts]}=await db.query("SELECT (SELECT count(*)::int FROM organisation_members WHERE organisation_id=$1) AS members,(SELECT count(*)::int FROM organisation_invitations WHERE organisation_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()) AS pending",[org]);
  const {rows}=await db.query("SELECT s.tier,p.entitlements FROM effective_sites s JOIN organisations o ON o.owner_id=s.owner_id LEFT JOIN plans p ON p.id=s.category||'-'||s.tier WHERE o.id=$1 AND s.subscription='active' AND s.service_until>now()",[org]);
  const limit=Math.max(1,...rows.map((r:{tier:keyof typeof limits;entitlements?:{team?:number}})=>Number.isSafeInteger(r.entitlements?.team)&&r.entitlements!.team!>0?r.entitlements!.team!:limits[r.tier].team));
  return {...counts,limit};
}
