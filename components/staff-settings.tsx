"use client";
import { useEffect,useState } from 'react';
import { staffRoles } from '@/lib/permissions';
type Staff={id:string;name:string;email:string;role:string;email_verified:boolean;mfa_enabled:boolean};
export function StaffSettings(){
 const [users,setUsers]=useState<Staff[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch('/api/platform-admin/staff');const b=await r.json();if(!r.ok)throw Error(b.error);setUsers(b);}
 useEffect(()=>{load().catch(e=>setMessage(e.message));},[]);
 return <section className="panel panel-body stack"><h2>Give a staff role</h2><p>Assign a scoped role to an existing verified account. Changes sign that person out. Every staff role requires MFA.</p><p role="status">{message}</p><form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const b=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch('/api/platform-admin/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const result=await r.json();if(!r.ok)throw Error(result.error);setMessage('Role updated and sessions revoked.');await load();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <label className="field">Account<select name="userId" required>{users.filter(u=>u.email_verified&&u.role!=='super_admin').map(u=><option key={u.id} value={u.id}>{u.name} · {u.email} · {u.role}</option>)}</select></label>
 <label className="field">Role<select name="role"><option value="owner">Subscriber only — remove staff access</option>{staffRoles.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
 <label className="field">Your current password<input name="password" type="password" autoComplete="current-password" required/></label><label className="field">Fresh authenticator or recovery code<input name="code" autoComplete="one-time-code" required maxLength={32}/></label><button className="button" disabled={busy}>Update staff role</button>
 </form><h3>Current staff</h3>{users.filter(u=>u.role!=='owner').map(u=><p key={u.id} style={{overflowWrap:'anywhere'}}>{u.name} · {u.email} · {u.role} · MFA {u.mfa_enabled?'enabled':'required before access'}</p>)}</section>;
}
