import React from 'react';
import { User } from '../types';
import {
  User as UserIcon,
  Users,
  Settings,
  Bell,
  FileText,
  ShieldAlert,
  LogOut,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  Crown,
  GraduationCap,
  Target
} from 'lucide-react';

interface MoreViewProps {
  user: User;
  onOpenProfile: () => void;
  onOpenAffiliates: () => void;
  onOpenMembers?: () => void;
  onOpenCampaigns?: () => void;
  onOpenPartnerPanel?: () => void;
  onOpenSettings: () => void;
  onOpenPixKeys?: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  user,
  onOpenProfile,
  onOpenAffiliates,
  onOpenMembers,
  onOpenCampaigns,
  onOpenPartnerPanel,
  onOpenSettings,
  onOpenPixKeys,
  onOpenTerms,
  onOpenPrivacy,
  onLogout,
  onOpenAdmin,
}) => {
  const isAdminUser = user.role === 'admin' || user.role === 'superadmin';
  const isApprovedPartner = Boolean((user.isPartner === true && user.partnerApproved === true) || isAdminUser);

  const menuSections = [
    ...(onOpenPartnerPanel && isApprovedPartner ? [{
      id: 'partner',
      label: 'Painel do Parceiro VIP',
      description: 'Sua rede de afiliados em um só lugar',
      icon: <Crown className="w-5 h-5 text-emerald-600" />,
      onClick: onOpenPartnerPanel,
      badge: 'ATIVO',
      highlight: true
    }] : []),
    ...(onOpenCampaigns ? [{
      id: 'campaigns',
      label: 'Automações WhatsApp',
      description: 'Campanhas, mensagens e recuperação de PIX',
      icon: <Target className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenCampaigns,
      badge: 'PRO'
    }] : []),
    {
      id: 'gateway',
      label: 'Gateway e preferências',
      description: 'Preferências e integrações do sistema',
      icon: <Settings className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenSettings,
    },
    ...(onOpenMembers ? [{
      id: 'members',
      label: 'Área de Membros',
      description: 'Aulas para desenvolver sua operação',
      icon: <GraduationCap className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenMembers,
      badge: 'Aulas'
    }] : []),
    ...(isAdminUser && onOpenAdmin ? [{
      id: 'admin',
      label: 'Painel Administrativo',
      description: 'Gestão de usuários, saques, saldos e permissões',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      onClick: onOpenAdmin,
      highlight: true
    }] : []),
    {
      id: 'pix-keys',
      label: 'Minhas Chaves PIX',
      description: 'Organize suas chaves de recebimento',
      icon: <KeyRound className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenPixKeys,
    },
    {
      id: 'profile',
      label: 'Perfil',
      description: 'Dados pessoais e informações da conta',
      icon: <UserIcon className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenProfile,
    },
    {
      id: 'affiliates',
      label: 'Afiliados',
      description: 'Programa de indicação e comissões',
      icon: <Users className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenAffiliates,
    },
    {
      id: 'terms',
      label: 'Termos de uso',
      description: 'Condições gerais do serviço',
      icon: <FileText className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenTerms,
    },
    {
      id: 'privacy',
      label: 'Política de privacidade',
      description: 'Proteção de dados e segurança',
      icon: <ShieldAlert className="w-5 h-5 text-[#111111]" />,
      onClick: onOpenPrivacy,
    },
  ];

  const groups=[{title:'Sua conta',caption:'Tudo que é seu, bem organizado.',ids:['profile','pix-keys','affiliates']},{title:'Sua operação',caption:'Ferramentas para o seu dia a dia.',ids:['partner','admin','campaigns','gateway','members']},{title:'Informações',caption:'Transparência em cada detalhe.',ids:['terms','privacy']}];
  return <div className="inex-more"><header className="clean-heading"><div><span>DO SEU JEITO</span><h1>Seu espaço<span>.</span></h1><p>Conta, ferramentas e preferências.</p></div><span className="more-brand-caption">iNEX</span></header><div className="more-layout"><aside className="more-account"><div className="more-account-orbit"><div>{user.name?.charAt(0)||'U'}</div><span/></div><h2>{user.name}</h2><p>{user.email}</p><span className="more-account-label"><ShieldCheck size={12}/>Sua conta iNEX</span><button onClick={onOpenProfile}>Ver meu perfil <ChevronRight size={14}/></button><div className="more-account-note"><span>✦</span><p>Seu próximo passo começa aqui.<br/>Tudo em um só lugar.</p></div></aside><div className="more-groups">{groups.map(group=>{const items=group.ids.map(id=>menuSections.find(item=>item.id===id)).filter((item):item is NonNullable<typeof item>=>!!item&&typeof item.onClick==='function');return items.length?<section className="more-group" key={group.title}><header><h2>{group.title}</h2><p>{group.caption}</p></header><div className="more-group-items">{items.map(item=><button key={item.id} onClick={item.onClick} className="more-menu-item"><span className="more-menu-icon">{item.icon}</span><span className="more-menu-copy"><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={15} className="more-menu-chevron"/></button>)}</div></section>:null})}<footer className="more-footer"><span>iNEX · Seu espaço financeiro</span><button onClick={onLogout}><LogOut size={14}/>Sair da conta</button></footer></div></div></div>;
};
