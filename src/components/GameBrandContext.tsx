import React,{createContext,useContext} from 'react';
export const GameBrandContext=createContext(false);
export const useGameBrand=()=>useContext(GameBrandContext);
export function GameLoader({fullScreen=false,label='Carregando jogo'}:{fullScreen?:boolean;label?:string}){
 return <span role="status" aria-label={label} className={fullScreen?'fixed inset-0 z-[9999] grid place-items-center bg-white text-slate-500':'inline-flex items-center justify-center p-3'}><svg aria-hidden="true" className="animate-spin motion-reduce:animate-none" width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" opacity=".2" strokeWidth="2"/><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span className="sr-only">{label}</span></span>;
}
