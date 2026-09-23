import {createHash,randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {pool,query} from './db';
import {verifyPassword,rateLimit} from './auth';
import {consumeSecondFactor} from './mfa';
import {newTotpSecret,verifyTotp,recoveryCodes,recoveryHash} from './totp';
import {encrypt,decrypt} from './commerce';
import {isStaff} from './permissions';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const json=(b:unknown,status=200)=>NextResponse.json(b,{status,headers:{'Cache-Control':'no-store'}});
export async function assistedRecovery(req:NextRequest,action:string){
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const b=z.object({email:z.email().transform(v=>v.toLowerCase().trim()).optional(),password:z.string().max(128).optional(),reason:z.string().min(20).max(2000).optional(),token:z.string().regex(/^[a-f0-9]{64}$/).optional(),code:z.string().regex(/^\d{6}$/).optional()}).parse(await req.json());
 if(action==='request'){
  if(!b.email||!b.password||!b.reason)return json({error:'Provide your email, password and a description of the access problem.'},400);
  await rateLimit('assisted-request:'+b.email);
  const [u]=await query<{id:string;password:string;mfa_secret:string}>('SELECT id,password,mfa_secret FROM users WHERE email=$1 AND email_verified=true',[b.email]);
  if(u?.mfa_secret&&verifyPassword(b.password,u.password)){
   const token=randomBytes(32).toString('hex');const c=await pool.connect();try{
    await c.query('BEGIN');await c.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[u.id]);
    const {rows:[created]}=await c.query("INSERT INTO account_recovery_cases(user_id,reason,cancel_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",[u.id,b.reason,hash(token)]);
    if(created){const url=new URL('/account/recover',process.env.APP_URL);url.searchParams.set('cancel',token);await c.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Omnyvox account recovery requested',$2)",[b.email,`A request to replace your authenticator was submitted. Two independent authorised reviewers must verify your identity before a 24-hour security delay. To stop this request at any time before completion, open ${url.href}. If this was not you, cancel it and reset your password.`]);await c.query("INSERT INTO audit(actor,action,target) VALUES($1,'recovery.requested',$2)",[u.id,created.id]);}
    await c.query('COMMIT');
   }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
  return json({message:'If the account and password match an eligible account, your request has been recorded and the account mailbox has been notified.'});
 }
 if(!b.token)return json({error:'A recovery link is required.'},400);
 await rateLimit('assisted-token:'+hash(b.token));
 const c=await pool.connect();try{
  await c.query('BEGIN');
  if(action==='cancel'){
   const {rows:[cancelled]}=await c.query("UPDATE account_recovery_cases SET status='cancelled',pending_secret=NULL,token_hash=NULL WHERE cancel_hash=$1 AND status IN ('requested','cooldown','ready') RETURNING id,user_id",[hash(b.token)]);
   if(cancelled)await c.query("INSERT INTO audit(actor,action,target) VALUES($1,'recovery.cancelled',$2)",[cancelled.user_id,cancelled.id]);
   await c.query('COMMIT');return json({message:'Any active request matching this link has been cancelled.'});
  }
  const {rows:[item]}=await c.query("SELECT r.*,u.password,u.email FROM account_recovery_cases r JOIN users u ON u.id=r.user_id WHERE r.token_hash=$1 AND r.status='ready' AND r.token_expires>now() FOR UPDATE OF r,u",[hash(b.token)]);
  if(!item||!b.password||!verifyPassword(b.password,item.password)){await c.query('ROLLBACK');return json({error:'This recovery link or password is invalid. Request assistance if the link expired.'},403);}
  if(action==='setup'){
   const secret=newTotpSecret();await c.query('UPDATE account_recovery_cases SET pending_secret=$2 WHERE id=$1',[item.id,encrypt(secret)]);await c.query('COMMIT');return json({secret});
  }
  if(action!=='complete'||!item.pending_secret||!b.code){await c.query('ROLLBACK');return json({error:'Set up the replacement authenticator first.'},400);}
  const counter=verifyTotp(decrypt(item.pending_secret),b.code);
  if(counter===null){await c.query('ROLLBACK');return json({error:'Incorrect authenticator code.'},400);}
  const codes=recoveryCodes();await c.query('UPDATE users SET mfa_secret=$2,mfa_pending=NULL,mfa_pending_until=NULL,mfa_last_counter=$3,recovery_hashes=$4 WHERE id=$1',[item.user_id,item.pending_secret,counter,JSON.stringify(codes.map(recoveryHash))]);
  await c.query('DELETE FROM sessions WHERE user_id=$1',[item.user_id]);await c.query('DELETE FROM auth_tokens WHERE user_id=$1',[item.user_id]);await c.query('DELETE FROM account_email_changes WHERE user_id=$1',[item.user_id]);
  await c.query("UPDATE account_recovery_cases SET status='completed',completed_at=now(),pending_secret=NULL,token_hash=NULL WHERE id=$1",[item.id]);
  await c.query("INSERT INTO audit(actor,action,target) VALUES($1,'recovery.completed',$2)",[item.user_id,item.id]);
  await c.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Your Omnyvox authenticator was replaced','Your recovery request completed. Old authenticator codes, recovery codes and sessions no longer work. Contact support immediately if this was not you.')",[item.email]);
  await c.query('COMMIT');return json({message:'Authenticator replaced. Save your recovery codes, then sign in.',recoveryCodes:codes});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function reviewRecovery(req:NextRequest,actor:{id:string;role:string}){
 if(!['super_admin','compliance'].includes(actor.role))return json({error:'Compliance access required'},403);
 if(req.method==='GET')return json(await query("SELECT r.id,r.reason,r.status,r.ready_at,r.created_at,u.email,u.role,(SELECT count(*)::int FROM account_recovery_reviews v WHERE v.case_id=r.id AND decision='approve') AS approvals FROM account_recovery_cases r JOIN users u ON u.id=r.user_id WHERE r.status IN ('requested','cooldown','ready') ORDER BY r.created_at"));
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 await rateLimit('recovery-review:'+actor.id);
 const b=z.object({caseId:z.uuid(),decision:z.enum(['approve','reject']),evidenceNote:z.string().min(30).max(2000),identityVerified:z.literal(true),password:z.string().max(128),code:z.string().max(32)}).parse(await req.json());
 const [u]=await query<{password:string}>('SELECT password FROM users WHERE id=$1',[actor.id]);
 if(!verifyPassword(b.password,u.password)||!await consumeSecondFactor(actor.id,b.code))return json({error:'Confirm your password and a fresh second factor.'},403);
 const c=await pool.connect();try{
  await c.query('BEGIN');const {rows:[item]}=await c.query('SELECT r.*,u.role,u.email FROM account_recovery_cases r JOIN users u ON u.id=r.user_id WHERE r.id=$1 FOR UPDATE OF r',[b.caseId]);
  if(!item||item.status!=='requested'||item.user_id===actor.id||isStaff(item.role)&&actor.role!=='super_admin'){await c.query('ROLLBACK');return json({error:'This case cannot be reviewed by this account.'},409);}
  const {rowCount}=await c.query('INSERT INTO account_recovery_reviews(case_id,reviewer_id,decision,evidence_note) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[item.id,actor.id,b.decision,b.evidenceNote]);
  if(!rowCount){await c.query('ROLLBACK');return json({error:'A different reviewer must make the next decision.'},409);}
  const {rows:[count]}=await c.query("SELECT count(*)::int AS approvals FROM account_recovery_reviews WHERE case_id=$1 AND decision='approve'",[item.id]);
  if(b.decision==='reject')await c.query("UPDATE account_recovery_cases SET status='rejected' WHERE id=$1",[item.id]);
  else if(count.approvals>=2){await c.query("UPDATE account_recovery_cases SET status='cooldown',ready_at=now()+interval '24 hours' WHERE id=$1",[item.id]);await c.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Omnyvox recovery review completed','Two reviewers approved your recovery request. The recovery link will be sent after a 24-hour security delay. Your original cancellation link remains valid until completion.')",[item.email]);}
  await c.query('INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)',[actor.id,'recovery.review.'+b.decision,item.id]);await c.query('COMMIT');return json({success:true});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function dispatchRecoveryLinks(){
 const c=await pool.connect();try{await c.query('BEGIN');const {rows}=await c.query("SELECT r.id,u.email FROM account_recovery_cases r JOIN users u ON u.id=r.user_id WHERE r.status='cooldown' AND r.ready_at<=now() FOR UPDATE OF r SKIP LOCKED LIMIT 20");
 for(const item of rows){const token=randomBytes(32).toString('hex');const url=new URL('/account/recover',process.env.APP_URL);url.searchParams.set('token',token);await c.query("UPDATE account_recovery_cases SET status='ready',token_hash=$2,token_expires=now()+interval '1 hour' WHERE id=$1",[item.id,hash(token)]);await c.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Your Omnyvox recovery link',$2)",[item.email,`Open ${url.href} within one hour. Your current password and a new authenticator are required. Existing access remains unchanged until you complete setup.`]);}
 await c.query('COMMIT');return rows.length;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
