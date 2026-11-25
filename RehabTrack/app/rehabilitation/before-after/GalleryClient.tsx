'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function RehabilitationGallery(){
 const router=useRouter();
 useEffect(()=>{router.replace('/rehabilitation?tab=Before%20%26%20After')},[router]);
 return <main className="grid min-h-[40vh] place-items-center text-sm text-slate-500">Opening the Rehabilitation Centre…</main>;
}
