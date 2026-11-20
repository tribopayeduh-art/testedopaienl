import React from 'react';
import { BarChart3, Users, ArrowUpRight, Gamepad2, Menu } from 'lucide-react';
import type { AdminTabId } from './adminTypes';
interface Props { activeTab:AdminTabId; onSelectTab:(tab:AdminTabId)=>void; pendingWithdrawalsCount?:number; onOpenMenu:()=>void }
export const AdminMobileTabBar:React.FC<Props>=({activeTab,onSelectTab,pendingWithdrawalsCount=0,onOpenMenu})=>{
 const tabs=[{id:'metrics',label:'Resumo',icon:BarChart3},{id:'users',label:'Pessoas',icon:Users},{id:'withdrawals',label:'Saques',icon:ArrowUpRight},{id:'games',label:'Jogos',icon:Gamepad2}];
 return <nav className="adm-mobile-nav" aria-label="Navegação rápida">{tabs.map(tab=><button key={tab.id} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>onSelectTab(tab.id as AdminTabId)}><span><tab.icon size={19}/>{tab.id==='withdrawals'&&pendingWithdrawalsCount>0&&<b>{pendingWithdrawalsCount>99?'99+':pendingWithdrawalsCount}</b>}</span><small>{tab.label}</small></button>)}<button onClick={onOpenMenu} aria-label="Abrir todas as seções"><Menu size={19}/><small>Mais</small></button></nav>;
};
