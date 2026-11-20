import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Radio, Users, ArrowUpRight, CreditCard, Gamepad2, FileText, Bell, ShieldCheck, Settings, X, Wallet, Shuffle, Search, ArrowLeft, ChevronDown } from 'lucide-react';
import logoImg from '../inex-logo.svg';
import type { AdminTabId } from './adminTypes';
import type { AdminPermissions } from '../../types';
interface Props { activeTab:AdminTabId; onSelectTab:(tab:AdminTabId)=>void; mobileMenuOpen:boolean; onCloseMobileMenu:()=>void; pendingWithdrawalsCount?:number; adminEmail?:string; adminRole?:string; adminPermissions?:AdminPermissions; onCloseAdmin:()=>void }
export const AdminSidebar: React.FC<Props> = ({activeTab,onSelectTab,mobileMenuOpen,onCloseMobileMenu,pendingWithdrawalsCount=0,adminEmail,adminRole,adminPermissions,onCloseAdmin}) => {
  const [query,setQuery] = useState('');
  const ref=useRef<HTMLElement>(null);
  const closeRef=useRef(onCloseMobileMenu);closeRef.current=onCloseMobileMenu;
  useEffect(()=>{
    if (!mobileMenuOpen) return;
    const previous=document.activeElement as HTMLElement|null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();}
      if(event.key==='Tab'){
        const nodes: HTMLElement[] = Array.from<HTMLElement>(ref.current?.querySelectorAll<HTMLElement>('button,input,summary') ?? []).filter(n=>n.getClientRects().length>0);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[mobileMenuOpen]);
  useEffect(()=>{const wide=window.matchMedia('(min-width:768px)');const change=()=>{if(wide.matches)closeRef.current();};wide.addEventListener('change',change);return()=>wide.removeEventListener('change',change);},[]);
  const groups=[
    {title:'Operação',items:[{id:'metrics',label:'Visão geral',icon:BarChart3},{id:'live',label:'Jogadores ao vivo',icon:Radio},{id:'users',label:'Usuários',icon:Users},...(adminRole==='superadmin'||adminPermissions?.canManageUsers?[{id:'affiliates',label:'Gestão de afiliados',icon:Users}]:[]),{id:'games',label:'Jogos',icon:Gamepad2}]},
    {title:'Financeiro',items:[...(adminRole==='superadmin'||adminPermissions?.canManageCommissions||adminPermissions?.canViewMetrics?[{id:'commissions',label:'Comissões',icon:Wallet}]:[]),...(adminRole==='superadmin'||adminPermissions?.canManageDotfy?[{id:'dotfy',label:'Gateway',icon:Wallet}]:[]),{id:'deposits',label:'Depósitos',icon:CreditCard},{id:'withdrawals',label:'Saques',icon:ArrowUpRight},{id:'reports',label:'Relatórios',icon:FileText}]},
    {title:'Configurações',items:[{id:'notifications',label:'Notificações',icon:Bell},{id:'admins',label:'Equipe e permissões',icon:ShieldCheck},{id:'diversion',label:'Roteamento PIX',icon:Shuffle},{id:'security',label:'Sistema e conexões',icon:Settings}]}
  ];
  const renderItems=(items:typeof groups[number]['items'])=>items.filter(item=>item.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).map(item=><button key={item.id} aria-current={activeTab===item.id?'page':undefined} onClick={()=>{onSelectTab(item.id as AdminTabId);onCloseMobileMenu();}}><item.icon size={17}/><span>{item.label}</span>{item.id==='withdrawals'&&pendingWithdrawalsCount>0&&<b>{pendingWithdrawalsCount}</b>}</button>);
  return <>{mobileMenuOpen&&<button className="inex-admin-backdrop" onClick={onCloseMobileMenu} aria-label="Fechar navegação"/>}<aside ref={ref} role={mobileMenuOpen?'dialog':undefined} aria-modal={mobileMenuOpen?true:undefined} aria-label="Menu administrativo" className={`inex-admin-sidebar ${mobileMenuOpen?'is-open':''}`}><header><img src={logoImg} alt="iNEX"/><button onClick={onCloseMobileMenu} aria-label="Fechar menu"><X size={18}/></button><span>Administração</span></header><label className="adm-nav-search"><Search size={15}/><input type="search" placeholder="Encontrar seção" aria-label="Encontrar seção do admin" value={query} onChange={event=>setQuery(event.target.value)}/></label><nav aria-label="Administração">{groups.map((group,i)=>{const items=renderItems(group.items);if(!items.length)return null;return i===2&&!query?<details key={group.title} open={group.items.some(item=>item.id===activeTab)}><summary>{group.title}<ChevronDown size={13}/></summary>{items}</details>:<section key={group.title}><h2>{group.title}</h2>{items}</section>;})}{!groups.some(g=>g.items.some(i=>i.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))))&&<p className="adm-nav-empty">Nenhuma seção encontrada.</p>}</nav><footer><div className="inex-admin-account"><span>{adminEmail?.charAt(0).toUpperCase()||'A'}</span><div><strong>{adminRole==='superadmin'?'Superadministrador':'Administrador'}</strong><small>{adminEmail}</small></div></div><button onClick={onCloseAdmin}><ArrowLeft size={14}/> Voltar à plataforma</button></footer></aside></>;
};
