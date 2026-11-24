'use client';

import Shell from '@/components/Shell';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import RecoveryMap from '@/components/RecoveryMap';
import {AlertTriangle,ClipboardCheck,Leaf,MapPinned,Sparkles,TrendingUp} from 'lucide-react';

type Site={id:string,name:string,stage:string|null,disturbed_area:number|null,total_area:number|null,latitude:number|null,longitude:number|null};
type Assessment={id:string,assessment_type:string,assessment_date:string|null,status:string|null,overall_score:number|null,site_id:string|null};
type Action={id:string,title:string,status:string|null,priority:string|null,due_date:string|null,progress:number|null,site_id:string|null};

export default function Page(){
 const[sites,setSites]=useState<Site[]>([]),[assessments,setAssessments]=useState<Assessment[]>([]),[actions,setActions]=useState<Action[]>([]);
 useEffect(()=>{(async()=>{const db=createClient();const[s,a,r]=await Promise.all([db.from('sites').select('id,name,stage,disturbed_area,total_area,latitude,longitude'),db.from('assessments').select('id,assessment_type,assessment_date,status,overall_score,site_id').order('assessment_date',{ascending:false}).limit(8),db.from('rehabilitation_actions').select('id,title,status,priority,due_date,progress,site_id').order('due_date',{ascending:true}).limit(20)]);setSites((s.data||[]) as Site[]);setAssessments((a.data||[]) as Assessment[]);setActions((r.data||[]) as Action[]);})();},[]);
 const active=useMemo(()=>sites.filter(s=>s.stage&&s.stage!=='Verified').length,[sites]);
 const land=useMemo(()=>sites.reduce((n,s)=>n+(Number(s.disturbed_area)||0),0),[sites]);
 const progress=useMemo(()=>actions.length?Math.round(actions.reduce((n,a)=>n+(Number(a.progress)||0),0)/actions.length):0,[actions]);
 const openRisk=useMemo(()=>actions.filter(a=>a.priority==='High'||a.priority==='Critical'||a.status==='Blocked').length,[actions]);
 const completed=useMemo(()=>actions.filter(a=>a.status==='Completed'||a.status==='Verified').length,[actions]);
 const names=useMemo(()=>Object.fromEntries(sites.map(s=>[s.id,s.name])),[sites]);
 const stats=[['Active Sites',active,'From registered operational sites'],['Land Under Recovery',land+' ha','Total disturbed area recorded'],['Recovery Progress',progress+'%','Average rehabilitation action progress'],['Open Risks',openRisk,'High, critical or blocked actions']];

 return <Shell title="Rehabilitation Dashboard">
  <div className="flex justify-end gap-2 mb-5"><Link href="/assessments" className="btn btn-primary"><ClipboardCheck size={17}/>Assessment</Link><Link href="/rehabilitation" className="btn btn-primary"><Leaf size={17}/>Rehabilitation</Link></div>
  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{stats.map(([label,value,note])=><section className="card p-5" key={String(label)}><div className="text-sm text-slate-500">{label}</div><div className="text-3xl font-black mt-2">{value}</div><div className="text-xs text-slate-400 mt-2">{note}</div></section>)}</div>

  <div className="grid xl:grid-cols-[1.7fr_1fr] gap-6">
   <section className="card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-black text-lg flex items-center gap-2"><MapPinned size={20}/>Site Recovery Map</h2><span className="text-xs text-slate-500">{sites.filter(s=>s.latitude!==null&&s.longitude!==null).length} mapped sites</span></div><RecoveryMap sites={sites}/></section>
   <section className="card p-5"><h2 className="font-black text-lg">Recovery Progress</h2><div className="grid place-items-center my-5"><div className="w-44 h-44 rounded-full grid place-items-center" style={{background:`conic-gradient(#0f766e ${progress*3.6}deg,#e7eeea 0deg)`}}><div className="w-32 h-32 rounded-full bg-white grid place-items-center text-center"><div><b className="text-3xl">{progress}%</b><div className="text-xs text-slate-500">overall recovery</div></div></div></div></div><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-slate-50 rounded p-3"><b>{completed}</b><div class="text-xs text-slate-500">Completed</div></div><div className="bg-slate-50 rounded p-3"><b>{actions.length-completed}</b><div class="text-xs text-slate-500">Active</div></div><div className="bg-slate-50 rounded p-3"><b>{openRisk}</b><div class="text-xs text-slate-500">Risk actions</div></div></div></section>
  </div>

  <div className="grid xl:grid-cols-2 gap-6 mt-6">
   <section className="card overflow-hidden"><div className="p-5 border-b flex justify-between"><h2 className="font-black flex items-center gap-2"><ClipboardCheck size={19}/>Recent Assessments</h2><Link href="/assessments" className="text-sm font-bold text-green">View all</Link></div>{assessments.length?<div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="p-4">Site</th><th className="p-4">Date</th><th className="p-4">Score</th><th className="p-4">Status</th></tr></thead><tbody>{assessments.map(a=><tr key={a.id} className="border-t"><td className="p-4 font-bold">{names[a.site_id||'']||a.assessment_type}</td><td className="p-4">{a.assessment_date?new Date(a.assessment_date).toLocaleDateString():'—'}</td><td className="p-4">{a.overall_score??'—'}</td><td className="p-4">{a.status||'Draft'}</td></tr>)}</tbody></table></div>:<div className="p-10 text-center text-slate-500">No assessments recorded.</div>}</section>
   <section className="card overflow-hidden"><div className="p-5 border-b flex justify-between"><h2 className="font-black flex items-center gap-2"><Leaf size={19}/>Rehabilitation Actions</h2><Link href="/rehabilitation" className="text-sm font-bold text-green">View all</Link></div>{actions.length?<div className="divide-y">{actions.slice(0,7).map(a=><div key={a.id} className="p-4 flex justify-between gap-4"><div><div className="font-bold">{a.title}</div><div className="text-sm text-slate-500">{names[a.site_id||'']||'No site'} · {a.status||'Planned'}</div></div><div className="text-right"><div className={`text-sm font-bold ${a.priority==='Critical'||a.priority==='High'?'text-red-600':''}`}>{a.priority||'Low priority'}</div><div className="text-xs text-slate-500">{a.progress??0}%</div></div></div>)}</div>:<div className="p-10 text-center text-slate-500">No rehabilitation actions recorded.</div>}</section>
  </div>

  <div className="grid xl:grid-cols-2 gap-6 mt-6"><section className="card p-5"><h2 className="font-black flex items-center gap-2"><AlertTriangle size={19} className="text-amber-600"/>Risk Summary</h2><div className="grid grid-cols-3 gap-3 mt-4">{[['Critical',actions.filter(a=>a.priority==='Critical').length],['High',actions.filter(a=>a.priority==='High').length],['Blocked',actions.filter(a=>a.status==='Blocked').length]].map(([x,y])=><div key={String(x)} className="rounded-xl bg-slate-50 p-4"><div className="text-2xl font-black">{y}</div><div className="text-sm text-slate-500">{x}</div></div>)}</div></section><section className="card p-5"><h2 className="font-black flex items-center gap-2"><Sparkles size={19}/>AI Insights <span className="text-xs bg-emerald-50 text-green px-2 py-1 rounded">Beta</span></h2><p className="text-slate-600 mt-4">Use recorded assessments, sites and rehabilitation actions to generate decision-support guidance.</p><div className="mt-5"><Link href="/ai-assistant" className="btn btn-primary"><TrendingUp size={17}/>Open AI Assistant</Link></div></section></div>
 </Shell>
}
