import React from 'react';
import { Users, BarChart3, FileText, Menu, ChevronRight, Megaphone, QrCode } from 'lucide-react';
import { Modal } from '../Modal';
import { partnerTabs, type PartnerTab } from './PartnerCleanUI';
export type PartnerTabType=PartnerTab;
interface Props{activeTab:PartnerTab;onSelectTab:(tab:PartnerTab)=>void;affiliatesCount?:number;pixDiversionActive?:boolean;onOpenBroadcast?:()=>void;onOpenInviteModal?:()=>void;moreDrawerOpen:boolean;setMoreDrawerOpen:(open:boolean)=>void}
export const PartnerMobileTabBar:React.FC<Props>=({activeTab,onSelectTab,onOpenBroadcast,onOpenInviteModal,moreDrawerOpen,setMoreDrawerOpen})=>{
 const tabs=[{id:'overview',label:'Resumo',icon:BarChart3},{id:'affiliates',label:'Rede',icon:Users},{id:'reports',label:'Relatórios',icon:FileText}] as const;
 const select=(id:PartnerTab)=>{onSelectTab(id);setMoreDrawerOpen(false);};
 return <><nav className="pn-mobile-nav" aria-label="Navegação rápida do parceiro">{tabs.map(tab=><button key={tab.id} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>select(tab.id)}><tab.icon size={20}/><span>{tab.label}</span></button>)}<button onClick={()=>setMoreDrawerOpen(true)} aria-label="Abrir todas as áreas do parceiro" aria-expanded={moreDrawerOpen}><Menu size={20}/><span>Mais</span></button></nav><Modal isOpen={moreDrawerOpen} onClose={()=>setMoreDrawerOpen(false)} title="Seu painel de parceiro"><div className="pn-more-menu">{partnerTabs.map(tab=><button key={tab.id} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>select(tab.id)}><tab.icon size={18}/><span>{tab.label}</span><ChevronRight size={15}/></button>)}<div>{onOpenInviteModal&&<button onClick={()=>{setMoreDrawerOpen(false);onOpenInviteModal();}}><QrCode size={18}/> QR Code do convite</button>}{onOpenBroadcast&&<button onClick={()=>{setMoreDrawerOpen(false);onOpenBroadcast();}}><Megaphone size={18}/> Enviar comunicado</button>}</div></div></Modal></>;
};
