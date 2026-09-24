"use client";
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { memberRoles } from '@/lib/permissions';
type Org={id:string;name:string;role:string;hasStore?:boolean;limit?:number;pending?:number;members?:{user_id:string;name:string;email:string;role:string}[];invitations?:{id:string;email:string;role:string;expires_at:string}[]};
export function TeamSettings(){
 const [orgs,setOrgs]=useState<Org[]>([]),[org,setOrg]=useState<Org>(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[invitation,setInvitation]=useState('');
 async function api(path:string,body?:unknown){const r=await fetch('/api/organisations'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const b=await r.json();if(!r.ok)throw Error(b.error);return b;}
 async function select(id:string){setOrg(await api('/'+id));}
 async function load(){const rows=await api('');setOrgs(rows);if(rows.length)await select(org?.id||rows[0].id);}
 useEffect(()=>{setInvitation(new URLSearchParams(location.search).get('invitation')||'');load().catch(e=>setMessage(e.message));},[]);
 async function act(action:string,body:unknown){setBusy(true);setMessage('');try{await api(action==='accept'?'/accept':'/'+org!.id+'/'+action,body);if(action==='accept'){setInvitation('');history.replaceState(null,'','/account/team');}await load();setMessage('Workspace updated.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <main id="main" className="section" style={{maxWidth:1000,margin:'auto'}}><Link href="/dashboard">← Your workspace</Link><h1>Organisation & team</h1><p>Invite colleagues to your workspace and give each person the access they need.</p><p role="status">{message}</p>
 {invitation && <section className="panel panel-body"><h2>Your invitation</h2><p>Accept using the verified email address that received this invitation.</p><button className="button" disabled={busy} onClick={()=>act('accept',{token:invitation})}>Accept invitation</button></section>}
 <label className="field">Organisation<select value={org?.id||''} onChange={e=>select(e.target.value).catch(e=>setMessage(e.message))}>{orgs.map(o=><option key={o.id} value={o.id}>{o.name} · {o.role}</option>)}</select></label>
 {org && <section className="panel panel-body stack"><h2>{org.name}</h2>{org.role==='owner'?<>
 <form className="stack" onSubmit={e=>{e.preventDefault();act('rename',{name:new FormData(e.currentTarget).get('name')});}}><label className="field">Workspace name<input name="name" key={org.name} defaultValue={org.name} required minLength={2} maxLength={120}/></label><button className="button secondary" disabled={busy}>Save name</button></form>
 <p>{org.members?.length} members · {org.pending} pending invitations · {org.limit} seats. Pending invitations reserve a seat for seven days.</p>
 <form className="stack" onSubmit={e=>{e.preventDefault();act('invite',Object.fromEntries(new FormData(e.currentTarget)));}}><h3>Invite a colleague</h3><label className="field">Email address<input name="email" type="email" required/></label><label className="field">Role<select name="role">{memberRoles.filter(r=>r!=='store_manager'||org?.hasStore).map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></label><p>Administrators manage and publish website content. Editors work on drafts. {org?.hasStore?'Store managers manage products and orders. ':''}Billing, payment credentials and membership stay with the owner.</p><button className="button" disabled={busy}>Send invitation</button></form>
 <h3>Members</h3>{org.members?.map(m=><article key={m.user_id} className="panel panel-body stack"><strong>{m.name}</strong><span style={{overflowWrap:'anywhere'}}>{m.email}</span>{m.role==='owner'?<span>Owner</span>:<><label className="field">Role for {m.name}<select disabled={busy} value={m.role} onChange={e=>act('role',{userId:m.user_id,role:e.target.value})}>{memberRoles.filter(r=>r!=='store_manager'||org?.hasStore||m.role==='store_manager').map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></label><button className="button secondary" disabled={busy} onClick={()=>act('remove',{userId:m.user_id})}>Remove access</button></>}</article>)}
 <h3>Pending invitations</h3>{!org.invitations?.length&&<p>No pending invitations.</p>}{org.invitations?.map(i=><article key={i.id}><p style={{overflowWrap:'anywhere'}}>{i.email} · {i.role} · Expires {new Date(i.expires_at).toLocaleDateString()}</p><button className="button secondary" disabled={busy} onClick={()=>act('revoke',{invitationId:i.id})}>Revoke invitation</button></article>)}
 </>:<p>Your role is {org.role.replace('_',' ')}. The workspace owner manages invitations and access.</p>}</section>}
 </main>;
}
