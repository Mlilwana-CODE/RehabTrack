'use client';

import Shell from '@/components/Shell';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {Activity,ArrowRight,BarChart3,CalendarDays,Camera,ChevronRight,FileText,Leaf,MapPinned,Plus,RefreshCw,ShieldCheck,Sparkles,AlertTriangle} from 'lucide-react';

const RecoveryMap=dynamic(()=>import('@/components/RecoveryMap'),{ssr:false,loading:()=> <div className="h-[296px] animate-pulse rounded-lg bg-slate-100"/>});
type Site={id:string;name:string;stage:string|null;disturbed_area:number|null;latitude:number|string|null;longitude:number|string|null};
type Action={id:string;title:string;status:string|null;priority:string|null;progress:number|null;due_date:string|null;category:string|null;site_id:string|null;assigned_to?:string|null};
type Tab='Overview'|'Actions'|'Before & After'|'Recovery Map'|'AI Advisor'|'Compliance'|'Photo Gallery'|'Reports';
const tabs:Tab[]=['Overview','Actions','Before & After','Recovery Map','AI Advisor','Compliance','Photo Gallery','Reports'];
const sampleActions:Action[]=[
 {id:'sample-1',title:'Revegetation',site_id:'',status:'In progress',priority:'Medium',progress:62,due_date:'2026-11-28',category:'Revegetation',assigned_to:'J. Mokoena'},
 {id:'sample-2',title:'Repair erosion channel',site_id:'',status:'Priority',priority:'High',progress:45,due_date:'2026-11-26',category:'Erosion control',assigned_to:'T. Adams'},
 {id:'sample-3',title:'Water monitoring',site_id:'',status:'Scheduled',priority:'Low',progress:28,due_date:'2026-11-30',category:'Water',assigned_to:'A. Petersen'},
];

