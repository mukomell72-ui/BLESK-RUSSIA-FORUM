import {serverDb} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
import AdminApp from '@/components/AdminApp';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const db=await serverDb();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/?auth=1');
 const permissions=['moderate','review_cases','manage_roles','manage_structure','manage_news','manage_theme','audit'];
 const grants=await Promise.all(permissions.map(p=>db.rpc('blezz_forum_can',{p})));
 if(!grants.some(r=>!r.error&&r.data===true))redirect('/');
 return <AdminApp/>;
}