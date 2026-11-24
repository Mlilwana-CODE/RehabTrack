'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Bell,CheckCircle2,TriangleAlert,Clock3} from 'lucide-react';
import {createClient} from '@/lib/supabase/client';

type Notice={id:string,title:string,detail:string,href:string,kind:'risk'|'overdue'|'assessment'};

export default function NotificationBell(){
 const[open,setOpen]=useState(false);
 const[notices,setNotices]=useState<Notice[]>([]);
 const root=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  (async()=>{
   const db=createClient();
   const today=new Date().toISOString().slice(0,10);
   const[{data:actions},{data:assessments}]=await Promise.all([
    db.from('rehabilitation_actions').select('id,title,status,priority,due_date').limit(100),
    db.from('assessments').select('id,assessment_type,assessment_date,status').order('assessment_date',{ascending:false}).limit(5)
   ]);
   const next:Notice[]=[];
   for(const action of actions||[]){
    if(action.status==='Blocked'||action.priority==='Critical'||action.priority==='High'){
     next.push({id:action.id,title:action.title||'Priority action',detail:action.status==='Blocked'?'This action is blocked':`${action.priority} priority`,href:'/rehabilitation',kind:'risk'});
    }else if(action.due_date&&action.due_date<today&&action.status!=='Completed'&&action.status!=='Verified'){
     next.push({id:action.id,title:action.title||'Overdue action',detail:`Due ${new Date(action.due_date).toLocaleDateString()}`,href:'/rehabilitation',kind:'overdue'});
    }
   }
   for(const assessment of assessments||[]){
    if(assessment.status==='Action needed'||assessment.status==='Requires review'){
     next.push({id:assessment.id,title:assessment.assessment_type||'Assessment',detail:assessment.status||'Review required',href:'/assessments',kind:'assessment'});
    }
   }
   setNotices(next.slice(0,8));
  })();
 },[]);

 useEffect(()=>{
  const close=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};
  document.addEventListener('mousedown',close);
  return ()=>document.removeEventListener('mousedown',close);
 },[]);

 return <div ref={root} className="relative">
  <button type="button" aria-label="Notifications" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
   <Bell size={20}/>
   {notices.length>0&&<span className="absolute -right-1 -top-1 grid min-w-5 h-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{notices.length}</span>}
  </button>
  {open&&<div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
   <div className="flex items-center justify-between border-b px-4 py-3"><b>Notifications</b><span className="text-xs text-slate-500">{notices.length} new</span></div>
   {notices.length? <div className="max-h-96 overflow-y-auto">{notices.map(notice=><Link key={notice.id} href={notice.href} onClick={()=>setOpen(false)} className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-slate-50">
    <span className={`mt-0.5 ${notice.kind==='overdue'?'text-amber-600':'text-red-600'}`}>{notice.kind==='assessment'?<CheckCircle2 size={18}/>:notice.kind==='overdue'?<Clock3 size={18}/>:<TriangleAlert size={18}/>}</span>
    <span><b className="block text-sm">{notice.title}</b><span className="text-xs text-slate-500">{notice.detail}</span></span>
   </Link>)}</div>:<div className="px-4 py-8 text-center text-sm text-slate-500">No active notifications.</div>}
  </div>}
 </div>
}