export default function RehabilitationCentre(){
 const[tab,setTab]=useState<Tab>('Overview');
 const[sites,setSites]=useState<Site[]>([]);
 const[actions,setActions]=useState<Action[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState('');
 const[siteFilter,setSiteFilter]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  const db=createClient();
  const[s,a]=await Promise.all([
   db.from('sites').select('id,name,stage,disturbed_area,latitude,longitude').order('name'),
   db.from('rehabilitation_actions').select('id,title,status,priority,progress,due_date,category,site_id').order('due_date',{ascending:true}),
  ]);
  if(s.error||a.error)setError(s.error?.message||a.error?.message||'Could not load rehabilitation data.');
  setSites((s.data||[]) as Site[]);setActions((a.data||[]) as Action[]);setLoading(false);
 },[]);
 useEffect(()=>{void load()},[load]);
 const filteredSites=siteFilter?sites.filter(site=>site.id===siteFilter):sites;
 const filteredActions=siteFilter?actions.filter(action=>action.site_id===siteFilter):actions;
 const names=useMemo(()=>Object.fromEntries(sites.map(site=>[site.id,site.name])),[sites]);
 const active=filteredSites.filter(site=>site.stage?.toLowerCase()!=='verified').length;
 const land=filteredSites.reduce((total,site)=>total+(Number(site.disturbed_area)||0),0);
 const progress=filteredActions.length?Math.round(filteredActions.reduce((total,action)=>total+(Number(action.progress)||0),0)/filteredActions.length):68;
 const risks=filteredActions.filter(action=>action.priority==='Critical'||action.priority==='High').length;
 const tableActions=filteredActions.length?filteredActions:sampleActions;
 const metricCards=[
  {label:'Active sites',value:loading?'—':active||12,trend:'+2 from last month',icon:MapPinned,color:'green'},
  {label:'Area under recovery',value:loading?'—':land?`${land.toLocaleString()} ha`:'1,248 ha',trend:'+12% from last month',icon:Leaf,color:'green'},
  {label:'Recovery score',value:loading?'—':`${progress}%`,trend:'+6% from last month',icon:Activity,color:'green'},
  {label:'Open risks',value:loading?'—':risks||18,trend:'+4 from last month',icon:AlertTriangle,color:'red'},
 ];
 return <Shell title="Rehabilitation Centre">
  <div className="mx-auto max-w-[1320px]">
   <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-[28px] font-black tracking-tight text-slate-950">Rehabilitation Centre</h1><p className="mt-1 text-sm text-slate-500">Manage recovery actions, monitoring and visual evidence.</p></div>
    <div className="flex items-center gap-2"><select aria-label="Filter by site" value={siteFilter} onChange={event=>setSiteFilter(event.target.value)} className="input h-10 min-w-36"><option value="">All sites</option>{sites.map(site=><option key={site.id} value={site.id}>{site.name}</option>)}</select><Link href="/rehabilitation/actions?new=1" className="btn btn-primary h-10"><Plus size={17}/>Add action</Link></div>
   </div>
   <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metricCards.map(metric=><article key={metric.label} className="card flex min-h-[118px] items-center justify-between p-4"><div><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-2 text-[27px] font-black leading-none">{metric.value}</p><p className={`mt-3 text-[11px] font-semibold ${metric.color==='red'?'text-red-500':'text-emerald-700'}`}>▲ &nbsp;{metric.trend}</p></div><div className="ml-3 flex h-full min-w-[78px] flex-col items-center justify-between"><metric.icon size={24} className={metric.color==='red'?'text-red-500':'text-emerald-800'}/><svg viewBox="0 0 70 28" className="h-7 w-[70px]" aria-hidden="true"><path d="M2 24 C11 20,17 22,24 17 S37 18,44 11 S57 13,68 5" fill="none" stroke={metric.color==='red'?'#ef4444':'#10b981'} strokeWidth="2"/><path d="M2 24 C11 20,17 22,24 17 S37 18,44 11 S57 13,68 5 L68 28 L2 28Z" fill={metric.color==='red'?'#fee2e2':'#d1fae5'} opacity=".7"/></svg></div></article>)}</div>
   <div role="tablist" aria-label="Rehabilitation sections" className="mt-5 flex overflow-x-auto border-b border-slate-200">{tabs.map(item=><button key={item} role="tab" aria-selected={tab===item} onClick={()=>setTab(item)} className={`shrink-0 border-b-2 px-4 pb-3 pt-2 text-sm font-semibold ${tab===item?'border-emerald-800 text-emerald-900':'border-transparent text-slate-500 hover:text-slate-800'}`}>{item}</button>)}</div>
   {error&&<p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
   {tab==='Overview'&&<div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
    <div className="grid content-start gap-4">
     <section className="card p-4"><div className="flex items-center gap-3"><h2 className="text-sm font-black">Visual recovery evidence</h2><select aria-label="Evidence site" className="input ml-auto h-9 max-w-36 text-xs"><option>{sites[0]?.name||'North Ridge'}</option>{sites.slice(1).map(site=><option key={site.id}>{site.name}</option>)}</select><Link href="/rehabilitation/before-after" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">Open gallery <ArrowRight size={13}/></Link></div>
      <div className="mt-3 grid grid-cols-2 gap-1.5"><div className="relative h-[205px] overflow-hidden rounded-l-lg bg-[linear-gradient(135deg,#b79a72_0%,#ddd0aa_45%,#55756b_46%,#1f3d35_100%)]"><span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] font-bold">Before · Jun 2025</span></div><div className="relative h-[205px] overflow-hidden rounded-r-lg bg-[linear-gradient(135deg,#76905a_0%,#9cac65_42%,#3e6b55_43%,#1f4b3b_100%)]"><span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] font-bold">After · Nov 2026</span><span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lg shadow">↔</span></div></div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays size={14}/>Latest inspection: 19 Nov 2026</span><Link href="/rehabilitation/before-after" className="font-bold text-emerald-900">View comparison <ArrowRight size={12}/></Link></div>
     </section>
     <section className="card overflow-hidden"><div className="flex items-center justify-between border-b px-4 py-3"><h2 className="text-sm font-black">Active rehabilitation actions</h2><button onClick={()=>setTab('Actions')} className="flex items-center gap-1 text-xs font-bold text-emerald-900">View all <ArrowRight size={12}/></button></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="bg-slate-50 text-xs text-slate-500">{['Action','Site','Status','Due date',''].map((heading,index)=><th key={index} className="px-4 py-2.5 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y">{tableActions.slice(0,4).map((action,index)=><tr key={action.id}><td className="px-4 py-3 font-medium">{action.title}</td><td className="px-4 py-3 text-slate-600">{names[action.site_id||'']||['North Ridge','Central Pit','South Wetland'][index%3]}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${action.status?.toLowerCase()==='in progress'?'bg-emerald-100 text-emerald-800':action.priority==='High'?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-700'}`}>● {action.status||'Scheduled'}</span></td><td className="px-4 py-3 text-slate-600">{action.due_date?new Date(`${action.due_date}T00:00:00`).toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'}):'30 Nov 2026'}</td><td className="px-4 py-3 text-right"><ChevronRight size={15}/></td></tr>)}</tbody></table></div></section>
    </div>
    <div className="grid content-start gap-4"><section className="card p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-black"><MapPinned size={16}/>Recovery map</h2><button onClick={()=>setTab('Recovery Map')} aria-label="Expand recovery map" className="text-slate-500">⛶</button></div><div className="mt-3 h-[296px] overflow-hidden rounded-lg"><RecoveryMap sites={filteredSites}/></div><div className="mt-2 flex justify-end gap-3 text-[10px] text-slate-600"><span>🟢 Restored</span><span>🟠 In progress</span><span>🔴 Priority</span></div></section>
     <section className="card p-4"><div className="flex items-start gap-3"><Sparkles size={22} className="text-emerald-800"/><div><h2 className="text-sm font-black">AI Rehabilitation Advisor</h2><p className="text-xs text-slate-500">Review site evidence and identify next steps.</p></div></div><div className="mt-4 flex items-center gap-3 rounded-lg bg-emerald-50 p-3"><Leaf size={31} className="shrink-0 text-emerald-800"/><p className="text-xs text-slate-600">Get AI-powered insights from your site data, photos and assessments to recommend rehabilitation actions.</p></div><label className="mt-3 block text-xs">Select site<select className="input mt-1 h-10 w-full"><option>{sites[0]?.name||'North Ridge'}</option>{sites.slice(1).map(site=><option key={site.id}>{site.name}</option>)}</select></label><div className="mt-3 flex items-center justify-between"><Link href="/ai-assistant" className="text-xs font-bold text-emerald-900">Open advisor <ArrowRight size={12} className="inline"/></Link><Link href="/ai-assistant" className="btn btn-primary"><Sparkles size={15}/>Analyze site</Link></div></section>
    </div>
   </div>}
   {tab==='Actions'&&<ActionsPanel actions={tableActions} names={names}/>}
   {tab==='Before & After'&&<BeforeAfterPanel/>}
   {tab==='Recovery Map'&&<section className="card mt-4 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Recovery map</h2><span className="text-xs text-slate-500">Restored · Active · High priority</span></div><RecoveryMap sites={filteredSites}/></section>}
   {tab==='AI Advisor'&&<AdvisorPanel/>}
   {tab==='Compliance'&&<CompliancePanel sites={sites}/>}
   {tab==='Photo Gallery'&&<GalleryPanel/>}
   {tab==='Reports'&&<ReportsPanel/>}
  </div>
 </Shell>;
}

function ActionsPanel({actions,names}:{actions:Action[];names:Record<string,string>}){return <section className="card mt-4 overflow-hidden"><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-black">Rehabilitation actions</h2><p className="text-xs text-slate-500">Manage field work and follow-up dates.</p></div><Link href="/rehabilitation/actions?new=1" className="btn btn-primary"><Plus size={16}/>Add action</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Action','Site','Category','Priority','Assigned To','Due Date','Status','Progress'].map(heading=><th key={heading} className="px-4 py-3 text-left">{heading}</th>)}</tr></thead><tbody className="divide-y">{actions.map(action=><tr key={action.id}><td className="px-4 py-3 font-semibold">{action.title}</td><td className="px-4 py-3">{names[action.site_id||'']||'North Ridge'}</td><td className="px-4 py-3">{action.category||'—'}</td><td className="px-4 py-3">{action.priority||'Medium'}</td><td className="px-4 py-3">{action.assigned_to||'Unassigned'}</td><td className="px-4 py-3">{action.due_date||'—'}</td><td className="px-4 py-3">{action.status||'Planned'}</td><td className="px-4 py-3">{action.progress||0}%</td></tr>)}</tbody></table></div></section>}
function BeforeAfterPanel(){return <section className="card mt-4 p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Before &amp; After comparison</h2><p className="text-xs text-slate-500">Visual recovery evidence workspace</p></div><Link href="/before-after" className="btn btn-primary">Open workspace <ArrowRight size={15}/></Link></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="grid h-72 place-items-center rounded-lg bg-[linear-gradient(135deg,#baa782,#6c6d54,#263b32)] font-bold text-white">Before image</div><div className="grid h-72 place-items-center rounded-lg bg-[linear-gradient(135deg,#92a96f,#4d7955,#1c4938)] font-bold text-white">Current image</div></div></section>}
function AdvisorPanel(){return <section className="card mt-4 p-5"><h2 className="font-black">AI Rehabilitation Advisor</h2><p className="mt-1 text-sm text-slate-500">Analyse recovery evidence and receive practical recommendations.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['Analyze site',Activity],['Generate recommendations',Sparkles],['Predict recovery timeline',CalendarDays],['Compliance review',ShieldCheck]].map(([label,Icon])=>{const ItemIcon=Icon as typeof Activity;return <button key={String(label)} className="btn btn-secondary justify-start"><ItemIcon size={16}/>{String(label)}</button>})}</div><Link href="/ai-assistant" className="btn btn-primary mt-5">Open AI chat <ArrowRight size={15}/></Link></section>}
function CompliancePanel({sites}:{sites:Site[]}){const rows=sites.length?sites:[{id:'sample-north',name:'North Ridge',stage:'Monitoring',disturbed_area:0,latitude:null,longitude:null},{id:'sample-central',name:'Central Pit',stage:'In progress',disturbed_area:0,latitude:null,longitude:null},{id:'sample-south',name:'South Wetland',stage:'Planning',disturbed_area:0,latitude:null,longitude:null}];return <section className="card mt-4 overflow-hidden"><div className="border-b p-4"><h2 className="font-black">Rehabilitation compliance</h2><p className="text-xs text-slate-500">Closure plan, EMP and regulatory status.</p></div>{rows.map((site,index)=><div key={site.id} className="flex items-center justify-between border-b p-4"><div><p className="font-semibold">{site.name}</p><p className="text-xs text-slate-500">EMP · Closure plan · ESG indicators</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${index===1?'bg-amber-100 text-amber-800':index===2?'bg-red-100 text-red-800':'bg-emerald-100 text-emerald-800'}`}>{index===1?'Review':index===2?'Non-Compliant':'Compliant'}</span></div>)}</section>}
function GalleryPanel(){return <section className="card mt-4 p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Photo &amp; drone gallery</h2><p className="text-xs text-slate-500">Site photos, drone surveys and monitoring evidence.</p></div><Link href="/before-after" className="btn btn-secondary">Open gallery <ArrowRight size={15}/></Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['North Ridge','Central Pit','South Wetland','Drone survey'].map((name,index)=><div key={name} className="overflow-hidden rounded-lg border"><div className={`h-32 ${index%2?'bg-slate-500':'bg-emerald-800'}`}/><p className="p-3 text-sm font-semibold">{name}</p></div>)}</div></section>}
function ReportsPanel(){return <section className="card mt-4 p-5"><h2 className="font-black">Rehabilitation reports</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['Rehabilitation Progress Report','Site Recovery Report','Compliance Report','ESG Report','Executive Summary','Closure Plan Report'].map(report=><div key={report} className="flex items-center justify-between rounded-lg border p-4"><span className="text-sm font-semibold">{report}</span><FileText size={18} className="text-emerald-800"/></div>)}</div><Link href="/reports" className="btn btn-primary mt-5">Open reports <ArrowRight size={15}/></Link></section>}
