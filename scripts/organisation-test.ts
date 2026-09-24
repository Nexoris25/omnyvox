import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {pool,query} from '../lib/db';
import {hashPassword} from '../lib/auth';
import {registerAccount,currentPolicies} from '../lib/account-consent';
import {canInternal,canSite} from '../lib/permissions';
if(!/\/omnyvox_test(?:\?|$)/.test(process.env.DATABASE_URL||''))throw Error('Use omnyvox_test only');
const base=process.env.TEST_BASE_URL||'http://localhost:3002';let checks=0;
const check=(v:unknown,label:string)=>{assert.ok(v,label);console.log('PASS',label);checks++;};
async function account(role='owner'){
 const email=`org-${randomUUID()}@example.test`,token=randomBytes(32).toString('hex');
 const [u]=await query<{id:string}>("INSERT INTO users(name,email,password,role,email_verified,mfa_secret) VALUES('Organisation QA',$1,$2,$3,true,$4) RETURNING id",[email,hashPassword('Organisation1!'),role,role==='owner'?null:'test-fixture']);
 await query("INSERT INTO sessions(token,user_id,expires,mfa_verified) VALUES($1,$2,now()+interval '1 hour',true)",[createHash('sha256').update(token).digest('hex'),u.id]);
 const [org]=await query<{id:string}>('SELECT id FROM organisations WHERE owner_id=$1',[u.id]);return {...u,email,org:org.id,cookie:`omnyvox_session=${token}`};
}
async function api(cookie:string,path:string,method='GET',body?:unknown){const r=await fetch(base+'/api/'+path,{method,headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
try{
 const owner=await account(),editor=await account(),outsider=await account(),second=await account();
 const created=await api(owner.cookie,'sites','POST',{name:'Team Shop',slug:'team-'+randomUUID().slice(0,8),category:'commerce',tier:'growth',industry:'electronics',template:'catalogue'});
 check(created.status===201,'owner retains site provisioning');const site=created.data;
 await query("UPDATE sites SET subscription='active',paid_until=now()+interval '1 month' WHERE id=$1",[site.id]);
 const invitations=await Promise.all([editor,second,outsider].map((u)=>api(owner.cookie,`organisations/${owner.org}/invite`,'POST',{email:u.email,role:'editor'})));
 check(invitations.filter(r=>r.status===200).length===2,'concurrent invitations reserve only two remaining Growth seats');
 const invited=[editor,second,outsider].find((_,i)=>invitations[i].status===200)!;
 const [mail]=await query<{body:string}>('SELECT body FROM email_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1',[invited.email]);const token=mail.body.match(/invitation=([a-f0-9]{64})/)![1];
 check((await api(owner.cookie,'organisations/accept','POST',{token})).status===403,'invitation cannot be accepted by a different email');
 await query('UPDATE users SET email_verified=false WHERE id=$1',[invited.id]);
 check((await api(invited.cookie,'organisations/accept','POST',{token})).status===403,'invitation requires verified mailbox');
 await query('UPDATE users SET email_verified=true WHERE id=$1',[invited.id]);
 check((await api(invited.cookie,'organisations/accept','POST',{token})).status===200,'verified invitee joins organisation');
 check((await api(invited.cookie,'organisations/accept','POST',{token})).status===403,'accepted invitation is single-use');
 check((await api(invited.cookie,'sites')).data.some((s:{id:string})=>s.id===site.id),'member sees shared website');
 check((await api(invited.cookie,`sites/${site.id}/billing-history`)).status===403,'editor cannot read billing data');
 check((await api(invited.cookie,`sites/${site.id}/merchant`)).status===403,'editor cannot access payment connection');
 check((await api(invited.cookie,`sites/${site.id}/publish`,'POST',{})).status===403,'editor cannot publish website');
 check((await api(invited.cookie,`organisations/${owner.org}/invite`,'POST',{email:'forbidden@example.test',role:'administrator'})).status===403,'editor cannot escalate through membership');
 check((await api(owner.cookie,`organisations/${owner.org}/role`,'POST',{userId:owner.id,role:'editor'})).status===409,'owner cannot be demoted');
 const stranger=await account();
 check((await api(stranger.cookie,`sites/${site.id}`)).status===404,'nonmember cannot read shared website');
 check((await api(stranger.cookie,`organisations/${owner.org}`)).status===404,'nonmember cannot list organisation members');
 check((await api(owner.cookie,`organisations/${owner.org}/remove`,'POST',{userId:invited.id})).status===200,'owner removes a member');
 check((await api(invited.cookie,`sites/${site.id}`)).status===404,'removal immediately revokes shared website access');
 const staff=await account('support');
 check((await api(staff.cookie,'platform-admin/support')).status===200,'support role can read support inbox');
 check((await api(staff.cookie,'platform-admin/subscriptions')).status===403,'support role cannot read subscription finance');
 check((await api(staff.cookie,'platform-admin/staff')).status===403,'support role cannot assign staff roles');
 await query('UPDATE sessions SET mfa_verified=false WHERE user_id=$1',[staff.id]);
 check((await api(staff.cookie,'platform-admin/support')).status===401,'scoped staff still require verified MFA session');
 check(!canInternal('technical',['platform-admin','storage'],'PATCH')&&!canInternal('finance',['platform-admin','merchants'],'PATCH'),'technical and finance roles cannot mutate unauthorised operations');
 check(!canSite('store_manager','billing','POST')&&!canSite('analyst','products','GET'),'store managers cannot escalate and the retired analyst role has no access');
 const policies=Object.fromEntries((await currentPolicies()).map(p=>[p.slug,p.id]));
 const identity={name:'Consent QA',email:`consent-${randomUUID()}@example.test`,phone:'+2348012345678',passwordHash:hashPassword('ConsentTests1!'),terms:policies.terms,privacy:policies.privacy};
 await assert.rejects(()=>registerAccount({...identity,terms:randomUUID()}),/policies/);check(true,'stale or forged policy version cannot register');
 const registered=await registerAccount(identity);
 check((await query('SELECT * FROM account_consents WHERE user_id=$1',[registered.id])).length===2,'registration records both immutable policy versions');
 check((await query('SELECT * FROM organisations WHERE owner_id=$1',[registered.id])).length===1,'registration provisions organisation atomically');
 console.log(`${checks} organisation and permissions checks passed`);
}finally{await pool.end();}
