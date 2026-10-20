import {NextResponse} from 'next/server';
import {serverDb} from '@/lib/supabase/server';
export async function GET(request:Request){
 const u=new URL(request.url);const code=u.searchParams.get('code');
 const next=new URL('/',u.origin);
 if(code){const db=await serverDb();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(next)}
 next.searchParams.set('auth','1');next.searchParams.set('error','confirmation');
 return NextResponse.redirect(next);
}