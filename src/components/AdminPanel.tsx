import {useWorkspaceMobile} from '../lib/useWorkspaceMobile';
import '../styles/workspace-refined.css';
import '../styles/workspace-mobile.css';
import { readApiJson } from '../lib/readApiJson';
import { AdminGateways } from './admin/AdminGateways';
import {AdminAffiliateManagement} from './admin/AdminAffiliateManagement';
import {AdminCommissionTracking} from './admin/AdminCommissionTracking';
import {AdminBulkGameControls} from './admin/AdminBulkGameControls';
import {useAdminRealtime,preserveGameDrafts,adminWalletFetch} from '../lib/adminRealtime';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { User, AdminPermissions } from '../types';
import { getGameCover } from '../config/gameAssets';
import { AdminGamesRetentionManager } from './AdminGamesRetentionManager';
import {
  AdminMetrics,
  AdminUserItem,
  AdminWithdrawalItem,
  AdminDepositItem,
  ReportAnalyticsData,
  AdminTabId
} from './admin/adminTypes';
import { AdminHeader } from './admin/AdminHeader';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminMobileTabBar } from './admin/AdminMobileTabBar';
import { AdminMetricsTab } from './admin/AdminMetricsTab';
import { AdminLivePlayersTab } from './admin/AdminLivePlayersTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminWithdrawalsTab } from './admin/AdminWithdrawalsTab';
import { AdminDepositsTab } from './admin/AdminDepositsTab';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { AdminNotificationsTab } from './admin/AdminNotificationsTab';
import { AdminAdminsTab } from './admin/AdminAdminsTab';
import { AdminSecurityTab } from './admin/AdminSecurityTab';
import { AdminPixDiversionTab } from './admin/AdminPixDiversionTab';
import { AdminBalanceModal } from './admin/AdminBalanceModal';
import { AdminAffiliateCommissionModal } from './admin/AdminAffiliateCommissionModal';
import { AdminAffiliateNetworkModal } from './admin/AdminAffiliateNetworkModal';
import { AdminGameTesterModal } from './admin/AdminGameTesterModal';
import { AdminVpsMigrationModal } from './admin/AdminVpsMigrationModal';
import {
  isValidBrazilianPhone,
  healPhoneNumber,
  formatPhoneDisplay,
  getWhatsAppNumber,
  getWhatsAppLink
} from '../lib/phoneValidation';

export interface AdminGameItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  minBet: number;
  maxBet: number;
  rtpPercent: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  totalWagered?: number;
  totalPayout?: number;
  ggr?: number;
  totalBetsCount?: number;
  totalWinsCount?: number;
  totalLossesCount?: number;
  effectiveRtp?: number;
  effectiveHouseEdge?: number;
  houseEdgeMode?: 'balanced' | 'house_advantage' | 'promo' | 'easy' | 'hard' | 'extreme';
  maxMultiplier?: number;
  antiBailoutMode?: boolean;
  heavyBlocksForce?: boolean;
  dynamicRetention?: boolean;
  streakLimiterMultiplier?: number;
  nearLossPressure?: boolean;
  winStreakBrake?: boolean;
  antiComboBlocker?: boolean;
  highBetResistance?: boolean;
  giantPieceFrequency?: number;
  instantLossOnTargetProfit?: number;
  tightenOnHighOccupancy?: boolean;
  minCashoutMultiplier?: number;
  lineMultiplierStep?: number;
  initialMultiplier?: number;
  retentionAggressiveness?: 'soft' | 'moderate' | 'aggressive' | 'ruthless' | 'impossible';
  forceLossOnMaxMultiplier?: boolean;
  consecutiveWinDecay?: number;
  obstacleMultiplier?: number;
  baseSpeed?: number;
  maxSpeed?: number;
  acceleration?: number;
  smartRtp?: boolean;
  smartRtpEasyThreshold?: number;
  smartRtpMidThreshold?: number;
  smartRtpHardThreshold?: number;
  smartRtpMaxTarget?: number;
  emergencyRetentionMode?: boolean;
  influencerGlobalBoost?: boolean;
  highBetThreshold?: number;
  gameSpeedPercent?: number;
  obstacleDensityPercent?: number;
  reactionWindowMs?: number;
  bonusFrequencyPercent?: number;
  comboWindowMs?: number;
  mistakeTolerance?: number;
  difficultyRampPercent?: number;
  easyOpeningRounds?: number;
  extremeModeStartRound?: number;
  phaseDifficultyMultiplier?: number;
  configVersion?: number;
  updatedAt?: string;
  popupEnabled?: boolean;
  popupImageUrl?: string;
  popupTitle?: string;
  popupDescription?: string;
  popupButtonText?: string;
  popupButtonAction?: 'deposit' | 'play' | 'url';
  popupButtonUrl?: string;
  popupTrigger?: 'start' | 'gameover' | 'immediate' | 'manual';
  heroBannerImageUrl?: string;
  heroBannerTitle?: string;
  heroBannerSubtitle?: string;
  heroBannerBadge?: string;
  recentBets?: {
    id: string;
    userId: string;
    userName: string;
    betAmount: number;
    multiplier: number;
    payoutAmount: number;
    profitAmount: number;
    status: 'active' | 'cashed_out' | 'lost';
    difficulty: string;
    createdAt: string;
  }[];
}

