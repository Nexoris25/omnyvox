import { user } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TeamSettings } from '@/components/team-settings';
export const metadata={title:'Organisation & team',robots:{index:false,follow:false}};
export default async function Page(){ const account=await user();if(!account || account.mfa_enabled&&!account.mfa_verified)redirect('/login');return <TeamSettings />; }
