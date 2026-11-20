import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Users, Lock, Unlock, MessageCircle, Bell, Activity, Percent, Sliders, ArrowDownLeft, Wallet, TrendingUp } from 'lucide-react';
import { PartnerAffiliateStats } from '../../types';
import { getPartnerCutFromAffiliateRevShare } from '../../utils/partnerCommission';
import './PartnerAffiliateDetailModal.css';
interface PartnerAffiliateDetailModalProps {
  isOpen: boolean; onClose: () => void; affiliate: PartnerAffiliateStats | null;
  onToggleAutoWithdraw: (affiliateId: string, currentBlocked: boolean) => Promise<boolean>;
  onOpenSendAlert: (affiliate: PartnerAffiliateStats) => void;
  onOpenEditCommission?: (affiliate: PartnerAffiliateStats) => void;
}
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const PartnerAffiliateDetailModal: React.FC<PartnerAffiliateDetailModalProps> = ({ isOpen, onClose, affiliate, onToggleAutoWithdraw, onOpenSendAlert, onOpenEditCommission }) => {
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [isOpen, onClose]);
  if (!isOpen || !affiliate) return null;
  const phone = (affiliate.phone || '').replace(/\D/g, '');
  const wa = phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : null;
  const toggle = async () => {
    setToggling(true); setError('');
    try { if (!(await onToggleAutoWithdraw(affiliate.id, affiliate.autoWithdrawBlocked))) setError('Não foi possível atualizar. Tente novamente.'); }
    catch { setError('Não foi possível atualizar. Tente novamente.'); }
    finally { setToggling(false); }
  };
  const metrics = [
    { icon: Users, label: 'Jogadores na rede', value: affiliate.totalPlayersInvited.toLocaleString('pt-BR') },
    { icon: ArrowDownLeft, label: 'Total depositado', value: money(affiliate.totalDeposited) },
    { icon: TrendingUp, label: 'Volume apostado', value: money(affiliate.totalVolumeWagered) },
    { icon: Wallet, label: 'Sua comissão', value: money(affiliate.commissionGeneratedForPartner) }
  ];
  return <div className="pa-detail-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="pa-detail" role="dialog" aria-modal="true" aria-labelledby="pa-detail-title" tabIndex={-1} ref={dialog}>
      <header className="pa-detail-header"><div><span className="pa-detail-eyebrow">REDE DE AFILIADOS</span><h2 id="pa-detail-title">Visão do afiliado</h2></div><button className="pa-detail-close" onClick={onClose} aria-label="Fechar detalhes"><X size={19}/></button></header>
      <div className="pa-detail-scroll">
        <section className="pa-detail-profile"><div className="pa-detail-avatar">{affiliate.name.charAt(0).toUpperCase()}</div><div className="pa-detail-identity"><div className="pa-detail-name"><h3>{affiliate.name}</h3><span className={`pa-detail-status ${affiliate.isOnlineNow ? 'is-online' : ''}`}><i/>{affiliate.isOnlineNow ? 'Online' : 'Offline'}</span></div><p><Mail size={13}/><span>{affiliate.email}</span></p><div className="pa-detail-meta"><span>Ref. <b>{affiliate.referralCode}</b></span><span>Desde {new Date(affiliate.createdAt).toLocaleDateString('pt-BR')}</span></div></div></section>
        <div className="pa-detail-actions">{wa ? <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>WhatsApp</a> : <button disabled><MessageCircle size={16}/>Sem WhatsApp</button>}<button className="pa-detail-primary" onClick={() => onOpenSendAlert(affiliate)}><Bell size={16}/>Enviar notificação</button></div>
        <section className="pa-detail-metrics" aria-label="Resumo da rede">{metrics.map(({icon: Icon, label, value}) => <div key={label}><span><Icon size={15}/>{label}</span><strong>{value}</strong></div>)}</section>
        <section className="pa-detail-section"><div className="pa-detail-section-heading"><div><span className="pa-detail-icon"><Percent size={17}/></span><h4>Comissão e margem</h4></div>{onOpenEditCommission && <button onClick={() => onOpenEditCommission(affiliate)}><Sliders size={14}/>Editar taxa</button>}</div><div className="pa-detail-rates"><div><span>Comissão do afiliado</span><strong>{affiliate.revSharePercent ?? 70}<small>%</small></strong></div><div><span>Sua margem de parceiro</span><strong>{getPartnerCutFromAffiliateRevShare(affiliate.revSharePercent ?? 70)}<small>%</small></strong></div></div></section>
        <section className="pa-detail-section"><div className="pa-detail-security"><span className="pa-detail-icon">{affiliate.autoWithdrawBlocked ? <Lock size={17}/> : <Unlock size={17}/>}</span><div><h4>Saque automático PIX</h4><p>{affiliate.autoWithdrawBlocked ? 'Bloqueado · aprovação manual necessária' : 'Habilitado · processamento automático'}</p></div><button role="switch" aria-checked={!affiliate.autoWithdrawBlocked} aria-label="Habilitar saque automático PIX" disabled={toggling} onClick={toggle} className={`pa-detail-switch ${!affiliate.autoWithdrawBlocked ? 'is-on' : ''}`}><span/></button></div>{error && <p className="pa-detail-error" role="alert">{error}</p>}</section>
        <section className="pa-detail-activity"><div className="pa-detail-activity-heading"><h4><Activity size={16}/>Atividades da rede</h4><span>Últimos eventos</span></div>{affiliate.recentActivity?.length ? <div className="pa-detail-events">{affiliate.recentActivity.map(act => <div className="pa-detail-event" key={act.id}><span className={`pa-detail-event-icon ${act.type === 'deposit' ? 'is-deposit' : ''}`}>{act.type === 'deposit' ? <ArrowDownLeft size={16}/> : <Activity size={16}/>}</span><p title={act.description}>{act.description}</p><div>{act.amount !== undefined && <strong>{money(act.amount)}</strong>}<time>{new Date(act.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</time></div></div>)}</div> : <div className="pa-detail-empty"><Activity size={22}/><p>Nenhuma atividade recente</p><span>As movimentações desta rede aparecerão aqui.</span></div>}</section>
      </div><footer className="pa-detail-footer"><span>Detalhes e controles do afiliado</span><button onClick={onClose}>Concluir</button></footer>
    </div>
  </div>;
};
