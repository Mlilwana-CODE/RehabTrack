import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export async function GET(){const db=createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const{data,error}=await db.from('sites').select('id,name').order('name').limit(100);if(error)return NextResponse.json({error:'Could not load accessible sites.'},{status:503});return NextResponse.json({sites:data||[]})}
