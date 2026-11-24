'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,MapPinned,ClipboardCheck,Leaf,FileText,Bot,Settings,LogOut,Menu,X} from 'lucide-react';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import NotificationBell from '@/components/NotificationBell';

const items=[['/dashboard','Dashboard',LayoutDashboard],['/sites','Sites',MapPinned],['/assessments','Assessments',ClipboardCheck],['/rehabilitation','Rehabilitation',Leaf],['/reports','Reports',FileText],['/ai-assistant','AI Assistant',Bot],['/settings','Settings',Settings]] as const;

export default function Shell({children,title}:{children:React.ReactNode,title:string}){
 const p=usePathname(),r=useRouter();
 const[open,setOpen]=useState(false);
 async function logout(){await createClient().auth.signOut();r.replace('/login');r.refresh()}
 return <div className="min-h-screen flex"><aside className={`${open?'translate-x-0':'-translate-x-full'} fixed z-30 lg:translate-x-0 lg:static w-72 min-h-screen bg-forest text-white p-5 transition-transform`}><div className="flex justify-between"><div><div className="text-2xl font-black">RehabTrack</div><div className="text-xs text-green-100 mt-1">From degraded land to verified recovery</div></div><button type="button" aria-label="Close menu" onClick={()=>setOpen(false)} className="lg:hidden"><X/></button></div><nav className="mt-9 space-y-2">{items.map(([h,l,I])=><Link key={h} onClick={()=>setOpen(false)} href={h} className={`flex gap-3 p-3 rounded-xl ${p===h?'bg-white text-forest':'hover:bg-white/10'}`}><I size={20}/>{l}</Link>)}</nav><button type="button" onClick={logout} className="flex gap-3 p-3 mt-8 hover:bg-white/10 rounded-xl w-full"><LogOut size={20}/>Log out</button></aside>{open&&<button type="button" aria-label="Close navigation" className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setOpen(false)}/>}<main className="flex-1 min-w-0"><header className="bg-white border-b px-5 lg:px-8 py-4 flex items-center gap-4"><button type="button" aria-label="Open menu" className="lg:hidden" onClick={()=>setOpen(true)}><Menu/></button><h1 className="text-2xl font-black">{title}</h1><div className="ml-auto"><NotificationBell/></div></header><div className="p-5 lg:p-8">{children}</div></main></div>
}
