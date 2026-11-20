import {detectAppContext} from '../lib/gameContext';
import React,{useEffect,useState} from 'react';
import {InexLoader} from './InexLoader';
/** One opening animation while the application initializes underneath. */
export function InexBoot({children}:{children:React.ReactNode}){
 const isGame=detectAppContext()!=='alliance-hub';
 const [opening,setOpening]=useState(!isGame);
 useEffect(()=>{if(isGame)return;let cancelled=false;let timer:ReturnType<typeof setTimeout>;const image=new Image();const finish=()=>{if(!cancelled)setOpening(false)};const loaded=()=>{if(cancelled)return;timer=setTimeout(finish,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1920)};image.onload=loaded;image.onerror=finish;image.src='/inex-loading.gif';const failSafe=setTimeout(finish,6000);return()=>{cancelled=true;clearTimeout(timer);clearTimeout(failSafe);image.onload=null;image.onerror=null}},[]);
 return <><div inert={opening} aria-hidden={opening||undefined}>{children}</div>{opening&&<div className="inex-boot"><InexLoader fullScreen label="Abrindo iNEX"/></div>}</>;
}
