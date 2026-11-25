'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Images, ListChecks} from 'lucide-react';

export default function RehabilitationLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const gallery=pathname=== '/rehabilitation/before-after';
 return <div className="mx-auto max-w-7xl">
  <nav aria-label="Rehabilitation sections" className="mb-4 flex items-center gap-1 border-b border-slate-200">
   <Link href="/rehabilitation" className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${!gallery?'border-emerald-700 text-emerald-900':'border-transparent text-slate-500 hover:text-slate-800'}`}><ListChecks size={16}/>Actions</Link>
   <Link href="/rehabilitation/before-after" className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${gallery?'border-emerald-700 text-emerald-900':'border-transparent text-slate-500 hover:text-slate-800'}`}><Images size={16}/>Before &amp; After</Link>
  </nav>
  {children}
 </div>
}
