'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function LegacyBeforeAfterPage(){const router=useRouter();useEffect(()=>{router.replace('/rehabilitation')},[router]);return <main className="p-8 text-center text-sm text-slate-500">Opening Rehabilitation Centre…</main>}
