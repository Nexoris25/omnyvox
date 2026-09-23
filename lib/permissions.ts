export const memberRoles = ['administrator','editor','store_manager','analyst'] as const;
export type MemberRole = 'owner' | typeof memberRoles[number];
export const staffRoles = ['operations','billing','support','designer','content','finance','technical','compliance'] as const;
export function isStaff(role: string) { return role === 'super_admin' || (staffRoles as readonly string[]).includes(role); }
const editorial = ['pages','articles','authors','categories','media','media-usage','history','readiness','modules','offerings','projects','people','programmes','properties','facilities','locations'];
export function canSite(role: string, kind: string | undefined, method: string) {
  if (role === 'owner') return true;
  if (!kind) return method === 'GET' || role === 'administrator' && method === 'PATCH';
  if (['billing','billing-history','renewal','export','merchant','domains','recipients','forms','ai','business'].includes(kind)) return false;
  if (role === 'administrator') return [...editorial,'legal','products','orders','fulfilment','enquiries','publish','support','services'].includes(kind);
  if (role === 'editor') return editorial.includes(kind) && ['GET','POST','PATCH'].includes(method);
  if (role === 'store_manager') return ['products','categories','orders','fulfilment','media','media-usage','modules','readiness'].includes(kind);
  if (role === 'analyst') return method === 'GET' && ['modules','readiness','analytics'].includes(kind);
  return false;
}
/** Deny unknown paths and actions; super-admin is the only unrestricted staff role. */
export function canInternal(role: string, path: string[], method: string) {
  if (role === 'super_admin') return true;
  if (!isStaff(role)) return false;
  const [area,kind] = path;
  if (area === 'kyb-admin') return role === 'compliance' && ['GET','PATCH'].includes(method);
  if (area === 'marketing') {
    if (role === 'content') return ['articles','authors','categories','pages','media'].includes(kind) && ['GET','POST','PATCH','DELETE'].includes(method);
    if (role === 'designer') return ['pages','media'].includes(kind) && ['GET','POST','PATCH'].includes(method);
    if (role === 'compliance') return kind === 'legal' && ['GET','POST','PATCH'].includes(method);
    return false;
  }
  if (area !== 'platform-admin') return false;
  if(kind==='recovery')return role==='compliance'&&['GET','POST'].includes(method);
  const allowed: Record<string,string[]> = {
    operations:['users','subscriptions','requests','payments'], billing:['subscriptions'],
    finance:['subscriptions','merchants','payments'], support:['support','requests','payments'],
    technical:['domains','storage','ai'], compliance:['merchants'], designer:[],content:[],
  };
  if (!(allowed[role] || []).includes(kind)) return false;
  if (method === 'GET') return true;
  return method === 'PATCH' && ((role === 'support' && ['support','requests'].includes(kind)) || (role === 'technical' && ['domains','ai'].includes(kind)) || (role === 'compliance' && kind === 'merchants'));
}
