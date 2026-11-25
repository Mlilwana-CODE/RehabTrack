'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowRight, Images} from 'lucide-react';
import DashboardInsights from '@/components/DashboardInsights';
import RehabilitationProgressWidget from '@/components/RehabilitationProgressWidget';

export default function RehabilitationLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const isGallery=pathname==='/rehabilitation/before-after';
 return <>
  <div className="mx-auto mb-5 max-w-7xl space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
    <div><p className="font-bold text-emerald-950">Rehabilitation monitoring</p><p className="text-sm text-emerald-800">Manage rehabilitation actions and visual recovery evidence.</p></div>
    <Link href={isGallery?'/rehabilitation':'/rehabilitation/before-after'} className="btn btn-secondary"><Images size={16}/>{isGallery?'Rehabilitation actions':'Before & After gallery'}<ArrowRight size={14}/></Link>
   </div>
   <DashboardInsights/>
   <RehabilitationProgressWidget/>
  </div>
  {children}
 </>
}
