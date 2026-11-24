'use client';

import {useEffect,useRef} from 'react';

export type MapSite={id:string,name:string,stage:string|null,latitude:number|null,longitude:number|null};

declare global {interface Window {L?:any}}

export default function RecoveryMap({sites}:{sites:MapSite[]}){
 const ref=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  if(!ref.current)return;

  if(!document.querySelector('link[data-rehabtrack-map]')){
   const link=document.createElement('link');
   link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; link.dataset.rehabtrackMap='true';
   document.head.appendChild(link);
  }

  const points=sites.filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude));
  if(!points.length)return;

  const initialise=()=>{
   const L=window.L;if(!L||!ref.current)return;
   ref.current.innerHTML='';
   const map=L.map(ref.current,{scrollWheelZoom:false});
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
   const markers=points.map((site)=>L.marker([Number(site.latitude),Number(site.longitude)]).addTo(map).bindPopup(`<b>${escapeHtml(site.name)}</b><br>${escapeHtml(site.stage||'Stage not specified')}`));
   if(markers.length===1)map.setView([Number(points[0].latitude),Number(points[0].longitude)],12);
   else map.fitBounds(markers.map((marker:any)=>marker.getLatLng()),{padding:[35,35],maxZoom:12});
  };

  if(window.L)initialise();
  else{
   const script=document.createElement('script');
   script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; script.onload=initialise;
   document.body.appendChild(script);
  }
 },[sites]);

 const count=sites.filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).length;
 if(!count)return <div className="h-[360px] grid place-items-center rounded-xl bg-slate-50 text-slate-500 text-center px-6">No mapped sites yet.<br/><span className="text-sm">Add latitude and longitude to a site to display it.</span></div>;
 return <div ref={ref} className="h-[360px] rounded-xl z-0" aria-label="Map of rehabilitation sites"/>;
}

function escapeHtml(value:string){return value.replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]||char));}
