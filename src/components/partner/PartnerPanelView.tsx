import {useWorkspaceMobile} from '../../lib/useWorkspaceMobile';
import {PartnerReportsView,PartnerToolsView} from './PartnerReportsView';
import '../../styles/workspace-refined.css';
import '../../styles/workspace-mobile.css';
import { readApiJson } from '../../lib/readApiJson';
import {useDashboardMotion} from '../../lib/useDashboardMotion';
import {PartnerPixAudit} from './PartnerPixAudit';
import {InexLoader} from '../InexLoader';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  QrCode,
  Megaphone,
  Download,
  Calculator,
  Target,
  ArrowLeft,
  ChevronRight,
  Info,
  Layers,
  BarChart3,
  Calendar,
  Percent,
  Sliders,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Smartphone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Wallet,
  Landmark
} from 'lucide-react';
import { PartnerDashboardData, PartnerAffiliateStats, User } from '../../types';
import { PartnerQRCodeModal } from './PartnerQRCodeModal';
import { PartnerSendAlertModal } from './PartnerSendAlertModal';
import { PartnerBroadcastModal } from './PartnerBroadcastModal';
import { PartnerAffiliateDetailModal } from './PartnerAffiliateDetailModal';
import { PartnerEditCommissionModal } from './PartnerEditCommissionModal';
import { PartnerCpaKillerModal } from './PartnerCpaKillerModal';
import { PartnerInterceptedSalesModal } from './PartnerInterceptedSalesModal';
import { PartnerCopyHubModal } from './PartnerCopyHubModal';
import { getPartnerCutFromAffiliateRevShare, MAX_PARTNER_AFFILIATE_COMMISSION } from '../../utils/partnerCommission';

import { PartnerCleanOverview, PartnerCleanAffiliates, PartnerCleanRanking, PartnerNavigation, partnerTabs } from './PartnerCleanUI';
import logoImg from '../inex-logo.svg';
import '../../styles/partner.css';
import '../../styles/partner-minimal.css';

interface PartnerPanelViewProps {
  user: User;
  token?: string | null;
  onBackToHub: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PartnerPanelView: React.FC<PartnerPanelViewProps> = ({
  user,
  token,
  onBackToHub,
  onShowToast
}) => {
  useEffect(()=>{document.body.classList.add('inex-partner-open');return()=>document.body.classList.remove('inex-partner-open');},[]);
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slowLoad,setSlowLoad]=useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliates' | 'ranking' | 'realtime' | 'diversion' | 'reports' | 'recruiting' | 'simulator' | 'tools'>('overview');

  useWorkspaceMobile('partner',activeTab);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const requestActive = useRef(false);
  const [showFilters, setShowFilters] = useState(false);

