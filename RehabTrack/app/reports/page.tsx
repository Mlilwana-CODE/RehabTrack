'use client';

import Shell from '@/components/Shell';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {Pencil,Printer} from 'lucide-react';

type Site={id:string;name:string};
type Report={id:string;site_id:string|null;report_type:string|null;period_start:string|null;period_end:string|null;content:Record<string,unknown>|null;created_at:string};
type Evidence={assessmentCount:number;actionCount:number;completedActions:number;notes:string};
const reportTypes=['Site rehabilitation summary','Assessment report','Risk report','Corrective-action report','Compliance report','Progress report'];

export default function Page(){
 const[sites,setSites]=useState<Site[]>([]),[reports,setReports]=useState<Report[]>([]);
 const[site,setSite]=useState(''),[type,setType]=useState('Progress report'),[month,setMonth]=useState('');
 const[editing,setEditing]=useState<Report|null>(null),[preview,setPreview]=useState<Report|null>(null);
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 const db=createClient();
 const load=useCallback(async()=>{
  const[{data:siteRows,error:siteError},{data:reportRows,error:reportError}]=await Promise.all([
   createClient().from('sites').select('id,name').order('name'),
   createClient().from('reports').select('id,site_id,report_type,period_start,period_end,content,created_at').order('created_at',{ascending:false})
  ]);
  if(siteError||reportError){setError(siteError?.message||reportError?.message||'Unable to load reports.');return}
  setSites((siteRows||[]) as Site[]);setReports((reportRows||[]) as Report[]);
 },[]);
 useEffect(()=>{void load()},[load]);
 function periodBounds(value:string){if(!value)return{start:null as string|null,end:null as string|null};const[startYear,startMonth]=value.split('-').map(Number);const last=new Date(startYear,startMonth,0).getDate();return{start:`${value}-01`,end:`${value}-${String(last).padStart(2,'0')}`}}
 async function saveReport(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!site){setError('Select a site first.');return}
  setBusy(true);setError('');
  const form=new FormData(event.currentTarget);const siteId=String(form.get('site_id')||'');const reportType=String(form.get('report_type')||'Progress report');const period=String(form.get('period')||'');const notes=String(form.get('notes')||'');
  const{start,end}=periodBounds(period);
  const[{count:assessmentCount,error:assessmentError},{count:actionCount,error:actionError},{count:completedActions}]=await Promise.all([
   db.from('assessments').select('id',{count:'exact',head:true}).eq('site_id',siteId),
   db.from('rehabilitation_actions').select('id',{count:'exact',head:true}).eq('site_id',siteId),
   db.from('rehabilitation_actions').select('id',{count:'exact',head:true}).eq('site_id',siteId).in('status',['Completed','Verified'])
  ]);
  if(assessmentError||actionError){setError(assessmentError?.message||actionError?.message||'Unable to gather report evidence.');setBusy(false);return}
  const content:Evidence={assessmentCount:assessmentCount||0,actionCount:actionCount||0,completedActions:completedActions||0,notes};
  const payload={site_id:siteId,report_type:reportType,period_start:start,period_end:end,content};
  const result=editing?await db.from('reports').update(payload).eq('id',editing.id):await db.from('reports').insert(payload);
  if(result.error){setError(result.error.message);setBusy(false);return}
  setSite(siteId);setType(reportType);setMonth(period);setEditing(null);setBusy(false);await load();
 }
 function editReport(report:Report){
  setEditing(report);setPreview(report);setSite(report.site_id||'');setType(report.report_type||reportTypes[0]);
  setMonth(report.period_start?.slice(0,7)||'');setError('');
 }
 function cancelEdit(){setEditing(null);setError('')}
 const siteName=(id:string|null)=>sites.find(item=>item.id===id)?.name||'Unknown site';
 const previewContent=(report:Report)=>report.content as Partial<Evidence>|null;
 return <Shell title="Reports">
  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
   <form key={editing?.id||'new-report'} onSubmit={saveReport} className="card p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-black">{editing?'Edit report':'Generate report'}</h2>{editing&&<button type="button" className="text-sm text-slate-500 underline" onClick={cancelEdit}>Cancel edit</button>}</div>
    {error&&<div role="alert" className="mt-4 rounded bg-amber-50 p-3 text-amber-800">{error}</div>}
    <label className="label mt-5" htmlFor="report-site">Site</label><select id="report-site" name="site_id" className="input" value={site} onChange={event=>setSite(event.target.value)} required><option value="">Select site</option>{sites.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <label className="label mt-4" htmlFor="report-type">Report type</label><select id="report-type" name="report_type" className="input" value={type} onChange={event=>setType(event.target.value)}>{reportTypes.map(item=><option key={item}>{item}</option>)}</select>
    <label className="label mt-4" htmlFor="report-period">Reporting month</label><input id="report-period" name="period" className="input" type="month" value={month} onChange={event=>setMonth(event.target.value)}/>
    <label className="label mt-4" htmlFor="report-notes">Report notes</label><textarea id="report-notes" name="notes" className="input min-h-28" defaultValue={editing?(previewContent(editing)?.notes||''):''} placeholder="Add context, findings, or recommendations"/>
    <button disabled={busy||!site} className="btn btn-primary mt-5">{busy?'Saving…':editing?'Save report changes':'Generate and save report'}</button>
   </form>
   <section className="card p-6">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Saved reports</h2>{preview&&<button type="button" onClick={()=>window.print()} className="btn btn-secondary no-print"><Printer size={16}/>Print</button>}</div>
    {reports.length===0?<p className="py-8 text-slate-500">No saved reports yet. Generate a report to get started.</p>:<div className="mt-4 divide-y">{reports.map(report=><div key={report.id} className="flex items-center justify-between gap-3 py-3"><button type="button" onClick={()=>setPreview(report)} className="min-w-0 flex-1 text-left"><b className="block truncate">{report.report_type||'Report'}</b><span className="text-sm text-slate-500">{siteName(report.site_id)} · {report.created_at?new Date(report.created_at).toLocaleDateString():''}</span></button><button type="button" onClick={()=>editReport(report)} className="btn btn-secondary" aria-label="Edit report"><Pencil size={16}/>Edit</button></div>)}</div>}
   </section>
  </div>
  {preview&&<section className="card mt-6 p-8 print:mt-0 print:border-0 print:shadow-none"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-black">{preview.report_type||'Report'}</h2><p className="text-slate-500">{siteName(preview.site_id)} · Generated {new Date(preview.created_at).toLocaleDateString()}</p></div><button type="button" onClick={()=>window.print()} className="btn btn-secondary no-print"><Printer size={16}/>Print / Save PDF</button></div><hr className="my-6"/><p>This saved report summarizes the selected site using its RehabTrack records.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Assessments" value={previewContent(preview)?.assessmentCount??0}/><Metric label="Rehabilitation actions" value={previewContent(preview)?.actionCount??0}/><Metric label="Completed / verified" value={previewContent(preview)?.completedActions??0}/></div>{preview.period_start&&<p className="mt-4 text-sm text-slate-500">Period: {preview.period_start} to {preview.period_end||preview.period_start}</p>}{previewContent(preview)?.notes&&<div className="mt-5 whitespace-pre-wrap"><b>Notes</b><p className="mt-2">{previewContent(preview)?.notes}</p></div>}</section>}
 </Shell>
}
function Metric({label,value}:{label:string,value:unknown}){return <div className="rounded-lg bg-slate-50 p-4"><div className="text-sm text-slate-500">{label}</div><b className="text-2xl">{String(value)}</b></div>}
