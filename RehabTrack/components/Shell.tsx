'use client';

import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,MapPinned,ClipboardCheck,Leaf,FileText,Bot,Settings,LogOut,Menu,X,Search,UserCircle,ChevronDown} from 'lucide-react';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import NotificationBell from '@/components/NotificationBell';

type Result={id:string;title:string;subtitle:string;href:string;kind:string};
const items=[['/dashboard','Dashboard',LayoutDashboard],['/sites','Sites',MapPinned],['/assessments','Assessments',ClipboardCheck],['/rehabilitation','Rehabilitation',Leaf],['/reports','Reports',FileText],['/ai-assistant','AI Assistant',Bot],['/settings','Settings',Settings]] as const;

export default function Shell({children,title}:{children:React.ReactNode,title:string}){
 const pathname=usePathname(),router=useRouter();
 const[mobileOpen,setMobileOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false),[profile,setProfile]=useState('U'),[query,setQuery]=useState(''),[results,setResults]=useState<Result[]>([]),[searching,setSearching]=useState(false);
 const profileRef=useRef<HTMLDivElement>(null),searchRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{let active=true;createClient().auth.getUser().then(({data})=>{if(!active)return;const user=data.user;const name=String(user?.user_metadata?.full_name||user?.email||'User');setProfile(name.split(/[\s@._-]+/).filter(Boolean).map(part=>part[0]).join('').slice(0,2).toUpperCase()||'U')});return()=>{active=false}},[]);
 useEffect(()=>{const close=(event:MouseEvent)=>{if(profileRef.current&&!profileRef.current.contains(event.target as Node))setProfileOpen(false);if(searchRef.current&&!searchRef.current.contains(event.target as Node))setResults([])};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 const search=useCallback(async(value:string)=>{const term=value.trim();if(term.length<2){setResults([]);return}setSearching(true);const db=createClient(),pattern=`%${term.replace(/[%_,]/g,' ')}%`;
  const [sites,assessments,actions,reports]=await Promise.all([
   db.from('sites').select('id,name,region').ilike('name',pattern).limit(5),
   db.from('assessments').select('id,assessment_type,status,assessment_date').ilike('assessment_type',pattern).limit(5),
   db.from('rehabilitation_actions').select('id,title,status,category').ilike('title',pattern).limit(5),
   db.from('reports').select('id,report_type,created_at').ilike('report_type',pattern).limit(5)
  ]);
  const found:Result[]=[];
  for(const row of sites.data||[])found.push({id:row.id,title:row.name,subtitle:row.region||'Site',href:`/sites?edit=${row.id}`,kind:'Site'});
  for(const row of assessments.data||[])found.push({id:row.id,title:row.assessment_type,subtitle:row.status||row.assessment_date||'Assessment',href:`/assessments?edit=${row.id}`,kind:'Assessment'});
  for(const row of actions.data||[])found.push({id:row.id,title:row.title,subtitle:row.status||row.category||'Action',href:`/rehabilitation?edit=${row.id}`,kind:'Action'});
  for(const row of reports.data||[])found.push({id:row.id,title:row.report_type||'Report',subtitle:row.created_at?new Date(row.created_at).toLocaleDateString():'Report',href:`/reports?edit=${row.id}`,kind:'Report'});
  setResults(found.slice(0,12));setSearching(false);
 },[]);
 useEffect(()=>{const timer=setTimeout(()=>void search(query),250);return()=>clearTimeout(timer)},[query,search]);
 async function logout(){await createClient().auth.signOut();router.replace('/login');router.refresh()}
 return <div className="min-h-screen lg:flex">
  {mobileOpen&&<button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={()=>setMobileOpen(false)}/>}
  <aside className={`${mobileOpen?'translate-x-0':'-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-forest p-4 text-white transition-transform lg:static lg:translate-x-0`}>
   <div className="flex h-24 items-center justify-between border-b border-white/15 px-2"><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-emerald-200"><Leaf size={38}/></div><div><div className="text-lg font-black">REHABTRACK</div><div className="max-w-[150px] text-[10px] leading-tight text-white/70">Mining Land Rehabilitation Monitoring Platform</div></div></div><button className="lg:hidden" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X/></button></div>
   <nav className="mt-5 flex-1 space-y-1">{items.map(([href,label,Icon],index)=><div key={href} className={index===6?'mt-8 border-t border-white/20 pt-4':''}><Link href={href} onClick={()=>setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${pathname===href?'bg-emerald-200 text-forest':'text-white hover:bg-white/10'}`}><Icon size={19}/>{label}</Link></div>)}</nav>
   <div className="border-t border-white/20 pt-4 text-xs text-white/70">Phahlane Dynamics Engineering</div>
  </aside>
  <main className="min-w-0 flex-1">
   <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
    <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
    <div ref={searchRef} className="relative w-full max-w-xl"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setResults([])}} aria-label="Search sites, assessments, actions, and reports" className="input h-10 pl-10" placeholder="Search sites, assessments, actions…"/>
     {(query.length>=2)&&(results.length>0||searching)&&<div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border bg-white shadow-xl">{searching&&<div className="p-3 text-sm text-slate-500">Searching records…</div>}{results.map(result=><Link key={`${result.kind}-${result.id}`} href={result.href} onClick={()=>{setQuery('');setResults([])}} className="flex items-center justify-between gap-3 border-t px-4 py-3 hover:bg-slate-50"><span className="min-w-0"><b className="block truncate text-sm">{result.title}</b><span className="text-xs text-slate-500">{result.subtitle}</span></span><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">{result.kind}</span></Link>)}{!searching&&!results.length&&<div className="p-4 text-sm text-slate-500">No matching records.</div>}</div>}
    </div>
    <div className="ml-auto flex items-center gap-2"><NotificationBell/><div ref={profileRef} className="relative"><button type="button" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={()=>setProfileOpen(value=>!value)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100"><span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-xs font-bold text-white">{profile}</span><ChevronDown size={15}/></button>{profileOpen&&<div className="absolute right-0 top-12 z-50 w-52 rounded-xl border bg-white p-2 shadow-xl">{[['Profile','/settings'],['Account Settings','/settings'],['Notifications','/settings'],['Help','/ai-assistant']].map(([label,href])=><Link key={label} href={href} onClick={()=>setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">{label}</Link>)}<button onClick={logout} className="mt-1 flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm text-red-700"><LogOut size={15}/>Logout</button></div>}</div></div>
   </header>
   <div className="p-4 md:p-6"><div className="sr-only">{title}</div>{children}</div>
  </main>
 </div>
}
