'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {RefreshCw,Sparkles,ArrowRight} from 'lucide-react';
type Insight={id:string;site_id:string|null;insight:string;category:string;severity:string;created_at:string};
async function readJson(response:Response):Promise<Record<string,unknown>>{
 const text=await response.text();
 if(!text.trim())return {};
 try{return JSON.parse(text) as Record<string,unknown>}catch{return {}}
}
export default function DashboardInsights(){
 const[items,setItems]=useState<Insight[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const load=useCallback(async(generate=false)=>{
  setBusy(true);setError('');
  try{
   let response=await fetch('/api/ai/insights',{cache:'no-store'}),data=await readJson(response);
   if(response.ok&&(!Array.isArray(data.insights)||data.insights.length===0)&&generate){response=await fetch('/api/ai/insights',{method:'POST'});data=await readJson(response)}
   if(!response.ok)throw new Error(typeof data.error==='string'?data.error:`Insights unavailable (HTTP ${response.status}).`);
   setItems(Array.isArray(data.insights)?data.insights as Insight[]:[]);
  }catch(e){setError(e instanceof Error?e.message:'Could not load insights. Please try again.')}finally{setBusy(false)}
 },[]);
 useEffect(()=>{void load(true)},[load]);
 return <section className="card p-4 md:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-black"><Sparkles size={17} className="text-emerald-800"/>AI rehabilitation insights</h2><p className="mt-1 text-xs text-slate-500">Generated from your current site and assessment records</p></div><button type="button" onClick={()=>void load(true)} disabled={busy} className="btn btn-secondary"><RefreshCw size={15} className={busy?'animate-spin':''}/><span className="hidden sm:inline">Refresh insights</span></button></div>
  {busy?<p className="mt-4 text-sm text-slate-500">Analyzing accessible records…</p>:error?<div className="mt-4"><p role="status" className="text-sm text-amber-800">{error}</p><button className="mt-2 text-sm font-semibold text-emerald-800 underline" onClick={()=>void load(true)}>Try again</button></div>:items.length?<ul className="mt-4 grid gap-2 md:grid-cols-2">{items.map(item=><li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><span className="mr-2 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">{item.severity}</span><span className="text-sm">{item.insight}</span></li>)}</ul>:<p className="mt-4 text-sm text-slate-500">No insights are available yet. Add site or assessment records, or try again later.</p>}
  <Link className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 hover:underline" href="/ai-assistant">Ask the AI assistant <ArrowRight size={13}/></Link>
 </section>
}
