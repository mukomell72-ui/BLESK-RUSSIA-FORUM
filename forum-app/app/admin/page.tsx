import {serverDb} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
import AdminApp from '@/components/AdminApp';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const db=await serverDb();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/?auth=1');
 const {data:can,error}=await db.rpc('blezz_forum_can',{p:'manage_structure'});
 const {data:theme}=await db.rpc('blezz_forum_can',{p:'manage_theme'});
 const {data:roles}=await db.rpc('blezz_forum_can',{p:'manage_roles'});
 const {data:review}=await db.rpc('blezz_forum_can',{p:'review_cases'});
 if(error||!(can||theme||roles||review))redirect('/');
 return <AdminApp/>;
}