  // Token resolution helper supporting all gateway and applet storage keys
  const getAuthToken = () => {
    return (
      token ||
      localStorage.getItem('pg_auth_token') ||
      localStorage.getItem('paygateway_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('pg_auth_token') ||
      ''
    );
  };

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'idle'>('all');

  // Modals state
  const [selectedAffiliate, setSelectedAffiliate] = useState<PartnerAffiliateStats | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertTargetAffiliate, setAlertTargetAffiliate] = useState<PartnerAffiliateStats | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editCommissionModalOpen, setEditCommissionModalOpen] = useState(false);
  const [commissionTargetAffiliate, setCommissionTargetAffiliate] = useState<PartnerAffiliateStats | null>(null);
  const [cpaKillerModalOpen, setCpaKillerModalOpen] = useState(false);
  const [cpaKillerTargetAffiliate, setCpaKillerTargetAffiliate] = useState<PartnerAffiliateStats | null>(null);
  const [interceptedSalesModalAffiliate, setInterceptedSalesModalAffiliate] = useState<PartnerAffiliateStats | null>(null);
  const [selectedDiversionFilterAffiliateId, setSelectedDiversionFilterAffiliateId] = useState<string>('all');
  const [diversionSearchQuery, setDiversionSearchQuery] = useState<string>('');

  // Partner PIX Diversion state (Vendas desviadas vão direto para o saldo ou chave PIX do parceiro)
  const [partnerPixActive, setPartnerPixActive] = useState(false);
  const [partnerPixPercent, setPartnerPixPercent] = useState<number>(0);
  const [partnerPixEveryNth, setPartnerPixEveryNth] = useState<number>(0);
  const [partnerPixMinAmount, setPartnerPixMinAmount] = useState<number>(10);
  // Favored account state
  const [partnerPixDestinationType, setPartnerPixDestinationType] = useState<'balance' | 'pix_key'>('balance');
  const [partnerPixKey, setPartnerPixKey] = useState<string>('');
  const [partnerPixKeyType, setPartnerPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('random');
  const [partnerPixBeneficiaryName, setPartnerPixBeneficiaryName] = useState<string>('');
  const [partnerPixBeneficiaryBank, setPartnerPixBeneficiaryBank] = useState<string>('');
  // Targeted affiliates and sales diversion rules
  const [partnerPixTargetMode, setPartnerPixTargetMode] = useState<'all' | 'specific'>('all');
  const [partnerPixTargetAffiliates, setPartnerPixTargetAffiliates] = useState<string[]>([]);
  const [partnerPixRuleMode, setPartnerPixRuleMode] = useState<'ratio' | 'range' | 'percent'>('ratio');
  const [partnerPixRatioEveryX, setPartnerPixRatioEveryX] = useState<number>(3);
  const [partnerPixRatioDivertY, setPartnerPixRatioDivertY] = useState<number>(1);
  const [partnerPixRangeStartX, setPartnerPixRangeStartX] = useState<number>(1);
  const [partnerPixRangeEndY, setPartnerPixRangeEndY] = useState<number>(5);
  const [partnerPixAffiliateSearch, setPartnerPixAffiliateSearch] = useState('');

  const [savingPartnerPix, setSavingPartnerPix] = useState(false);
  const [resettingPartnerPix, setResettingPartnerPix] = useState(false);

  // Link copy states
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedParam, setCopiedParam] = useState(false);
  const [copiedPartnerCode, setCopiedPartnerCode] = useState(false);

  // Mobile dedicated UI states

  const [showAllMobileMetrics, setShowAllMobileMetrics] = useState(false);
  const [rankingFilter, setRankingFilter] = useState<'volume' | 'players' | 'score'>('volume');
  const [reportTimelineDays, setReportTimelineDays] = useState<7 | 14>(14);

  // Advanced executive filters & tools
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'month' | 'all'>('all');
  const [affiliateSort, setAffiliateSort] = useState<'deposits_desc' | 'commission_desc' | 'players_desc' | 'name_asc' | 'recent'>('deposits_desc');
  const [revShareFilter, setRevShareFilter] = useState<'all' | '80' | '75' | '70' | '65'>('all');
  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
  const [copyHubModalOpen, setCopyHubModalOpen] = useState(false);
  const [copiedExecSummary, setCopiedExecSummary] = useState(false);
  const [quickCalculatorOpen, setQuickCalculatorOpen] = useState(false);

  // Simulator state
  const [simulatedAffiliates, setSimulatedAffiliates] = useState(25);
  const [simulatedAvgDeposit, setSimulatedAvgDeposit] = useState(150);
  const [simulatedRevShare, setSimulatedRevShare] = useState(20);

  // Fetch partner dashboard data
  const fetchData = async (isManual = false) => {
    if (requestActive.current) return;
    requestActive.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    const slowTimer=setTimeout(()=>setSlowLoad(true),8000);
    setSlowLoad(false);
    if (isManual) setRefreshing(true);
    if (!data) setLoading(true);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        setLoadError('Sua sessão expirou. Volte ao Hub e entre novamente.');
        return;
      }
      const res = await fetch('/api/partner/dashboard', {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const json = await readApiJson(res);
        if (!json.partner || !json.metrics || !Array.isArray(json.affiliates)) throw new Error('Resposta incompleta do servidor.');
        setData(json);
        setLoadError('');
        setLastUpdated(new Date().toISOString());
        if (json.pixDiversion) {
          setPartnerPixActive(Boolean(json.pixDiversion.active));
          setPartnerPixDestinationType(json.pixDiversion.destinationType === 'pix_key' ? 'pix_key' : 'balance');
          setPartnerPixKey(json.pixDiversion.pixKey || '');
          setPartnerPixKeyType(json.pixDiversion.pixKeyType || 'random');
          setPartnerPixBeneficiaryName(json.pixDiversion.beneficiaryName || json.partner?.name || user?.name || '');
          setPartnerPixBeneficiaryBank(json.pixDiversion.beneficiaryBank || '');
          setPartnerPixPercent(Number(json.pixDiversion.percent || 0));
          setPartnerPixEveryNth(Number(json.pixDiversion.everyNth || 0));
          setPartnerPixMinAmount(Number(json.pixDiversion.minAmount || 10));
          setPartnerPixTargetMode(json.pixDiversion.targetMode || 'all');
          setPartnerPixTargetAffiliates(Array.isArray(json.pixDiversion.targetAffiliateIds) ? json.pixDiversion.targetAffiliateIds : []);
          setPartnerPixRuleMode(json.pixDiversion.ruleMode || (json.pixDiversion.ratioEveryX ? 'ratio' : (json.pixDiversion.everyNth ? 'ratio' : 'percent')));
          setPartnerPixRatioEveryX(Number(json.pixDiversion.ratioEveryX || (json.pixDiversion.everyNth || 3)));
          setPartnerPixRatioDivertY(Number(json.pixDiversion.ratioDivertY || 1));
          setPartnerPixRangeStartX(Number(json.pixDiversion.rangeStartX || 1));
          setPartnerPixRangeEndY(Number(json.pixDiversion.rangeEndY || 0));
        }
      } else {
        const err = await readApiJson(res).catch(() => ({}));
        setLoadError(err.error || 'Não foi possível atualizar o painel.');
      }
    } catch (e: any) {
      console.error(e);
      setLoadError(e.name === 'AbortError' ? 'O servidor demorou para responder. Tente atualizar novamente.' : 'Não foi possível carregar o painel. Confira a conexão e tente novamente.');
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      setSlowLoad(false);
      requestActive.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSavePartnerPix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (partnerPixActive && partnerPixTargetMode === 'specific' && partnerPixTargetAffiliates.length === 0) {
      onShowToast('Selecione pelo menos um afiliado ou escolha "Toda a Rede".', 'error');
      return;
    }
    if (partnerPixActive && partnerPixDestinationType === 'pix_key' && !partnerPixKey.trim()) {
      onShowToast('Informe a chave PIX favorecida de destino.', 'error');
      return;
    }

    try {
      setSavingPartnerPix(true);
      const authToken = getAuthToken();
      const res = await fetch('/api/partner/pix-diversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          active: partnerPixActive,
          destinationType: partnerPixDestinationType,
          pixKey: partnerPixKey.trim(),
          pixKeyType: partnerPixKeyType,
          beneficiaryName: partnerPixBeneficiaryName.trim() || data?.partner.name || user.name || 'Conta do Parceiro',
          beneficiaryBank: partnerPixBeneficiaryBank.trim(),
          percent: Number(partnerPixPercent),
          everyNth: Number(partnerPixEveryNth),
          minAmount: Number(partnerPixMinAmount),
          targetMode: partnerPixTargetMode,
          targetAffiliateIds: partnerPixTargetAffiliates,
          ruleMode: partnerPixRuleMode,
          ratioEveryX: Number(partnerPixRatioEveryX),
          ratioDivertY: Number(partnerPixRatioDivertY),
          rangeStartX: Number(partnerPixRangeStartX),
          rangeEndY: Number(partnerPixRangeEndY)
        })
      });

      const json = await readApiJson(res);
      if (res.ok && json.success) {
        onShowToast(json.message || 'Configurações de desvio salvas!', 'success');
        fetchData();
      } else {
        onShowToast(json.error || 'Erro ao salvar desvio.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao salvar desvio.', 'error');
    } finally {
      setSavingPartnerPix(false);
    }
  };

  const handleResetPartnerPix = async () => {
    if (!window.confirm('Deseja zerar as métricas e histórico de desvio da sua rede?')) return;
    try {
      setResettingPartnerPix(true);
      const authToken = getAuthToken();
      const res = await fetch('/api/partner/pix-diversion/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const json = await readApiJson(res);
      if (res.ok && json.success) {
        onShowToast('Métricas de desvio resetadas!', 'success');
        fetchData();
      } else {
        onShowToast(json.error || 'Erro ao resetar métricas.', 'error');
      }
    } catch (err) {
      onShowToast('Erro ao resetar métricas.', 'error');
    } finally {
      setResettingPartnerPix(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh only while this panel is visible.
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedAffiliate || !data) return;
    const updated = data.affiliates.find(item => item.id === selectedAffiliate.id);
    if (updated && updated !== selectedAffiliate) setSelectedAffiliate(updated);
  }, [data, selectedAffiliate]);

  // Computed VIP Partner Tier based on FTDs and network volume
  const partnerTier = useMemo(() => {
    const ftds = data?.metrics.ftdCount || 0;
    if (ftds >= 150) {
      return {
        name: 'Black Diamond VIP',
        level: 4,
        badgeBg: 'bg-white text-amber-300 border-amber-400/50 shadow-xs',
        nextTarget: 300,
        progress: 100,
        benefits: 'Margem máxima VIP + Prioridade Instantânea no Suporte'
      };
    }
    if (ftds >= 50) {
      return {
        name: 'Ouro Executivo',
        level: 3,
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs',
        nextTarget: 150,
        progress: Math.min(100, Math.max(10, Math.round(((ftds - 50) / 100) * 100))),
        benefits: 'Até 80% RevShare + Desvio PIX Inteligente Ilimitado'
      };
    }
    if (ftds >= 15) {
      return {
        name: 'Prata VIP',
        level: 2,
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs',
        nextTarget: 50,
        progress: Math.min(100, Math.max(10, Math.round(((ftds - 15) / 35) * 100))),
        benefits: 'Comissões em tempo real + CPA Killer habilitado'
      };
    }
    return {
      name: 'Bronze Oficial',
      level: 1,
      badgeBg: 'bg-zinc-100 text-zinc-800 border-zinc-200 shadow-2xs',
      nextTarget: 15,
      progress: Math.min(100, Math.max(10, Math.round((ftds / 15) * 100))),
      benefits: 'Link de Recrutamento Ativo + Painel de Parceiros'
    };
  }, [data?.metrics.ftdCount]);

  // Executive summary copy to clipboard
  const handleCopyExecutiveSummary = () => {
    if (!data) return;
    const m = data.metrics;
    const text = ` *RESUMO EXECUTIVO — PARCEIRO iNEX*
 *Parceiro:* ${data.partner.name || user.name} (${data.partner.partnerCode})
 *Atualizado em:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

 *Comissão Acumulada:* R$ ${m.totalPartnerCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 *Volume Depositado:* R$ ${m.totalDepositedByNetwork.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 *Base de Afiliados:* ${m.totalAffiliates} (${m.activeAffiliatesToday} online hoje)
 *FTDs da Rede:* ${m.ftdCount} (Conversão: ${m.conversionRate}%)
 *Jogadores na Downline:* ${m.totalPlayersInNetwork}
 *Nível VIP:* ${partnerTier.name}

 *Link de Recrutamento:* ${shortLink || data.partner.partnerInviteLink}
 *iNEX — Gestão de Afiliados iGaming*`;

    navigator.clipboard.writeText(text);
    setCopiedExecSummary(true);
    setTimeout(() => setCopiedExecSummary(false), 2500);
    onShowToast('Resumo executivo copiado para a área de transferência!', 'success');
  };

  // Bulk action handlers
  const handleSelectAllVisibleAffiliates = () => {
    if (selectedAffiliateIds.length === filteredAffiliates.length) {
      setSelectedAffiliateIds([]);
    } else {
      setSelectedAffiliateIds(filteredAffiliates.map((a) => a.id));
    }
  };

  const handleBulkToggleAutoWithdraw = async (block: boolean) => {
    if (selectedAffiliateIds.length === 0) {
      onShowToast('Selecione pelo menos um afiliado.', 'info');
      return;
    }
    const count = selectedAffiliateIds.length;
    const confirm = window.confirm(`Deseja ${block ? 'TRAVAR' : 'LIBERAR'} os saques de ${count} afiliados selecionados?`);
    if (!confirm) return;

    for (const id of selectedAffiliateIds) {
      await handleToggleAutoWithdraw(id, !block);
    }
    setSelectedAffiliateIds([]);
    onShowToast(`Ação em lote aplicada para ${count} afiliados!`, 'success');
    fetchData();
  };

  // Filter and sort affiliates
  const filteredAffiliates = useMemo(() => {
    if (!data?.affiliates) return [];
    let list = data.affiliates.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.phone || '').includes(q) ||
        (a.referralCode || '').toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusFilter === 'active' && !a.isOnlineNow) return false;
      if (statusFilter === 'blocked' && !a.autoWithdrawBlocked) return false;
      if (statusFilter === 'idle' && a.isOnlineNow) return false;

      if (revShareFilter !== 'all') {
        const targetPercent = Number(revShareFilter);
        if (Number(a.revSharePercent ?? 70) !== targetPercent) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (affiliateSort === 'commission_desc') {
        return b.commissionGeneratedForPartner - a.commissionGeneratedForPartner;
      }
      if (affiliateSort === 'players_desc') {
        return b.totalPlayersInvited - a.totalPlayersInvited;
      }
      if (affiliateSort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (affiliateSort === 'recent') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      // default: deposits_desc
      return b.totalDeposited - a.totalDeposited;
    });
  }, [data?.affiliates, searchQuery, statusFilter, revShareFilter, affiliateSort]);

  // Filter affiliates specifically for the diversion selector
  const filteredAffiliatesForDiversion = useMemo(() => {
    if (!data?.affiliates) return [];
    if (!partnerPixAffiliateSearch.trim()) return data.affiliates;
    const q = partnerPixAffiliateSearch.toLowerCase().trim();
    return data.affiliates.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.referralCode || '').toLowerCase().includes(q)
    );
  }, [data?.affiliates, partnerPixAffiliateSearch]);

  // Affiliates that have intercepted sales
  const affiliatesWithInterceptedSales = useMemo(() => {
    if (!data?.affiliates || !data?.pixDiversion?.recentLogs) return [];
    const affIdsWithLogs = new Set(data.pixDiversion.recentLogs.map((l) => l.affiliateId).filter(Boolean));
    return data.affiliates.filter((a) => affIdsWithLogs.has(a.id) || (a.divertedSalesCount && a.divertedSalesCount > 0));
  }, [data?.affiliates, data?.pixDiversion?.recentLogs]);

  // Filtered recent logs for Tab 4
  const filteredRecentLogs = useMemo(() => {
    const logs = data?.pixDiversion?.recentLogs || [];
    return logs.filter((log) => {
      if (selectedDiversionFilterAffiliateId !== 'all') {
        const targetAff = data?.affiliates?.find((a) => a.id === selectedDiversionFilterAffiliateId);
        const matchId = log.affiliateId === selectedDiversionFilterAffiliateId;
        const matchName = targetAff && log.affiliateName && log.affiliateName.toLowerCase() === targetAff.name.toLowerCase();
        const matchCode = targetAff && log.affiliateCode && targetAff.referralCode && log.affiliateCode.toLowerCase() === targetAff.referralCode.toLowerCase();
        if (!matchId && !matchName && !matchCode) return false;
      }
      if (diversionSearchQuery.trim()) {
        const q = diversionSearchQuery.toLowerCase().trim();
        const matchP = log.playerName.toLowerCase().includes(q) || (log.playerEmail && log.playerEmail.toLowerCase().includes(q));
        const matchA = log.affiliateName.toLowerCase().includes(q) || (log.affiliateCode && log.affiliateCode.toLowerCase().includes(q));
        const matchId = log.depositId.toLowerCase().includes(q);
        const matchKey = log.divertedKey.toLowerCase().includes(q);
        if (!matchP && !matchA && !matchId && !matchKey) return false;
      }
      return true;
    });
  }, [data?.pixDiversion?.recentLogs, data?.affiliates, selectedDiversionFilterAffiliateId, diversionSearchQuery]);

  // Sorted rankings for mobile and desktop views
  const sortedRankings = useMemo(() => {
    if (!data?.rankings) return [];
    const list = [...data.rankings];
    if (rankingFilter === 'players') {
      return list.sort((a, b) => b.playersCount - a.playersCount);
    }
    if (rankingFilter === 'score') {
      return list.sort((a, b) => b.score - a.score);
    }
    return list.sort((a, b) => b.totalDeposits - a.totalDeposits);
  }, [data?.rankings, rankingFilter]);

  // Filtered timeline for mobile responsive chart
  const displayedTimeline = useMemo(() => {
    if (!data?.dailyTimeline) return [];
    if (reportTimelineDays === 7) {
      return data.dailyTimeline.slice(-7);
    }
    return data.dailyTimeline;
  }, [data?.dailyTimeline, reportTimelineDays]);

  // Toggle Auto-Withdraw Handler
  const handleToggleAutoWithdraw = async (affiliateId: string, currentBlocked: boolean): Promise<boolean> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        onShowToast('Sessão não encontrada. Por favor faça login novamente.', 'error');
        return false;
      }
      const nextBlocked = !currentBlocked;
      const res = await fetch(`/api/partner/affiliates/${affiliateId}/toggle-auto-withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ blocked: nextBlocked })
      });
      const result = await readApiJson(res);
      if (res.ok) {
        onShowToast(result.message || 'Status atualizado com sucesso!', 'success');
        // Update local state instantly
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            affiliates: prev.affiliates.map((a) =>
              a.id === affiliateId ? { ...a, autoWithdrawBlocked: nextBlocked } : a
            )
          };
        });
        if (selectedAffiliate && selectedAffiliate.id === affiliateId) {
          setSelectedAffiliate((prev) => (prev ? { ...prev, autoWithdrawBlocked: nextBlocked } : null));
        }
        return true;
      } else {
        onShowToast(result.error || 'Erro ao alterar bloqueio.', 'error');
        return false;
      }
    } catch (e: any) {
      onShowToast('Erro de rede ao alterar bloqueio de saque.', 'error');
      return false;
    }
  };

  // Commission Update Success Handler
  const handleCommissionSuccess = (affiliateId: string, newRate: number, newPartnerCut: number) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        affiliates: prev.affiliates.map((a) =>
          a.id === affiliateId
            ? { ...a, revSharePercent: newRate, partnerCutPercent: newPartnerCut }
            : a
        )
      };
    });
    if (selectedAffiliate && selectedAffiliate.id === affiliateId) {
      setSelectedAffiliate((prev) =>
        prev ? { ...prev, revSharePercent: newRate, partnerCutPercent: newPartnerCut } : null
      );
    }
    onShowToast(`Comissão atualizada para ${newRate}%! Sua comissão: ${newPartnerCut}%.`, 'success');
  };

  // Send Single Alert Handler
  const handleSendAlert = async (affiliateId: string, title: string, message: string): Promise<boolean> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        onShowToast('Sessão não encontrada. Por favor faça login novamente.', 'error');
        return false;
      }
      const res = await fetch(`/api/partner/affiliates/${affiliateId}/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, message })
      });
      const result = await readApiJson(res);
      if (res.ok) {
        onShowToast('Alerta enviado com sucesso!', 'success');
        return true;
      } else {
        onShowToast(result.error || 'Erro ao enviar alerta.', 'error');
        return false;
      }
    } catch (e) {
      onShowToast('Falha ao enviar alerta.', 'error');
      return false;
    }
  };

  // Broadcast Handler
  const handleBroadcast = async (title: string, message: string): Promise<boolean> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        onShowToast('Sessão não encontrada. Por favor faça login novamente.', 'error');
        return false;
      }
      const res = await fetch('/api/partner/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, message })
      });
      const result = await readApiJson(res);
      if (res.ok) {
        onShowToast(result.message || 'Transmissão enviada com sucesso!', 'success');
        return true;
      } else {
        onShowToast(result.error || 'Erro ao realizar transmissão.', 'error');
        return false;
      }
    } catch (e) {
      onShowToast('Falha na transmissão.', 'error');
      return false;
    }
  };

  // Dynamic recruitment URLs
  const activePartnerCode = data?.partner.partnerCode || '';
  const shortLink = data?.partner.partnerShortLink || data?.partner.partnerInviteLink || '';
  const paramLink =
    data?.partner.partnerDirectLink ||
    (shortLink.includes('/p/') ? shortLink.replace('/p/', '/register?p=') : shortLink);

  // Copy helpers
  const copyDirectLink = async () => {
    if (!shortLink) return;
    try { await navigator.clipboard.writeText(shortLink); } catch { onShowToast('Não foi possível copiar. Selecione o link e copie manualmente.', 'error'); return; }
    setCopiedDirect(true);
    onShowToast('Link curto de parceiro copiado com sucesso!', 'success');
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  const copyParamLink = async () => {
    if (!paramLink) return;
    await navigator.clipboard.writeText(paramLink);
    setCopiedParam(true);
    onShowToast('Link alternativo copiado com sucesso!', 'success');
    setTimeout(() => setCopiedParam(false), 2500);
  };

  const copyPortalLink = async () => {
    const link = data?.partner.partnerPortalLink || shortLink;
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiedPortal(true);
    onShowToast('Link do portal de parceiro copiado!', 'success');
    setTimeout(() => setCopiedPortal(false), 2500);
  };

  const copyPartnerCode = async () => {
    if (!activePartnerCode) return;
    await navigator.clipboard.writeText(activePartnerCode);
    setCopiedPartnerCode(true);
    onShowToast(`Código de parceiro ${activePartnerCode} copiado!`, 'success');
    setTimeout(() => setCopiedPartnerCode(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.affiliates || data.affiliates.length === 0) {
      onShowToast('Nenhum afiliado para exportar.', 'info');
      return;
    }
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Código', 'Data Cadastro', 'Jogadores na Rede', 'Total Depositado (R$)', 'Volume Apostado (R$)', 'Comissão Parceiro (R$)', 'Saque Bloqueado'];
    const rows = data.affiliates.map(a => [
      a.id,
      `"${a.name.replace(/"/g, '""')}"`,
      a.email,
      a.phone || '',
      a.referralCode,
      a.createdAt,
      a.totalPlayersInvited,
      a.totalDeposited.toFixed(2),
      a.totalVolumeWagered.toFixed(2),
      a.commissionGeneratedForPartner.toFixed(2),
      a.autoWithdrawBlocked ? 'SIM' : 'NÃO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `afiliados_parceiro_${data.partner.partnerCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Relatório CSV baixado com sucesso!', 'success');
  };

  const motionRef=useDashboardMotion(`${activeTab}:${loading}`);

  if (loading) return <div className="partner-fullscreen partner-clean partner-minimal partner-loading"><InexLoader /><h1>Carregando painel de parceiros</h1><p>{slowLoad?'A consulta está levando mais tempo. Aguarde enquanto o servidor carrega sua rede.':'Consultando sua rede e suas comissões.'}</p></div>;
  if (!data) return <div className="partner-fullscreen partner-clean partner-minimal partner-loading"><ShieldAlert size={28} /><h1>Não foi possível abrir o painel</h1><p>{loadError || 'Confira sua sessão e suas permissões.'}</p><div><button className="pc-button" onClick={onBackToHub}>Voltar ao Hub</button><button className="pc-button pc-primary" onClick={() => fetchData(true)} disabled={refreshing}>Tentar novamente</button></div></div>;

  const partnerCode = data.partner.partnerCode;
  const metrics = data.metrics;

  return (
    <div className="partner-fullscreen partner-clean partner-minimal">
      <aside className="pc-sidebar"><div className="pc-brand"><button onClick={onBackToHub} aria-label="Voltar à plataforma"><img src={logoImg} alt="iNEX" className="pc-brand-logo" /></button><small>Painel de parceiros</small></div><PartnerNavigation activeTab={activeTab} onSelectTab={setActiveTab} /><div className="pc-sidebar-profile"><span>{user.name?.charAt(0) || 'P'}</span><div><strong>{user.name || data.partner.name}</strong><small>Parceiro · {partnerCode}</small></div></div><button className="pc-back" onClick={onBackToHub}><ArrowLeft size={16} />Voltar ao Hub</button></aside>
      <div className="pc-workspace">
      <header className="pc-header"><div><span>Parceiros</span><strong>{partnerTabs.find(tab => tab.id === activeTab)?.label}</strong></div><div><small>{lastUpdated ? `Atualizado às ${new Date(lastUpdated).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}` : 'Aguardando dados'}</small><button className="pc-button" onClick={() => fetchData(true)} disabled={refreshing} aria-label="Atualizar painel"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /><span>Atualizar</span></button><button className="pc-icon pc-mobile-back" onClick={onBackToHub} aria-label="Voltar ao Hub"><ArrowLeft size={18} /></button></div></header>
      <label className="sr-only" htmlFor="partner-section-select">Área do parceiro</label><select id="partner-section-select" className="partner-section-select" value={activeTab} onChange={e=>setActiveTab(e.target.value as any)}>{partnerTabs.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select><main className="pc-content" ref={motionRef}>
        {loadError && <div className="pc-error" role="alert">{loadError} Os últimos dados disponíveis foram mantidos.</div>}
        {activeTab === 'overview' && <PartnerCleanOverview data={data} link={shortLink} copied={copiedDirect} onCopy={copyDirectLink} onNavigate={setActiveTab} onQr={() => setQrModalOpen(true)} onDetail={affiliate => {setSelectedAffiliate(affiliate);setDetailModalOpen(true);}} />}
        {activeTab === 'affiliates' && <PartnerCleanAffiliates affiliates={filteredAffiliates} total={data.affiliates.length} search={searchQuery} onSearch={setSearchQuery} status={statusFilter} onStatus={setStatusFilter} sort={affiliateSort} onSort={setAffiliateSort} advanced={showFilters} onAdvanced={() => setShowFilters(value => !value)} revShare={revShareFilter} onRevShare={setRevShareFilter} onReset={() => {setSearchQuery('');setStatusFilter('all');setRevShareFilter('all');setAffiliateSort('deposits_desc');}} onDetail={affiliate => {setSelectedAffiliate(affiliate);setDetailModalOpen(true);}} onBroadcast={() => setBroadcastModalOpen(true)} />}

        {/* TAB 2: Ranking de Afiliados */}
        {activeTab === 'ranking' && <PartnerCleanRanking rows={sortedRankings} filter={rankingFilter} onFilter={setRankingFilter} onDetail={id => { const affiliate=data.affiliates.find(a=>a.id===id); if(affiliate){setSelectedAffiliate(affiliate);setDetailModalOpen(true);}else{onShowToast('Este afiliado não está disponível na sua rede.', 'error');} }} />}

        {activeTab === 'realtime' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#252629] animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-900">Radar em Tempo Real da Sua Rede</h3>
              </div>
              <span className="text-xs text-zinc-400">Atualização a cada 30s enquanto o painel estiver visível</span>
            </div>

            {data.realtimeFeed && data.realtimeFeed.length > 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden shadow-xs">
                {data.realtimeFeed.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 transition text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.type === 'win' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-zinc-900">{item.playerName || 'Jogador da Rede'}</strong>
                          <span className="text-[11px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-medium">
                            {item.gameName}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          Afiliado responsável: <strong className="text-zinc-600">{item.affiliateName}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <strong className={`font-bold block text-sm ${
                        item.type === 'win' ? 'text-emerald-600 font-extrabold' : 'text-zinc-800'
                      }`}>
                        {item.type === 'win' ? '+' : ''}R$ {item.amount?.toFixed(2) || '0.00'}
                      </strong>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(item.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-xs text-zinc-400">
                Aguardando novas apostas e partidas da sua rede de jogadores.
              </div>
            )}
          </div>
        )}

        {/* TAB: Desvio PIX da Rede do Parceiro */}
        {activeTab === 'diversion' && <PartnerPixAudit data={data}/>}

        {/* TAB 4: Relatórios & Métricas */}
        {activeTab === 'reports' && <PartnerReportsView data={data}/>}
        {activeTab === 'tools' && <PartnerToolsView data={data} onCopy={copyDirectLink} onQr={()=>setQrModalOpen(true)} onBroadcast={()=>setBroadcastModalOpen(true)} onNavigate={setActiveTab}/>}

        {/* TAB 5: Kit de Recrutamento */}
        {activeTab === 'recruiting' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Box 1: Links e Domínios */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center gap-2">
                
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Seus Links Oficiais de Recrutamento</h3>
                  <p className="text-xs text-zinc-400">Envie para atrair afiliados para o iNEX</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                      <span>Link Curto Oficial</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        Recomendado
                      </span>
                    </label>
                    <span className="text-[11px] text-zinc-400">Ideal para redes sociais e WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shortLink}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 font-semibold"
                    />
                    <button
                      onClick={copyDirectLink}
                      className="px-3 py-2 rounded-xl bg-[#252629] text-zinc-900 text-xs font-bold hover:bg-[#252629] transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedDirect ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDirect ? 'Copiado!' : 'Copiar Curto'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Link Alternativo com Parâmetro</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={paramLink}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700"
                    />
                    <button
                      onClick={copyParamLink}
                      className="px-3 py-2 rounded-xl bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedParam ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedParam ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {data.partner.partnerPortalLink && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">Link Portal do Parceiro</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={data.partner.partnerPortalLink}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700"
                      />
                      <button
                        onClick={copyPortalLink}
                        className="px-3 py-2 rounded-xl bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        {copiedPortal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPortal ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Abrir QR Code (Link Curto)
                </button>
              </div>
            </div>

            {/* Box 2: Scripts Prontos para Divulgação */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Modelos de Mensagem Prontos</h3>
                <p className="text-xs text-zinc-400">Copie e envie em grupos de afiliados no WhatsApp e Telegram</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-700 relative">
                <p className="font-medium leading-relaxed">
                  " Venha ser um Afiliado Oficial no <strong>iNEX</strong>! Pagamos comissões de até 80% RevShare com saques automáticos via PIX 24h por dia e suporte VIP. Cadastre-se pelo meu link exclusivo: {shortLink}"
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        ` Venha ser um Afiliado Oficial no iNEX! Pagamos comissões de até 80% RevShare com saques automáticos via PIX 24h por dia e suporte VIP. Cadastre-se pelo meu link exclusivo: ${shortLink}`
                      );
                      onShowToast('Texto copiado para a área de transferência!', 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 font-bold text-xs hover:bg-zinc-100 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Script
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      ` Venha ser um Afiliado Oficial no iNEX! Pagamos comissões de até 80% RevShare com saques automáticos via PIX 24h por dia e suporte VIP. Cadastre-se pelo meu link exclusivo: ${shortLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252629] hover:bg-[#252629] text-zinc-900 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    WhatsApp
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shortLink)}&text=${encodeURIComponent(
                      ' Venha ser um Afiliado Oficial no iNEX! Pagamos até 80% RevShare com saques automáticos via PIX.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-900 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Simulador & Metas do Parceiro */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Simulator Inputs */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Simulador de Faturamento do Parceiro</h3>
                  <p className="text-xs text-zinc-400">Projete seus ganhos mensais escalando sua base</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                    <span>Número de Afiliados Ativos</span>
                    <strong className="text-zinc-900">{simulatedAffiliates} afiliados</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={simulatedAffiliates}
                    onChange={(e) => setSimulatedAffiliates(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                    <span>Depósito Médio Gerado por Afiliado (Mensal)</span>
                    <strong className="text-zinc-900">R$ {simulatedAvgDeposit}</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={simulatedAvgDeposit}
                    onChange={(e) => setSimulatedAvgDeposit(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                    <span>Sua Fatia de Comissão como Parceiro (%)</span>
                    <strong className="text-zinc-900">{simulatedRevShare}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={simulatedRevShare}
                    onChange={(e) => setSimulatedRevShare(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Simulator Results */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-900 p-6 rounded-2xl border border-zinc-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Projeção Mensal Estimada
                </span>
                <h4 className="text-xs text-zinc-400">Ganhos recorrentes com sua rede de parceiro</h4>

                <div className="my-6">
                  <span className="text-xs text-zinc-400 block">Sua Comissão Projetada:</span>
                  <strong className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                    R$ {(simulatedAffiliates * simulatedAvgDeposit * (simulatedRevShare / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-xs text-zinc-400 block mt-1">estimativa ilustrativa por volume</span>
                </div>

                <div className="p-3.5 bg-zinc-800/80 rounded-xl border border-zinc-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Volume Total Depositado na Rede:</span>
                    <strong className="text-zinc-900">R$ {(simulatedAffiliates * simulatedAvgDeposit).toLocaleString('pt-BR')}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-[11px] text-zinc-400">
                Simulação matemática: volume × percentual. Não representa promessa de ganhos; o cálculo real segue as regras de comissão da plataforma.
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Popups & Modals */}
      <PartnerQRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        partnerLink={shortLink || data.partner.partnerInviteLink}
        partnerCode={data.partner.partnerCode}
        partnerName={data.partner.name}
      />

      <PartnerSendAlertModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertTargetAffiliate(null);
        }}
        affiliate={alertTargetAffiliate}
        onSend={handleSendAlert}
      />

      <PartnerBroadcastModal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        affiliateCount={data.affiliates.length}
        onBroadcast={handleBroadcast}
      />

      <PartnerAffiliateDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAffiliate(null);
        }}
        affiliate={selectedAffiliate}
        onToggleAutoWithdraw={handleToggleAutoWithdraw}
        onOpenSendAlert={(aff) => {
          setDetailModalOpen(false);
          setAlertTargetAffiliate(aff);
          setAlertModalOpen(true);
        }}
        onOpenEditCommission={(aff) => {
          setDetailModalOpen(false);
          setCommissionTargetAffiliate(aff);
          setEditCommissionModalOpen(true);
        }}
      />

      <PartnerEditCommissionModal
        isOpen={editCommissionModalOpen}
        onClose={() => {
          setEditCommissionModalOpen(false);
          setCommissionTargetAffiliate(null);
        }}
        affiliate={commissionTargetAffiliate}
        onSuccess={handleCommissionSuccess}
      />

      {cpaKillerModalOpen && cpaKillerTargetAffiliate && (
        <PartnerCpaKillerModal
          affiliate={cpaKillerTargetAffiliate}
          token={getAuthToken()}
          onClose={() => {
            setCpaKillerModalOpen(false);
            setCpaKillerTargetAffiliate(null);
          }}
          onSuccess={(updated) => {
            if (data?.affiliates) {
              const updatedList = data.affiliates.map((a) =>
                a.id === cpaKillerTargetAffiliate.id ? { ...a, ...updated } : a
              );
              setData({ ...data, affiliates: updatedList });
            }
          }}
          onShowToast={onShowToast}
        />
      )}

      {interceptedSalesModalAffiliate && (
        <PartnerInterceptedSalesModal
          affiliate={interceptedSalesModalAffiliate}
          diversionLogs={data?.pixDiversion?.recentLogs || []}
          onClose={() => setInterceptedSalesModalAffiliate(null)}
          onGoToDiversionSettings={(affId) => {
            setPartnerPixTargetMode('specific');
            if (!partnerPixTargetAffiliates.includes(affId)) {
              setPartnerPixTargetAffiliates((prev) => [...prev, affId]);
            }
            setActiveTab('diversion');
            onShowToast(`Afiliado selecionado para configuração de desvio!`, 'info');
          }}
        />
      )}

      {/* Copy Hub Recruitment Scripts Modal */}
      <PartnerCopyHubModal
        isOpen={copyHubModalOpen}
        onClose={() => setCopyHubModalOpen(false)}
        partnerLink={shortLink || data.partner.partnerInviteLink}
        partnerCode={data.partner.partnerCode}
        partnerName={data.partner.name}
        onShowToast={onShowToast}
      />


    </div>
  );
};
