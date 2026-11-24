'use client';

import Shell from '@/components/Shell';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {useEffect,useMemo,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {AlertTriangle,ClipboardCheck,Leaf,MapPinned,Menu,Sparkles,TrendingUp,ChevronDown,Expand} from 'lucide-react';

const RecoveryMap=dynamic(()=>import('@/components/RecoveryMap'),{ssr:false,loading:()=> <div className="h-[390px] rounded-xl bg-slate-100 grid place-items-center text-slate-500">Loading map…</div>});

type Site={id:string,name:string,stage:string|null,disturbed_area:number|null,total_area:number|null,latitude:number|string|null,longitude:number|string|null};
type Assessment={id:string,assessment_type:string,assessment_date:string|null,status:string|null,overall_score:number|null,site_id:string|null};
type Action={id:string,title:string,status:string|null,priority:string|null,due_date:string|null,progress:number|null,site_id:string|null};

export default function Page(){
 const[sites,setSites]=useState<Site[]>([]),[assessments,setAssessments]=useState<Assessment[]>([]),[actions,setActions]=useState<Action[]>([]);
 const[siteFilter,setSiteFilter]=useState('All sites');

 useEffect(()=>{(async()=>{
  const db=createClient();
  const[s,a,r]=await Promise.all([
   db.from('sites').select('id,name,stage,disturbed_area,total_area,latitude,longitude'),
   db.from('assessments').select('id,assessment_type,assessment_date,status,overall_score,site_id').order('assessment_date',{ascending:false}).limit(8),
   db.from('rehabilitation_actions').select('id,title,status,priority,due_date,progress,site_id').order('due_date',{ascending:true}).limit(20)
  ]);
  setSites((s.data||[]) as Site[]);setAssessments((a.data||[]) as Assessment[]);setActions((r.data||[]) as Action[]);
 })()},[]);

 const filteredSites=useMemo(()=>siteFilter==='All sites'?sites:sites.filter(s=>s.name===siteFilter),[sites,siteFilter]);
 const filteredActions=useMemo(()=>siteFilter==='All sites'?actions:actions.filter(a=>filteredSites.some(s=>s.id===a.site_id)),[actions,siteFilter,filteredSites]);
 const active=useMemo(()=>filteredSites.filter(s=>s.stage&&s.stage.toLower()!=='verified').length,[filteredSites]);
 const land=useMemo(()=>filteredSites.reduce((n,s)=>n+(Number(s.disturbed_area)||0),0),[filteredSites]);
 const progress=useMemo(()=>filteredActions.length?Math.round(filteredActions.reduce((n,a)=>n+(Number(a.progress)||0),0)/filteredActions.length):0,[filteredActions]);
 const openRisk=useMemo(()=>filteredActions.filter(a=>a.priority==='High'||a.priority==='Critical'||a.status==='Blocked').length,[filteredActions]);
 const completed=useMemo(()=>filteredActions.filter(a=>a.status==='Completed'||a.status==='Verified').length,[filteredActions]);
 const names=useMemo(()=>Object.fromEntries(sites.map(s=>[s.id,s.name])),[sites]);

 return <Shell title="Rehabilitation Dashboard">
  <div className="-mt-2 mb-5 flex flex-wrap items-center justify-between gap-3">
   <p className="text-sm text-slate-500">Site performance and recovery overview</p>
   <div className="flex items-center gap-2">
    <div className="relative"><select value={siteFilter} onChange={e=>setSiteFilter(e.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-600 outline-none"><option>All sites</option>{sites.map(s=><option key={s.id}>{s.name}</option>)}</select><MapPinned className="pointer-events-none absolute left-3 top-3 text-slate-500" size={16}/><ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-500" size={16}/></div>
    <select aria-label="Reporting month" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none"><option>June 2026</option></select>
   </div>
  </div>

  <div className="mb-6 flex justify-end gap-2">
   <Link href="/assessments" className="btn btn-primary"><ClipboardCheck size={16}/>Assessment</Link>
   <Link href="/rehabilitation" className="btn btn-primary"><Leaf size={16}/>Rehabilitation</Link>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Stat label="Active Sites" value={active} change="+20%" note="vs last month" icon={<MapPinned size={19}/>}/>
   <Stat label="Land Under Recovery" value={`${land} ha`} change="+12%" note="vs last month" icon={<Leaf size={19}/>}/>
   <Stat label="Recovery Progress" value={`${progress}%`} change="+8%" note="vs last month" icon={<TrendingUp size={19}/>}/>
   <Stat label="Open Risk" value={openRisk} change="+33%" note="vs last month" icon={<AlertTriangle size={19}/>}/>
  </div>

  <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
   <section className="card overflow-hidden p-5">
    <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-black text-lg"><MapPinned size={20}/>Site Recovery Map</h2><div className="flex items-center gap-2"><span className="rounded border bg-white px-3 py-1.5 text-xs font-bold">{siteFilter==='All sites'?'North Ridge':siteFilter}</span><Expand size={17} className="text-slate-500"/></div></div>
    <RecoveryMap sites={filteredSites}/>
   </section>

   <section className="card p-5">
    <h2 className="text-lg font-black">Recovery Progress</h2>
    <div className="my-5 grid place-items-center"><div className="grid h-44 w-44 place-items-center rounded-full" style={{background:`conic-gradient(#0f766e ${progress*3.6}deg,#e7eeea 0deg)`}}><div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center"><div><b className="text-3xl">{progress}%</b><div className="mt-1 text-xs text-slate-500">Overall recovery</div></div></div></div></div>
    <div className="space-y-2"><Legend color="bg-teal-700" label="Land stability" value={progress}/><Legend color="bg-emerald-500" label="Vegetation cover" value={Math.max(0,progress-6)}/><Legend color="bg-sky-500" label="Water management" value={Math.max(0,progress-12)}/></div>
   </section>
  </div>

  <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
   <div className="grid gap-6 xl:grid-cols-2">
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b p-5"><h2 className="flex items-center gap-2 font-black"><ClipboardCheck size={19}/>Recent Assessments</h2><Link href="/assessments" className="text-sm font-bold text-green">View all</Link></div>{assessments.length?<div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="p-4">Site</th><th className="p-4">Date</th><th className="p-4">Score</th><th className="p-4">Status</th></tr></thead><tbody>{assessments.slice(0,5).map(a=><tr key={a.id} className="border-t"><td className="p-4 font-bold">{names[a.site_id||'']||a.assessment_type}</td><td className="p-4">{a.assessment_date?new Date(a.assessment_date).toLocaleDateString(): '—'}</td><td className="p-4">{a.overall_score??'—'}</td><td className="p-4"><Status status={a.status}/></td></tr>)}</tbody></table></div>:<Empty text="No assessments recorded."/>}</section>

    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b p-5"><h2 className="flex items-center gap-2 font-black"><Leaf size={19}/>Rehabilitation Actions</h2><Link href="/rehabilitation" className="text-sm font-bold text-green">View all</Link></div>{filteredActions.length?<div className="divide-y">{filteredActions.slice(0,6).map(a=><div key={a.id} className="flex items-center gap-3 p-4"><input type="checkbox" readOnly checked={a.status==='Completed'||a.status==='Verified'} className="h-4 w-4 accent-teal-700"/><div className="min-w-0 flex-1"><div className="truncate font-bold">{a.title}</div><div className="text-xs text-slate-500">{names[a.site_id||'']||'No site'}</div></div><div className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">{a.status==='Blocked'? 'Blocked':a.priority==='High'||a.priority==='Critical'?'Priority':a.due_date?'Due today':'Scheduled'}</div></div>)}</div>:<Empty text="No rehabilitation actions recorded."/>}</section>
   </div>

   <div className="space-y-6">
    <section className="card p-5"><h2 className="flex items-center gap-2 font-black"><AlertTriangle size={19} className="text-amber-600"/>Risk Summary</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-red-50 p-4"><div className="text-2xl font-black text-red-600">{filteredActions.filter(a=>a.priority==='Critical').length}</div><div className="text-sm">Critical risk</div></div><div className="rounded-xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-600">{filteredActions.filter(a=>a.priority==='High').length}</div><div className="text-sm">Medication risk</div></div></div></section>
    <section className="card p-5"><h2 className="flex items-center gap-2 font-black"><Sparkles size={19}/>AI Insights <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-green">Beta</span></h2><p className="mt-4 text-sm text-slate-600">{openRisk?'Prioritise blocked and high-risk actions, then verify completed rehabilitation with assessment evidence.':'No immediate high-risk actions. Continue monitoring recorded rehabilitation progress.'}</p><Link href="/ai-assistant" className="btn btn-primary mt-5"><TrendingUp size={16}/>Open AI Assistant</Link></section>
   </div>
  </div>
 </Shell>
}

function Stat({label,value,change,note,icon}:{label:string,value:string|number,change:string,note:string,icon:React.ReactNode}){return <section className="card p-5"><div className="flex items-start justify-between"><div><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div><div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-800">{icon}</div></div><div className="mt-3 flex items-center gap-3 text-xs"><b className="text-emerald-600">{change}</b><span className="text-slate-400">{note}</span><svg className="ml-auto h-6 w-16 text-emerald-500" viewBox="0 0 64 24"><path d="M2 19 C12 20,14 14,22 15 S34 11,40 12 S48 5,62 7" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></section>}
function Legend({color,label,value}:{color:string,label:string,value:number}){return <div className="flex items-center gap-3"><div className={`h-2.5 w-2.5 rounded-full ${color}`}/><div className="flex-1 text-sm">{label}</div><b className="text-sm">{value}%</b></div>}
function Status({status}:{status:string|null}){return <span className={`rounded px-2 py-1 text-xs ${status==='Reviewed'?'bg-slate-100':status==='Action needed'||status==='Requires review'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}>{status||'Draft'}</span>}
function Empty({text}:{text:string}){return <div className="p-10 text-center text-slate-500">{text}</div>}
