import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export async function GET(){const db=createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const{data,error}=await db.from('ai_insights').select('id,site_id,insight,category,severity,created_at').eq('user_id',user.id).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(4);if(error)return NextResponse.json({error:'Could not load AI insights.'},{status:503});return NextResponse.json({insights:data||[]})}
