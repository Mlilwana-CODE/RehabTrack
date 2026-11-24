'use client';

import {useEffect,useRef} from 'react';

export type MapSite={id:string,name:string,stage:string|null,latitude:number|string|null,longitude:number|string|null};

declare global {interface Window {L?:any}}

export default function RecoveryMap({sites}:{sites:MapSite[]}){
 const ref=useRef<HTMLDivElement>(null);
 const mapRef=useRef<any>(null);

 useEffect(()=>{
  const points=sites.map(site=>({
   ...site,
   lat:Number(site.latitude),
   lng:Number(site.longitude)
  })).filter(site=>Number.isFinite(site.lat)&&Number.isFinite(site.lng)&&Math.abs(site.lat)<=90&&Math.abs(site.lng)<=180);

  if(!ref.current||!points.length)return;

  const ensureStyle=()=>{
   if(document.querySelector('link[data-rehabtrack-map]'))return;
   const link=document.createElement('link');
   link.rel='stylesheet';
   link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
   link.dataset.rehabtrackMap='true';
   document.head.appendChild(link);
  };

  const initialise=()=>{
   const L=window.L;
   if(!L||!ref.current)return;

   ensureStyle();
   if(mapRef.current){mapRef.current.remove();mapRef.current=null}

   const map=L.map(ref.current,{scrollWheelZoom:false,zoomControl:true});
   mapRef.current=map;
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);

   const markers=points.map((site)=>L.marker([site.lat,site.lng])
    .addTo(map)
    .bindPopup(`<b>${escapeHtml(site.name)}</b><br>${escapeHtml(site.stage||'Stage not specified')}`));

   if(markers.length===1){map.setView([points[0].lat,points[0].lng],12)}
   else{map.fitBounds(markers.map((marker:any)=>marker.getLatLng()),{padding:[35,35],maxZoom:12})}

   requestAnimationFrame(()=>{map.invalidateSize();});
  };

  ensureStyle();
  if(window.L)initialise();
  else{
   const existing=document.querySelector<HTMLScriptElement>('script[data-rehabtrack-map-js]');
   if(existing){existing.addEventListener('load',initialise,{once:true});}
   else{
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async=true;
    script.dataset.rehabtrackMapJs='true';
    script.onload=initialise;
    document.body.appendChild(script);
   }
  }
 },[sites]);

 useEffect(()=>()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null}},[]);

 const count=sites.map(site=>({lat:Number(site.latitude),lng:Number(site.longitude)})).filter(site=>Number.isFinite(site.lat)&&Number.isFinite(site.lng)&&Math.abs(site.lat)<=90&&Math.abs(site.lng)<=180).length;
 if(!count)return <div className="h-[360px] grid place-items-center rounded-xl bg-slate-50 text-slate-500 text-center px-6">No mapped sites yet.<br/><span className="text-sm">Add valid latitude and longitude values to a site.</span></div>;
 return <div ref={ref} className="h-[360px] rounded-xl z-0" aria-label="Map of rehabilitation sites"/>;
}

function escapeHtml(value:string){return value.replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]||char));}