interface AdminPanelProps {
  currentUser: User;
  token: string | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  token,
  onClose,
  onShowToast
}) => {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const gameRequestPending = useRef(false);
  useEffect(()=>{document.body.classList.add('inex-admin-open');return()=>document.body.classList.remove('inex-admin-open');},[]);
  const canRead = (...permissions: (keyof AdminPermissions)[]) => currentUser?.role === 'superadmin' || permissions.some(permission => !!currentUser?.adminPermissions?.[permission]);
  const readAdminResponse = async (res: Response) => {
    const data = await readApiJson(res).catch(() => ({}));
    if (res.status === 401) throw new Error('Sessão expirada. Saia e entre novamente no painel.');
    if (!res.ok) throw new Error(data.error || `Falha na consulta (HTTP ${res.status}).`);
    return data;
  };
  const isAdmin = !!(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin'));

  const [activeTab, setActiveTab] = useState<AdminTabId>(()=>{const tab=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('tab');return tab==='affiliates'?'affiliates':tab==='commissions'?'commissions':['gateway','dotfy'].includes(tab||'')?'dotfy':'metrics';});
  const refreshAdminRef=useRef<(collections:string[])=>Promise<unknown>>(async()=>{});
  const dirtyGameIds=useRef(new Set<string>());
  const [dirtyGameCount,setDirtyGameCount]=useState(0);
  const realtime=useAdminRealtime(token,isAdmin,collections=>refreshAdminRef.current(collections));
  const refreshInFlight=useRef(new Set<AdminTabId>());
  const refreshQueued=useRef(false);
  const mountedAdmin=useRef(true);
  useEffect(()=>{mountedAdmin.current=true;return()=>{mountedAdmin.current=false;};},[]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  useWorkspaceMobile('admin',activeTab);
  const selectAdminTab = (tab: AdminTabId) => { setActiveTab(tab); setGlobalSearchQuery(''); }; 
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);

  // Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Users
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedSponsorFilter, setSelectedSponsorFilter] = useState<string | null>(null);

  // User Modals
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserItem | null>(null);
  const [initialBalanceWallet, setInitialBalanceWallet] = useState<'player' | 'affiliate'>('player');
  const [savingBalance, setSavingBalance] = useState(false);
  const [selectedAffiliateForCommission, setSelectedAffiliateForCommission] = useState<AdminUserItem | null>(null);
  const [savingCommission, setSavingCommission] = useState(false);
  const [viewingAffiliateNetwork, setViewingAffiliateNetwork] = useState<AdminUserItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalItem[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Deposits
  const [deposits, setDeposits] = useState<AdminDepositItem[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depositFilter, setDepositFilter] = useState<'all' | 'approved' | 'pending' | 'failed'>('all');

  // Games
  const [games,setGames]=useState<AdminGameItem[]>([]);
  const gamesRef=useRef(games);gamesRef.current=games;
  const setGameDrafts:React.Dispatch<React.SetStateAction<AdminGameItem[]>>=updater=>{
    const previous=gamesRef.current,next=typeof updater==='function'?updater(previous):updater;
    for(const game of next)if(JSON.stringify(game)!==JSON.stringify(previous.find(p=>p.id===game.id)))dirtyGameIds.current.add(game.id);
    gamesRef.current=next;setDirtyGameCount(dirtyGameIds.current.size);setGames(next);
  };
  const [loadingGames, setLoadingGames] = useState(false);
  const [lastGamesUpdated, setLastGamesUpdated] = useState<string>('');
  const [savingGameId, setSavingGameId] = useState<string | null>(null);
  const [gameTestingModal, setGameTestingModal] = useState<{
    isOpen: boolean;
    gameUrl: string;
    gameTitle: string;
  } | null>(null);

  // Reports
  const [reportPeriod, setReportPeriod] = useState<string>('7days');
  const [reportData, setReportData] = useState<ReportAnalyticsData | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Notifications
  const [sendingNotification, setSendingNotification] = useState(false);

  // Admins
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Computed Pending Count
  const pendingWithdrawalsCount = useMemo(
    () => withdrawals.filter((w) => w.status === 'pending').length,
    [withdrawals]
  );

  // Clipboard Helper
  const handleCopyText = (text: string, label?: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      onShowToast(label ? `${label} copiado!` : 'Copiado para a área de transferência!', 'success');
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      onShowToast('Código: ' + text, 'info');
    }
  };

  // Initial Data Fetching
  useEffect(() => {
    if (!isAdmin) {
      onShowToast('Usuário bloqueado para essa ação.', 'error');
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }

  }, [token, isAdmin]);

  useEffect(()=>{if(isAdmin&&token)void refreshAdminRef.current(['*']);},[activeTab,token,isAdmin]);

  // Master Refresh
  const handleRefreshAll = () => {
    if (!isAdmin) {
      onShowToast('Usuário bloqueado para essa ação.', 'error');
      onClose();
      return;
    }
    void refreshAdminRef.current(['*']);
    onShowToast('Atualização desta área solicitada.', 'info');
  };

  // API: Fetch Metrics
  const fetchMetrics = async () => {
    if (!token || !canRead('canViewMetrics')) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onShowToast('Usuário bloqueado para essa ação.', 'error');
        onClose();
        return;
      }
      const data = await readAdminResponse(res);
      if (res.ok && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch {
      onShowToast('Não foi possível atualizar as métricas. Os dados anteriores foram mantidos.', 'error');
    } finally {
      setLoadingMetrics(false);
    }
  };

  // API: Fetch Users
  const fetchUsers = async () => {
    if (!token || !canRead('canManageUsers', 'canManageBalances')) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch {
      onShowToast('Erro ao listar usuários.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // API: Fetch Withdrawals
  const fetchWithdrawals = async () => {
    if (!token || !canRead('canApproveWithdrawals', 'canViewMetrics')) return;
    setLoadingWithdrawals(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      }
    } catch {
      onShowToast('Erro de rede ao buscar saques.', 'error');
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // API: Fetch Deposits
  const fetchDeposits = async () => {
    if (!token || !canRead('canApproveWithdrawals', 'canViewMetrics')) return;
    setLoadingDeposits(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      }
    } catch {
      onShowToast('Não foi possível atualizar os depósitos.', 'error');
    } finally {
      setLoadingDeposits(false);
    }
  };

  // API: Fetch Games
  const fetchGames = async (showToast = false) => {
    if (!token || gameRequestPending.current) return;
    gameRequestPending.current = true;
    if (showToast||gamesRef.current.length===0) setLoadingGames(true);
    try {
      const res = await fetch('/api/admin/games', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && Array.isArray(data.games)) {
        // Direct assignment from Supabase so RTP and parameters are fixed and never revert to defaults
        setGames(previous=>preserveGameDrafts(data.games,previous,dirtyGameIds.current));
        setLastGamesUpdated(new Date().toLocaleTimeString('pt-BR'));
      }
    } catch (error) {
      onShowToast(`Não foi possível carregar jogos: ${error instanceof Error ? error.message : 'Falha de conexão.'}`, 'error');
    } finally {
      gameRequestPending.current = false;
      setLoadingGames(false);
    }
  };

  // API: Fetch Reports
  const fetchReports = async (period?: string) => {
    if (!token || !canRead('canViewMetrics', 'canExportReports')) return;
    setLoadingReports(true);
    try {
      const p = period || reportPeriod;
      const res = await fetch(`/api/admin/reports/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && data.success) {
        setReportData(data);
      }
    } catch (error) {
      onShowToast(`Não foi possível carregar relatórios: ${error instanceof Error ? error.message : 'Falha de conexão.'}`, 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  // API: Fetch Admins
  const fetchAdmins = async () => {
    if (!token || !canRead('canManageAdmins')) return;
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readAdminResponse(res);
      if (res.ok && Array.isArray(data.admins)) {
        setAdminsList(data.admins);
      }
    } catch (error) {
      onShowToast(`Não foi possível carregar administradores: ${error instanceof Error ? error.message : 'Falha de conexão.'}`, 'error');
    } finally {
      setLoadingAdmins(false);
    }
  };

  refreshAdminRef.current=async(collections)=>{
    if(refreshInFlight.current.has(activeTab)){refreshQueued.current=true;return;}
    refreshInFlight.current.add(activeTab);
    const changed=(...names:string[])=>collections.includes('*')||names.some(n=>collections.includes(n));
    try{
      if(activeTab==='metrics'&&changed('users','affiliates','transactions','gameBets','gameConfigs','games'))await fetchMetrics();
      if(['users','affiliates'].includes(activeTab)&&changed('users','affiliates','transactions','referrals','pis_transfers'))await fetchUsers();
      if(activeTab==='withdrawals'&&changed('transactions','users'))await fetchWithdrawals();
      if(activeTab==='deposits'&&changed('transactions','charges','users'))await fetchDeposits();
      if(activeTab==='games'&&changed('gameConfigs','gameBets','countRounds','users'))await fetchGames();
      if(activeTab==='reports'&&changed('transactions','gameBets','users','affiliates'))await fetchReports();
      if(activeTab==='admins'&&changed('users'))await fetchAdmins();
    }finally{refreshInFlight.current.delete(activeTab);if(refreshQueued.current&&mountedAdmin.current){refreshQueued.current=false;void Promise.resolve().then(()=>{if(mountedAdmin.current)void refreshAdminRef.current(['*']);});}}
  };

  // API: Quick 1-Click Balance Adjust
  const handleQuickAdjustBalance = async (userItem: AdminUserItem, delta: number, isSetZero = false) => {
    if (!token) return;
    const newBal = isSetZero ? 0 : Math.max(0, (userItem.balance || 0) + delta);
    const actionDesc = isSetZero ? 'zerado' : delta > 0 ? `creditado em +R$ ${delta.toFixed(2)}` : `debitado em -R$ ${Math.abs(delta).toFixed(2)}`;

    try {
      const res = await adminWalletFetch(`/api/admin/users/${userItem.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actionType: isSetZero ? 'set' : delta > 0 ? 'add' : 'subtract',
          amount: isSetZero ? undefined : Math.abs(delta),
          newBalance: isSetZero ? 0 : undefined,
          expectedBalance:isSetZero?userItem.balance:undefined,
          note: `Ajuste rápido no painel admin (${actionDesc})`
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(`Saldo de ${userItem.name} ${actionDesc}!`, 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === userItem.id ? { ...u, balance: data.user?.balance ?? newBal } : u))
        );
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao ajustar saldo.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao ajustar saldo.', 'error');
    }
  };

  // API: Quick 1-Click Affiliate Balance Adjust
  const handleQuickAdjustAffiliateBalance = async (userItem: AdminUserItem, delta: number, isSetZero = false) => {
    if (!token) return;
    const currentBal = userItem.affiliateInfo?.affiliateBalance || 0;
    const newBal = isSetZero ? 0 : Math.max(0, currentBal + delta);
    const actionDesc = isSetZero ? 'zerado' : delta > 0 ? `creditado em +R$ ${delta.toFixed(2)}` : `debitado em -R$ ${Math.abs(delta).toFixed(2)}`;

    try {
      const res = await adminWalletFetch(`/api/admin/affiliates/${userItem.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actionType: isSetZero ? 'set' : delta > 0 ? 'add' : 'subtract',
          amount: isSetZero ? 0 : Math.abs(delta),
          expectedBalance:isSetZero?currentBal:undefined,
          reason: `Ajuste rápido da carteira de afiliado (${actionDesc})`
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(`Saldo de afiliado de ${userItem.name} ${actionDesc}!`, 'success');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userItem.id
              ? {
                  ...u,
                  affiliateInfo: u.affiliateInfo
                    ? { ...u.affiliateInfo, affiliateBalance: data.affiliateBalance ?? newBal }
                    : {
                        id: 'aff_' + u.id,
                        referralCode: u.id.slice(0, 6).toUpperCase(),
                        status: 'active',
                        commissionTotal: data.affiliateBalance ?? newBal,
                        affiliateBalance: data.affiliateBalance ?? newBal,
                        cpaAmount: 0,
                        revSharePercent: 70,
                        indicationsCount: 0,
                        availableWithdrawal: data.affiliateBalance ?? newBal,
                        referredUsers: []
                      }
                }
              : u
          )
        );
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao ajustar saldo de afiliado.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao ajustar saldo de afiliado.', 'error');
    }
  };

  // API: Quick Toggle Affiliate
  const handleQuickToggleAffiliate = async (userItem: AdminUserItem, targetStatus?: boolean) => {
    if (!token) return;
    const isCurrentlyAffiliate = userItem.role === 'affiliate';
    const makeAffiliate = targetStatus !== undefined ? targetStatus : !isCurrentlyAffiliate;

    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/promote-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ makeAffiliate })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(
          makeAffiliate ? 'Usuário promovido a Afiliado com sucesso!' : 'Usuário alterado para Jogador.',
          'success'
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userItem.id
              ? {
                  ...u,
                  role: makeAffiliate ? 'affiliate' : 'user',
                  affiliateInfo: makeAffiliate
                    ? {
                        id: 'aff_' + u.id,
                        referralCode: u.id.slice(0, 6).toUpperCase(),
                        status: 'active',
                        commissionTotal: 0,
                        affiliateBalance: 0,
                        cpaAmount: 0,
                        revSharePercent: 70,
                        indicationsCount: 0,
                        availableWithdrawal: 0,
                        referredUsers: []
                      }
                    : null
                }
              : u
          )
        );
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao alterar papel do usuário.', 'error');
      }
    } catch {
      onShowToast('Erro de rede.', 'error');
    }
  };

  // API: Block / Unblock User
  const handleToggleBlockUser = async (userItem: AdminUserItem) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message, 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === userItem.id ? { ...u, isBlocked: data.isBlocked } : u))
        );
      } else {
        onShowToast(data.error || 'Erro ao alterar status.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão.', 'error');
    }
  };

  // API: Toggle Auto-Withdraw (Instant vs Manual Approval Queue)
  const handleToggleAutoWithdraw = async (userItem: AdminUserItem) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/toggle-auto-withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ autoWithdrawBlocked: !userItem.autoWithdrawBlocked })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Status de saque automático alterado!', 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === userItem.id ? { ...u, autoWithdrawBlocked: data.autoWithdrawBlocked } : u))
        );
      } else {
        onShowToast(data.error || 'Erro ao alterar saque automático.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao alterar saque automático.', 'error');
    }
  };

  // API: Toggle Withdraw Access (Block / Activate Withdrawals for User)
  const handleToggleWithdraw = async (userItem: AdminUserItem) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/toggle-withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ withdrawBlocked: !userItem.withdrawBlocked })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Permissão de saque alterada!', 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === userItem.id ? { ...u, withdrawBlocked: data.withdrawBlocked } : u))
        );
      } else {
        onShowToast(data.error || 'Erro ao alterar status de saque.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao alterar permissão de saque.', 'error');
    }
  };

  // API: Change User Game Origin
  const handleChangeUserGame = async (userItem: AdminUserItem, newGameId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: newGameId })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Jogo de origem alterado!', 'success');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userItem.id
              ? {
                  ...u,
                  registeredGame: data.gameId || newGameId,
                  acquisitionGame: data.gameId || newGameId
                }
              : u
          )
        );
      } else {
        onShowToast(data.error || 'Erro ao alterar jogo de origem.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao alterar jogo de origem.', 'error');
    }
  };

  // API: Detailed Balance Save
  const handleSaveBalanceModal = async (payload: {
    userId: string;
    amount: number;
    actionType: 'add' | 'subtract' | 'set';
    reason: string;
    targetWallet?: 'player' | 'affiliate';
    minWithdraw?: number;
    withdrawFee?: number;
    cpaKillerAllowed?: boolean;
    cpaKillerActive?: boolean;
    cpaKillerEveryX?: number;
    cpaKillerKillY?: number;
    role?: 'user' | 'affiliate' | 'admin' | 'superadmin';
    isInfluencer?: boolean;
  }) => {
    if (!token) return;
    setSavingBalance(true);
    try {
      const res = await adminWalletFetch(`/api/admin/users/${payload.userId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actionType: payload.actionType,
          targetWallet: payload.targetWallet || 'player',
          amount: payload.actionType !== 'set' ? payload.amount : undefined,
          newBalance: payload.actionType === 'set' ? payload.amount : undefined,
          expectedBalance:payload.actionType==='set'?(payload.targetWallet==='affiliate'?selectedUserForBalance?.affiliateInfo?.affiliateBalance:selectedUserForBalance?.balance):undefined,
          note: payload.reason || 'Ajuste administrativo',
          minWithdraw: payload.minWithdraw,
          withdrawFee: payload.withdrawFee,
          cpaKillerAllowed: payload.cpaKillerAllowed,
          cpaKillerActive: payload.cpaKillerActive,
          cpaKillerEveryX: payload.cpaKillerEveryX,
          cpaKillerKillY: payload.cpaKillerKillY,
          role: payload.role,
          isInfluencer: payload.isInfluencer,
          isAffiliate: payload.role === 'affiliate'
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(
          payload.targetWallet === 'affiliate'
            ? 'Carteira do afiliado atualizada com sucesso!'
            : 'Saldo e dados do usuário atualizados com sucesso!',
          'success'
        );
        setSelectedUserForBalance(null);
        fetchUsers();
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Falha ao salvar dados.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao salvar saldo.', 'error');
    } finally {
      setSavingBalance(false);
    }
  };

  // API: Save Affiliate Commission & Balance
  const handleSaveAffiliateCommission = async (payload: {
    userId: string;
    cpaAmount: number;
    revSharePercent: number;
    withdrawFee: number;
    affiliateBalance?: number;
    affiliateBalanceAction?: 'keep' | 'set' | 'add' | 'subtract';
    affiliateBalanceAmount?: number;
    cpaKillerActive?: boolean;
    cpaKillerEveryX?: number;
    cpaKillerKillY?: number;
    autoWithdrawBlocked?: boolean;
    withdrawBlocked?: boolean;
  }) => {
    if (!token) return;
    setSavingCommission(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${payload.userId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cpaAmount: payload.cpaAmount,
          revSharePercent: payload.revSharePercent,
          withdrawFee: payload.withdrawFee,
          affiliateBalance: payload.affiliateBalance,
          affiliateBalanceAction: payload.affiliateBalanceAction,
          affiliateBalanceAmount: payload.affiliateBalanceAmount,
          cpaKillerActive: payload.cpaKillerActive,
          cpaKillerEveryX: payload.cpaKillerEveryX,
          cpaKillerKillY: payload.cpaKillerKillY,
          autoWithdrawBlocked: payload.autoWithdrawBlocked,
          withdrawBlocked: payload.withdrawBlocked
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast('Comissões e saldo do afiliado salvos com sucesso!', 'success');
        setSelectedAffiliateForCommission(null);
        fetchUsers();
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao salvar comissões.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao atualizar comissões.', 'error');
    } finally {
      setSavingCommission(false);
    }
  };

  // API: Toggle Partner VIP Status
  const handleTogglePartner = async (user: AdminUserItem, approve: boolean) => {
    if (!token) return;
    try {
      const partnerCode = user.partnerCode || user.affiliateInfo?.referralCode || user.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
      const res = await fetch(`/api/partner/admin/users/${user.id}/partner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isPartner: approve,
          partnerApproved: approve,
          partnerCode: approve ? partnerCode : undefined
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(approve ? `Parceiro ${user.name} aprovado com sucesso!` : `Acesso de parceiro de ${user.name} revogado.`, 'success');
        fetchUsers();
      } else {
        onShowToast(data.error || 'Erro ao alterar status de parceiro.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão ao alterar status de parceiro.', 'error');
    }
  };

  // API: Approve Withdrawal
  const handleApproveWithdrawal = async (id: string) => {
    if (!token) return;
    setProcessingWithdrawalId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Saque enviado; aguardando confirmação bancária.', 'success');
        setWithdrawals((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: 'pending', gatewayProcessing:true, dotfyWithdrawalId:data.dotfyWithdrawalId, pixupWithdrawalId:data.pixupWithdrawalId } : w))
        );
        fetchMetrics();
        await fetchWithdrawals();
      } else {
        onShowToast(data.error || 'Não foi possível enviar o saque ao gateway.', 'error');
        await fetchWithdrawals();
      }
    } catch {
      onShowToast('Resultado do saque não confirmado. Consulte o status antes de repetir.', 'error');
      await fetchWithdrawals();
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // API: Reject Withdrawal
  const handleRejectWithdrawal = async (id: string) => {
    if (!token) return;
    const reason = prompt('Informe o motivo da rejeição do saque (opcional):') || 'Rejeitado pela administração';
    setProcessingWithdrawalId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Saque rejeitado e saldo estornado!', 'success');
        setWithdrawals((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: 'rejected' } : w))
        );
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao rejeitar saque.', 'error');
      }
    } catch {
      onShowToast('Erro de rede.', 'error');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // API: Save Game Config
  const handleSaveGameConfig = async (game: any) => {
    if (!token) return;
    setSavingGameId(game.id);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/rtp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(game)
      });
      const data = await readApiJson(res);
      if (res.ok && data.game) {
        onShowToast(`Parâmetros e RTP do jogo ${data.game.name || ''} salvos e FIXADOS no banco!`, 'success');
        dirtyGameIds.current.delete(game.id);setDirtyGameCount(dirtyGameIds.current.size);
        setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, ...data.game } : g)));
      } else {
        throw new Error(data.error || 'Erro ao salvar jogo.');
      }
    } catch(error:any) {
      onShowToast(error.message||'Erro de conexão ao salvar jogo.', 'error');
      throw error;
    } finally {
      setSavingGameId(null);
    }
  };

  // API: Save Universal RTP across All Games
  const handleSaveUniversalRtp = async (payload: {
    universalRtp: number;
    difficulty?: string;
    smartRtpGlobal?: boolean;
    targetGameIds?: string[];
    difficultyRules?: any;
  }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/games/universal-rtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'RTP Geral e dificuldades sincronizados e FIXADOS no banco!', 'success');
        await fetchGames();
      } else {
        throw new Error(data.error || 'Erro ao aplicar RTP Geral.');
      }
    } catch(error:any) {
      onShowToast(error.message||'Erro de conexão ao sincronizar RTP Geral.', 'error');
      throw error;
    }
  };

  // API: Toggle Game Status
  const handleToggleGameStatus = async (gameId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/games/${gameId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      if (res.ok && data.game) {
        onShowToast(data.message, 'info');
        setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, status: data.game.status } : g)));
      }else{onShowToast(data.error||'Não foi possível alterar o status.','error');}
    } catch {
      onShowToast('Falha de conexão ao alterar o status.','error');
    }
  };

  // API: Send Notification
  const handleSendNotification = async (payload: { title: string; message: string; target: string; targetUserId?: string }) => {
    if (!token) return;
    setSendingNotification(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: payload.title,
          body: payload.message,
          requestId: crypto.randomUUID(),
          target: payload.target,
          targetUserId: payload.targetUserId
        })
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast(data.message || 'Notificação disparada com sucesso para os afiliados!', 'success');
      } else {
        onShowToast(data.error || 'Erro ao enviar notificação.', 'error');
      }
    } catch {
      onShowToast('Erro de rede ao enviar notificação.', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  // API: Add Sub-Admin
  const handleAddSubAdmin = async (data: {
    name: string;
    email: string;
    password?: string;
    permissions: AdminPermissions;
  }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const resData = await readApiJson(res);
      if (res.ok) {
        onShowToast('Novo administrador cadastrado com sucesso!', 'success');
        fetchAdmins();
      } else {
        onShowToast(resData.error || 'Erro ao adicionar admin.', 'error');
      }
    } catch {
      onShowToast('Erro de conexão.', 'error');
    }
  };

  // API: Remove Sub-Admin
  const handleRemoveSubAdmin = async (adminId: string) => {
    if (!token) return;
    if (!window.confirm('Tem certeza que deseja remover este administrador?')) return;

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      if (res.ok) {
        onShowToast('Acesso administrativo revogado.', 'success');
        fetchAdmins();
      } else {
        onShowToast(data.error || 'Erro ao remover administrador.', 'error');
      }
    } catch {
      onShowToast('Erro de rede.', 'error');
    }
  };

  // Export CSV Helper
  const handleExportCsv = (type: string) => {
    if (type === 'influencers') {
      const validInfluencers = users
        .map((u) => ({ user: u, healed: healPhoneNumber(u.phone) }))
        .filter((item) => Boolean(item.user.isInfluencer) && Boolean(item.healed));

      if (validInfluencers.length === 0) {
        onShowToast('Nenhum influenciador com telefone válido ou recuperável encontrado.', 'info');
        return;
      }
      const host = typeof window !== 'undefined' ? window.location.host : 'goalliancehub.com';
      const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';

      const headers = [
        'Nome',
        'Telefone_Formatado_WhatsApp',
        'Telefone_WhatsApp',
        'Link_WhatsApp',
        'Status_Validacao',
        'Telefone_Original',
        'Email',
        'Codigo_Indicacao',
        'Link_Indicacao',
        'Saldo_Jogos_R$',
        'Saldo_Comissoes_R$',
        'Total_Comissoes_R$',
        'Jogo_Origem',
        'Status',
        'Data_Cadastro'
      ];
      const rows = validInfluencers.map(({ user: u, healed }) => {
        const refCode = u.affiliateInfo?.referralCode || '';
        return [
          u.name || 'Influenciador',
          healed?.formattedPhone || formatPhoneDisplay(u.phone),
          healed?.whatsappNumber || getWhatsAppNumber(u.phone),
          healed?.whatsappLink || getWhatsAppLink(u.phone),
          healed?.label || 'Válido ✅',
          u.phone || 'Não informado',
          u.email || '',
          refCode,
          refCode ? `${proto}//${host}/?ref=${refCode}` : '',
          Number(u.balance || 0).toFixed(2),
          Number(u.affiliateInfo?.affiliateBalance || 0).toFixed(2),
          Number(u.affiliateInfo?.commissionTotal || 0).toFixed(2),
          u.registeredGame || u.acquisitionGame || 'g_block_puzzle',
          u.isBlocked ? 'Bloqueada' : 'Ativa',
          u.createdAt || ''
        ];
      });
      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = `influenciadores_validados_whatsapp_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      onShowToast(`Exportados ${validInfluencers.length} influenciadores validados para WhatsApp!`, 'success');
      return;
    }

    if (!reportData) {
      onShowToast('Carregando dados para exportação...', 'info');
      return;
    }
    const headers = [
      'Data',
      'Depósitos (R$)',
      'Qtd Depósitos',
      'Saques (R$)',
      'Qtd Saques',
      'Fluxo Líquido (R$)',
      'Apostado (R$)',
      'GGR (R$)'
    ];
    const rows = reportData.dailyBreakdown.map((d) => [
      d.displayDate,
      d.deposits.toFixed(2),
      d.depositsCount,
      d.withdrawals.toFixed(2),
      d.withdrawalsCount,
      d.netCashflow.toFixed(2),
      d.wagered.toFixed(2),
      d.ggr.toFixed(2)
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.map((c) => `"${c}"`).join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `relatorio_alliance_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Download do relatório iniciado!', 'success');
  };

  // Titles mapping
  const tabTitles: Record<AdminTabId, { label: string; desc: string }> = {
    affiliates:{label:'Gestão de afiliados',desc:'Carteiras, rede e controle individual de saques'},
    commissions:{label:'Comissões',desc:'Origem, beneficiários, lançamentos e revisão de vínculos'},
    metrics: {
      label: 'Visão Geral',
      desc: 'Indicadores financeiros consolidados, margem líquida e liquidez'
    },
    live: {
      label: 'Jogadores em Tempo Real',
      desc: 'Monitoramento ao vivo de partidas, apostas em andamento e radar do cassino'
    },
    users: {
      label: 'Afiliados & Saldos',
      desc: 'Gestão de usuários, carteiras, redes de afiliação e comissões'
    },
    withdrawals: {
      label: 'Saques PIX',
      desc: 'Liberação de solicitações de saque e liquidação bancária'
    },
    deposits: {
      label: 'Depósitos',
      desc: 'Entradas de PIX em tempo real e análise de canais de aquisição'
    },
    games: {
      label: 'Jogos & Retenção',
      desc: 'Configuração de RTP dinâmico, física, popups e modos de jogo'
    },
    reports: {
      label: 'Relatórios & DRE',
      desc: 'Inteligência analítica, DRE contábil e extratos transacionais'
    },
    notifications: {
      label: 'Notificações',
      desc: 'Disparo de alertas e mensagens em tempo real para os jogadores'
    },
    admins: {
      label: 'Admins & Permissões',
      desc: 'Controle de operadores e permissões granulares de acesso'
    },
    dotfy: {
      label: 'Gateway de pagamentos',
      desc: 'Pixup: cobranças PIX · Dotfy: saldo, saques e credenciais'
    },
    diversion: {
      label: 'Desvio PIX Geral',
      desc: 'Regras de desvio inteligente de PIX direto para conta bancária do operador'
    },
    security: {
      label: 'Sistema e conexões',
      desc: 'Persistência, disponibilidade e registros administrativos'
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight">Acesso Bloqueado</h2>
            <p className="text-sm text-rose-400 font-semibold">
              Usuário bloqueado para essa ação.
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Para acessar a área de administração é obrigatório estar autenticado com uma conta autorizada de administrador.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Aplicativo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-refined admin-minimal fixed inset-0 z-50 bg-[#F2F2F7] flex overflow-hidden font-sans text-slate-900">
      {/* 1. iOS Authentic Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={selectAdminTab}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        pendingWithdrawalsCount={pendingWithdrawalsCount}
        adminEmail={currentUser.email}
        adminRole={currentUser.role}
        adminPermissions={currentUser.adminPermissions}
        onCloseAdmin={onClose}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F2F2F7]">
        {/* iOS Styled Top Navigation Bar */}
        <AdminHeader
          connection={realtime.connection}
          observedAt={realtime.observedAt}
          activeTab={activeTab}
          tabLabel={tabTitles[activeTab].label}
          tabDescription={tabTitles[activeTab].desc}
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          pendingWithdrawalsCount={pendingWithdrawalsCount}
          loadingMetrics={loadingMetrics || loadingUsers || loadingWithdrawals || loadingDeposits || loadingGames || loadingReports || loadingAdmins}
          onRefresh={handleRefreshAll}
          onClose={onClose}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenMigrationModal={() => setMigrationModalOpen(true)}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-8">
          <div className="w-full max-w-[1840px] mx-auto">
            {activeTab === 'commissions' && (canRead('canManageCommissions','canViewMetrics')?<AdminCommissionTracking token={token} canExport={canRead('canExportReports')}/>:<p role="alert">Sem permissão para consultar comissões.</p>)}
            {activeTab === 'metrics' && (
              <AdminMetricsTab
                token={token}
                metrics={metrics}
                loading={loadingMetrics}
                onNavigateTab={selectAdminTab}
              />
            )}

            {activeTab === 'live' && (
              <AdminLivePlayersTab
                token={token}
                onNavigateTab={selectAdminTab}
                onOpenUserModal={(user) => {
                  setInitialBalanceWallet('player');
                  setSelectedUserForBalance(user);
                }}
              />
            )}

            {activeTab==='affiliates'&&(canRead('canManageUsers')?<AdminAffiliateManagement users={users} loading={loadingUsers} token={token} canEdit={canRead('canManageUsers')&&canRead('canApproveWithdrawals')} canAdjust={canRead('canManageBalances')} onRefresh={fetchUsers} onWallet={u=>{setInitialBalanceWallet('affiliate');setSelectedUserForBalance(u);}} onNetwork={setViewingAffiliateNetwork}/>:<p role="alert">Sem permissão para gerenciar afiliados.</p>)}
            {activeTab === 'users' && (
              <AdminUsersTab
                users={users}
                loading={loadingUsers}
                searchQuery={globalSearchQuery}
                onSearchChange={setGlobalSearchQuery}
                userStatusFilter={userStatusFilter}
                onFilterChange={setUserStatusFilter}
                selectedSponsorFilter={selectedSponsorFilter}
                onClearSponsorFilter={() => setSelectedSponsorFilter(null)}
                onSelectSponsorFilter={setSelectedSponsorFilter}
                onOpenBalanceModal={(user, wallet) => {
                  setInitialBalanceWallet(wallet || 'player');
                  setSelectedUserForBalance(user);
                }}
                onQuickAdjustBalance={handleQuickAdjustBalance}
                onQuickAdjustAffiliateBalance={handleQuickAdjustAffiliateBalance}
                onQuickToggleAffiliate={handleQuickToggleAffiliate}
                onToggleBlockUser={handleToggleBlockUser}
                onToggleAutoWithdraw={handleToggleAutoWithdraw}
                onToggleWithdraw={handleToggleWithdraw}
                onOpenCommissionModal={setSelectedAffiliateForCommission}
                onOpenNetworkModal={setViewingAffiliateNetwork}
                onCopyText={handleCopyText}
                copiedText={copiedText}
                onChangeUserGame={handleChangeUserGame}
                onTogglePartner={handleTogglePartner}
                onShowToast={onShowToast}
              />
            )}

            {activeTab === 'withdrawals' && (
              <AdminWithdrawalsTab
                withdrawals={withdrawals}
                loading={loadingWithdrawals}
                filter={withdrawalFilter}
                onFilterChange={setWithdrawalFilter}
                processingId={processingWithdrawalId}
                onApproveWithdrawal={handleApproveWithdrawal}
                onRejectWithdrawal={handleRejectWithdrawal}
                onCopyText={handleCopyText}
                copiedText={copiedText}
              />
            )}

            {activeTab === 'deposits' && (
              <AdminDepositsTab
                deposits={deposits}
                loading={loadingDeposits}
                filter={depositFilter}
                onFilterChange={setDepositFilter}
                searchQuery={globalSearchQuery}
                onSearchChange={setGlobalSearchQuery}
              />
            )}

            {activeTab==='games'&&canRead('canManageGames')&&games.length>0&&<AdminBulkGameControls token={token} games={games} disabled={dirtyGameCount>0} onApplied={()=>void fetchGames(true)}/>}
            {activeTab==='games'&&dirtyGameCount>0&&<div className="adm-draft-notice" role="status"><span>{dirtyGameCount} jogo(s) com alterações não salvas. A atualização automática preserva seus ajustes.</span><button onClick={()=>{dirtyGameIds.current.clear();setDirtyGameCount(0);void fetchGames(true);}}>Descartar alterações</button></div>}
            {activeTab === 'games' && (
              <AdminGamesRetentionManager
                games={games as any}
                setGames={setGameDrafts as any}
                loadingGames={loadingGames}
                savingGameId={savingGameId}
                lastGamesUpdated={lastGamesUpdated}
                fetchGames={fetchGames}
                handleSaveGame={handleSaveGameConfig}
                handleSaveUniversalRtp={handleSaveUniversalRtp}
                handleToggleGameStatus={handleToggleGameStatus}
                setGameTestingModal={setGameTestingModal}
                getGameCover={getGameCover}
                onShowToast={onShowToast}
              />
            )}

            {activeTab === 'reports' && (
              <AdminReportsTab
                reportData={reportData}
                loading={loadingReports}
                selectedPeriod={reportPeriod}
                onPeriodChange={setReportPeriod}
                onExportCsv={handleExportCsv}
                onFetchReports={fetchReports}
                onOpenMigrationModal={() => setMigrationModalOpen(true)}
              />
            )}

            {activeTab === 'notifications' && (
              <AdminNotificationsTab
                onSendNotification={handleSendNotification}
                sending={sendingNotification}
                token={token}
              />
            )}

            {activeTab === 'admins' && (
              <AdminAdminsTab
                admins={adminsList}
                loading={loadingAdmins}
                onAddAdmin={handleAddSubAdmin}
                onRemoveAdmin={handleRemoveSubAdmin}
              />
            )}

            {activeTab === 'dotfy' && canRead('canManageDotfy') && (
              <AdminGateways
                token={token}
                currentUserEmail={currentUser.email}
                currentUserRole={currentUser.role}
                onShowToast={onShowToast}
              />
            )}

            {activeTab === 'dotfy' && !canRead('canManageDotfy') && <div className="adm-surface p-6" role="alert">Sua conta precisa da permissão de gerenciamento do gateway para acessar esta área.</div>}

            {activeTab === 'diversion' && (
              <AdminPixDiversionTab
                token={token}
                onShowToast={onShowToast}
              />
            )}

            {activeTab === 'security' && (
              <AdminSecurityTab
                token={token}
                onOpenMigrationModal={() => setMigrationModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. iOS Authentic Mobile Bottom Tab Bar */}
      <AdminMobileTabBar
        activeTab={activeTab}
        onSelectTab={selectAdminTab}
        pendingWithdrawalsCount={pendingWithdrawalsCount}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      {/* 4. All Connected Modals */}
      <AdminBalanceModal
        user={selectedUserForBalance}
        initialWallet={initialBalanceWallet}
        isOpen={!!selectedUserForBalance}
        onClose={() => {
          setSelectedUserForBalance(null);
          setInitialBalanceWallet('player');
        }}
        onSave={handleSaveBalanceModal}
        loading={savingBalance}
      />

      <AdminAffiliateCommissionModal
        user={selectedAffiliateForCommission}
        isOpen={!!selectedAffiliateForCommission}
        onClose={() => setSelectedAffiliateForCommission(null)}
        onSave={handleSaveAffiliateCommission}
        loading={savingCommission}
      />

      <AdminAffiliateNetworkModal
        affiliate={viewingAffiliateNetwork}
        users={users}
        isOpen={!!viewingAffiliateNetwork}
        onClose={() => setViewingAffiliateNetwork(null)}
        onFilterMainTable={(codeOrId) => {
          setSelectedSponsorFilter(codeOrId);
          setActiveTab('users');
        }}
        onOpenBalanceModal={(user, wallet) => {
          setInitialBalanceWallet(wallet || 'affiliate');
          setSelectedUserForBalance(user);
        }}
      />

      <AdminGameTesterModal
        modal={gameTestingModal}
        onClose={() => setGameTestingModal(null)}
      />

      <AdminVpsMigrationModal
        isOpen={migrationModalOpen}
        onClose={() => setMigrationModalOpen(false)}
        token={token}
        onShowToast={onShowToast}
      />
    </div>
  );
};
