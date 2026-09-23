import { pool,query } from './db';
export class ConsentError extends Error {}
export async function currentPolicies(){return query<{id:string;slug:string;title:string}>("SELECT DISTINCT ON (v.slug) v.id,v.slug,v.title FROM platform_policy_versions v WHERE EXISTS(SELECT 1 FROM marketing_records r WHERE r.kind='legal' AND r.data->>'slug'=v.slug AND r.data->>'status'='published') ORDER BY v.slug,v.sequence DESC");}
export async function registerAccount(input:{name:string;email:string;phone:string;passwordHash:string;terms:string;privacy:string}){
 const c=await pool.connect();try{
  await c.query('BEGIN');
  // The publisher updates these same rows, so agreement cannot race a policy replacement.
  await c.query("SELECT id FROM marketing_records WHERE kind='legal' AND data->>'slug' IN ('terms','privacy') ORDER BY id FOR SHARE");
  const {rows}=await c.query("SELECT DISTINCT ON (v.slug) v.id,v.slug FROM platform_policy_versions v WHERE EXISTS(SELECT 1 FROM marketing_records r WHERE r.kind='legal' AND r.data->>'slug'=v.slug AND r.data->>'status'='published') ORDER BY v.slug,v.sequence DESC");
  if(rows.length!==2 || rows.some(r=>r.id!==input[r.slug as 'terms'|'privacy'])) throw new ConsentError('The platform policies changed or are unavailable. Reload the registration page and review them before continuing.');
  const {rows:[u]}=await c.query("INSERT INTO users(name,email,password,phone,role) VALUES($1,$2,$3,$4,'owner') RETURNING id",[input.name,input.email,input.passwordHash,input.phone]);
  for(const v of rows)await c.query('INSERT INTO account_consents(user_id,policy_version) VALUES($1,$2)',[u.id,v.id]);
  await c.query('COMMIT');return u as {id:string};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
