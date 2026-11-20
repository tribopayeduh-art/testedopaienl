import {GameLoader,useGameBrand} from './GameBrandContext';
import React from 'react';
export function InexLoader({compact=false,label='Carregando iNEX',fullScreen=false}:{compact?:boolean;label?:string;fullScreen?:boolean}){
 const neutral=useGameBrand();
 if(neutral)return <GameLoader fullScreen={fullScreen}/>;
 return <span role="status" aria-label={label} aria-live="polite" className={`inex-loader ${compact?'inex-loader-compact':''} ${fullScreen?'inex-loader-screen':''}`}><picture><source media="(prefers-reduced-motion: reduce)" srcSet="/inex-logo.svg"/><img src="/inex-loading.gif" width="440" height="240" alt="" decoding="async" loading="eager"/></picture><span className="sr-only">{label}</span></span>;
}
