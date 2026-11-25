'use client';

import Shell from '@/components/Shell';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {Pencil,Printer,RefreshCw,FileSpreadsheet,FileDown} from 'lucide-react';

type Site={id:string;name:string};
type Report={id:string;site_id:string|null;report_type:string|null;period_start:string|null;period_end:string|null;content:Record<string,unknown>|null;created_at:string};
type Evidence={assessmentCount:number;actionCount:number;completedActions:number;notes:string};
const types=['Site rehabilitation summary','Assessment report','Risk report','Corrective-action report','Compliance report','Progress report'];

export default function Page(){
 const[sites,setSites]=useState<Site[]>([]),[reports,setReports]=useState<Report[]>([]);
 const[site,setSite]=useState(''),[type,setType]=useState('Progress report'),[month,setMonth]=useState('');
 const[editing,setEditing]=useState<Report|null>(null),[preview,setPreview]=useState<Report|null>(null);
 const[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const[siteError,setSiteError]=useState(''),[reportError,setReportError]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);
  const[siteResult,reportResult]=await Promise.all([
   createClient().from('sites').select('id,name').order('name'),
   createClient().from('reports').select('id,site_id,report_type,period_start,period_end,content,created_at').order('created_at',{ascending:false})
  ]);
  if(siteResult.error)setSiteError(siteResult.error.message);else{setSiteError('');setSites((siteResult.data||[]) as Site[])}
  if(reportResult.error)setReportError(reportResult.error.message);else{setReportError('');setReports((reportResult.data||[]) as Report[])}
  setLoading(false);
 },[]);
 useEffect(()=>{void load()},[load]);
 function periodBounds(value:string){if(!value)return{start:null as string|null,end:null as string|null};const[y,m]=value.split('-').map(Number);return{start:`${value}-01`,end:`${value}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`}}
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSuccess('');
  if(!site){setError('Select a site before generating the report.');return}
  if(!sites.some(item=>item.id===site)){setError('The selected site is no longer available. Refresh the site list and try again.');return}
  setBusy(true);
  const form=new FormData(event.currentTarget);
  const notes=String(form.get('notes')||'').trim();
  const{start,end}=periodBounds(month);
  const db=createClient();
  const[assessmentResult,actionResult,completedResult]=await Promise.all([
   db.from('assessments').select('id',{count:'exact',head:true}).eq('site_id',site),
   db.from('rehabilitation_actions').select('id',{count:'exact',head:true}).eq('site_id',site),
   db.from('rehabilitation_actions').select('id',{count:'exact',head:true}).eq('site_id',site).in('status',['Completed','Verified'])
  ]);
  const dataError=assessmentResult.error||actionResult.error||completedResult.error;
  if(dataError){setError(`Could not gather site evidence: ${dataError.message}`);setBusy(false);return}
  const content:Evidence={assessmentCount:assessmentResult.count||0,actionCount:actionResult.count||0,completedActions:completedResult.count||0,notes};
  const payload={site_id:site,report_type:type,period_start:start,period_end:end,content};
  const result=editing
   ?await db.from('reports').update(payload).eq('id',editing.id).select('id,site_id,report_type,period_start,period_end,content,created_at').single()
   :await db.from('reports').insert(payload).select('id,site_id,report_type,period_start,period_end,content,created_at').single();
  if(result.error){setError(`Report was not saved: ${result.error.message}`);setBusy(false);return}
  const saved=result.data as Report;
  setPreview(saved);setEditing(null);setSuccess('Report saved successfully.');
  setBusy(false);await load();
 }
 function edit(report:Report){setEditing(report);setPreview(report);setSite(report.site_id||'');setType(report.report_type||types[0]);setMonth(report.period_start?.slice(0,7)||'');setError('');setSuccess('')}
 function exportExcel(){if(!preview)return;const report=preview,reportContent=report.content||{};const html=`<table><tr><th>Report</th><td>${escapeHtml(report.report_type||type)}</td></tr><tr><th>Site</th><td>${escapeHtml(sites.find(s=>s.id===report.site_id)?.name||'Site')}</td></tr>${Object.entries(reportContent).map(([key,value])=>`<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(value??''))}</td></tr>`).join('')}</table>`;const blob=new Blob([html],{type:'application/vnd.ms-excel'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rehabtrack-report.xls';a.click();URL.revokeObjectURL(url)}
 function exportCsv(){if(!preview)return;const report=preview,values=[['Report type',report.report_type],['Site',sites.find(s=>s.id===report.site_id)?.name],...Object.entries(report.content||{})];const csv=values.map(row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='rehabtrack-report.csv';a.click();URL.revokeObjectURL(url)}
 const siteName=(id:string|null)=>sites.find(item=>item.id===id)?.name||'Unknown site';
 const reportContent=(report:Report)=>report.content as Partial<Evidence>|null;
 const visibleReports=reports.filter(report=>(!site||report.site_id===site)&&(!type||report.report_type===type));
 return <Shell title="Reports">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black">Reports</h1><p className="text-sm text-slate-500">Generate, review, and export site reports.</p></div><button type="button" onClick={()=>void load()} disabled={loading} className="btn btn-secondary"><RefreshCw size={16}/>{loading?'Refreshing…':'Refresh'}</button></div>
  <div className="grid gap-6 xl:grid-cols-2">
   <form key={editing?.id||'new'} onSubmit={save} className="card p-6"><h2 className="text-xl font-black">{editing?'Edit report':'Generate report'}</h2>
    {error&&<div role="alert" className="mt-4 rounded bg-amber-50 p-3 text-amber-800">{error}</div>}{success&&<div role="status" className="mt-4 rounded bg-emerald-50 p-3 text-emerald-800">{success}</div>}
    {siteError&&<div role="alert" className="mt-4 rounded bg-amber-50 p-3 text-amber-800">Could not load sites: {siteError}</div>}
    <label className="label mt-5" htmlFor="report-site">Site</label><select id="report-site" className="input" value={site} onChange={event=>setSite(event.target.value)} required disabled={loading||!!siteError}><option value="">{loading?'Loading sites…':sites.length?'Select site':'No sites found'}</option>{sites.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <label className="label mt-4" htmlFor="report-type">Report type</label><select id="report-type" className="input" value={type} onChange={event=>setType(event.target.value)}>{types.map(item=><option key={item} value={item}>{item}</option>)}</select>
    <label className="label mt-4" htmlFor="report-month">Reporting month</label><input id="report-month" type="month" className="input" value={month} onChange={event=>setMonth(event.target.value)}/>
    <label className="label mt-4" htmlFor="report-notes">Report notes</label><textarea id="report-notes" name="notes" className="input min-h-24" defaultValue={editing?String(reportContent(editing)?.notes||''):''} placeholder="Add context, findings, or recommendations"/>
    <button disabled={busy||loading||!site||!!siteError} className="btn btn-primary mt-5">{busy?'Saving…':editing?'Save changes':'Generate and save report'}</button>
   </form>
   <section className="card p-6"><h2 className="text-xl font-black">Report history</h2>{reportError&&<p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-800">Could not load saved reports: {reportError}. Confirm that the reports migration has been applied in Supabase.</p>}
    <div className="mt-3 flex gap-2"><select aria-label="Filter report history by site" value={site} onChange={event=>setSite(event.target.value)} className="input"><option value="">All sites</option>{sites.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Filter report history by type" value={type} onChange={event=>setType(event.target.value)} className="input"><option value="">All report types</option>{types.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
    <div className="mt-3 divide-y">{visibleReports.map(report=><div key={report.id} className="flex items-center gap-2 py-3"><button type="button" onClick={()=>setPreview(report)} className="min-w-0 flex-1 text-left"><b className="block truncate text-sm">{report.report_type||'Report'}</b><span className="text-xs text-slate-500">{siteName(report.site_id)} · {new Date(report.created_at).toLocaleDateString()}</span></button><button type="button" onClick={()=>edit(report)} className="btn btn-secondary" aria-label="Edit report"><Pencil size={15}/></button></div>)}{!loading&&visibleReports.length===0&&<p className="py-8 text-sm text-slate-500">No reports match these filters.</p>}</div>
   </section>
  </div>
  {preview&&<section className="card mt-6 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{preview.report_type||'Report'}</h2><p className="text-sm text-slate-500">{siteName(preview.site_id)} · {new Date(preview.created_at).toLocaleDateString()}</p></div><div className="flex gap-2"><button type="button" onClick={()=>window.print()} className="btn btn-secondary"><Printer size={15}/>PDF / Print</button><button type="button" onClick={exportExcel} className="btn btn-secondary"><FileSpreadsheet size={15}/>Excel</button><button type="button" onClick={exportCsv} className="btn btn-secondary"><FileDown size={15}/>CSV</button></div></div><hr className="my-4"/><p>Assessments: {reportContent(preview)?.assessmentCount??0} · Actions: {reportContent(preview)?.actionCount??0} · Completed/verified: {reportContent(preview)?.completedActions??0}</p>{reportContent(preview)?.notes&&<p className="mt-3 whitespace-pre-wrap">{String(reportContent(preview)?.notes)}</p>}</section>}
 </Shell>
}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
