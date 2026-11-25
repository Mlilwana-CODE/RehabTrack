import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_PROMPT=4000;
const SYSTEM_PROMPT=`You are RehabTrack's rehabilitation decision-support assistant for mine rehabilitation managers, environmental officers, consultants, and regulators. Help with rehabilitation progress, site recovery, vegetation restoration, erosion control, water quality risks, mine closure, environmental compliance, mitigation, assessment results, recommendations, monitoring schedules, and report drafting. Use only the supplied authenticated user's platform data when answering data-specific questions. Be explicit when evidence is missing, never invent measurements, dates, legal requirements, or trends. Distinguish evidence from recommendations, explain uncertainty, and advise verification against the applicable permit, closure plan, and local regulations. You are decision support, not a substitute for qualified environmental or engineering review. Be concise and structured.`;

function jsonError(message:string,status:number,headers?:HeadersInit){return NextResponse.json({error:message},{status,headers})}

export async function POST(request:Request){
 let body:any;
 try{body=await request.json()}catch{return jsonError('Request body must be valid JSON.',400)}
 const question=typeof body?.question==='string'?body.question.trim():'';
 if(!question||question.length>MAX_PROMPT)return jsonError(`Enter a question of 1–${MAX_PROMPT} characters.`,400);
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey)return jsonError('AI is not configured. Add OPENAI_API_KEY to the server environment.',503);
 const db=createClient();
 const{data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return jsonError('Please sign in again to use the AI assistant.',401);
 const since=new Date(Date.now()-60_000).toISOString();
 const{count:recent,error:rateError}=await db.from('ai_messages').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('role','user').gte('created_at',since);
 if(rateError)return jsonError('AI conversation storage is unavailable. Apply the AI database migration and try again.',503);
 if((recent||0)>=12)return jsonError('You have reached the assistant limit of 12 messages per minute. Try again shortly.',429,{'Retry-After':'60'});
 const siteId=typeof body.siteId==='string'&&body.siteId.length<80?body.siteId:null;
 let conversationId=typeof body.conversationId==='string'?body.conversationId:null;
 let conversation:any=null;
 if(conversationId){const result=await db.from('ai_conversations').select('id,site_id,title').eq('id',conversationId).eq('user_id',user.id).maybeSingle();if(result.error)return jsonError('Could not load this conversation.',503);conversation=result.data;if(!conversation)return jsonError('Conversation not found.',404)}
 else{const result=await db.from('ai_conversations').insert({user_id:user.id,site_id:siteId,title:question.slice(0,72)||'New conversation'}).select('id,site_id,title').single();if(result.error)return jsonError('Could not create conversation. Apply the AI database migration and retry.',503);conversation=result.data;conversationId=conversation.id}
 const effectiveSite=siteId||conversation.site_id||null;
 const insertUser=await db.from('ai_messages').insert({conversation_id:conversationId,user_id:user.id,role:'user',content:question});
 if(insertUser.error)return jsonError('Could not save your message. Check the AI database migration and permissions.',503);
 const history=await db.from('ai_messages').select('role,content').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(20);
 if(history.error)return jsonError('Could not load conversation context.',503);
 const siteQuery=()=>{let q=db.from('sites').select('id,name,stage,country,disturbed_area,total_area,latitude,longitude').order('name').limit(50);if(effectiveSite)q=q.eq('id',effectiveSite);return q};
 const assessmentQuery=()=>{let q=db.from('assessments').select('id,site_id,assessment_type,assessment_date,overall_score,erosion_score,vegetation_score,water_drainage_score,compliance_score,observations,recommended_actions,status').order('assessment_date',{ascending:false}).limit(40);if(effectiveSite)q=q.eq('site_id',effectiveSite);return q};
 const actionQuery=()=>{let q=db.from('rehabilitation_actions').select('id,site_id,title,category,priority,due_date,progress,status,description').order('due_date',{ascending:true}).limit(60);if(effectiveSite)q=q.eq('site_id',effectiveSite);return q};
 const reportQuery=()=>{let q=db.from('reports').select('id,site_id,report_type,period_start,period_end,content,created_at').order('created_at',{ascending:false}).limit(20);if(effectiveSite)q=q.eq('site_id',effectiveSite);return q};
 const[sites,assessments,actions,reports]=await Promise.all([siteQuery(),assessmentQuery(),actionQuery(),reportQuery()]);
 const failed=[sites,assessments,actions,reports].find(result=>result.error);
 if(failed)return jsonError('Could not safely load your rehabilitation data. Check table access and RLS policies.',503);
 const siteName=(sites.data||[]).find((s:any)=>s.id===effectiveSite)?.name;
 const context={siteScope:siteName||'all sites',sites:sites.data||[],assessments:assessments.data||[],rehabilitationActions:actions.data||[],reports:reports.data||[]};
 let provider:Response;
 try{provider=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',stream:true,temperature:0.3,messages:[{role:'system',content:`${SYSTEM_PROMPT}\n\nAuthenticated user platform data (JSON): ${JSON.stringify(context)}`},...(history.data||[]).map((m:any)=>({role:m.role,content:m.content}))]})})}catch{return jsonError('Could not connect to the AI provider. Please retry.',502)}
 if(!provider.ok){const retry=provider.headers.get('retry-after');if(provider.status===429)return jsonError('The AI provider is rate-limiting requests. Try again shortly.',429,retry?{'Retry-After':retry}:undefined);if(provider.status===401)return jsonError('The server AI key was rejected. Check OPENAI_API_KEY.',503);return jsonError('The AI provider could not complete this request.',502)}
 if(!provider.body)return jsonError('The AI provider returned an empty stream.',502);
 const id=conversationId;
 const stream=new ReadableStream<Uint8Array>({async start(controller){const reader=provider.body!.getReader(),decoder=new TextDecoder();let pending='',answer='';const send=(event:any)=>controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));const processLine=async(line:string)=>{if(!line.startsWith('data:'))return;const value=line.slice(5).trim();if(value==='[DONE]')return;try{const packet=JSON.parse(value),delta=packet.choices?.[0]?.delta?.content;if(typeof delta==='string'&&delta){answer+=delta;send({delta})}}catch{}};try{while(true){const{value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});const lines=pending.split(/\r?\n/);pending=lines.pop()||'';for(const line of lines)await processLine(line)}if(pending)await processLine(pending);if(!answer.trim()){send({error:'The assistant returned an empty response.'});controller.close();return}const saved=await db.from('ai_messages').insert({conversation_id:id,user_id:user.id,role:'assistant',content:answer});if(saved.error){send({error:'Response generated but could not be saved to conversation history.'});controller.close();return}await db.from('ai_conversations').update({updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id);send({done:true,conversationId:id});controller.close()}catch{send({error:'The response stream was interrupted. Try again; saved conversation history is preserved.'});controller.close()}}});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'}});
}
