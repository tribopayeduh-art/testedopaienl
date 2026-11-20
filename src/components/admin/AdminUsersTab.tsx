import {Modal} from '../Modal';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Repeat2,
  Filter,
  Crown,
  Shield,
  Percent,
  Network,
  Lock,
  Unlock,
  Coins,
  DollarSign,
  UserPlus,
  Copy,
  Check,
  Globe,
  Wallet,
  Gamepad2,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Zap,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Phone,
  FileSpreadsheet
} from 'lucide-react';
import { AdminUserItem } from './adminTypes';
import {
  IOSCard,
  IOSSearchBar,
  IOSBadge,
  IOSButton
} from './IOSComponents';
import { Pagination } from '../Pagination';
import { AdminExportInfluencersModal } from './AdminExportInfluencersModal';
import { isValidBrazilianPhone, healPhoneNumber } from '../../lib/phoneValidation';

interface AdminUsersTabProps {
  users: AdminUserItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userStatusFilter: string;
  onFilterChange: (filter: any) => void;
  selectedSponsorFilter: string | null;
  onClearSponsorFilter: () => void;
  onSelectSponsorFilter: (sponsorCodeOrId: string) => void;
  onOpenBalanceModal: (user: AdminUserItem, wallet?: 'player' | 'affiliate') => void;
  onQuickAdjustBalance: (user: AdminUserItem, delta: number, isSetZero?: boolean) => Promise<void>;
  onQuickAdjustAffiliateBalance?: (user: AdminUserItem, delta: number, isSetZero?: boolean) => Promise<void>;
  onQuickToggleAffiliate: (user: AdminUserItem, targetStatus?: boolean) => Promise<void>;
  onToggleBlockUser: (user: AdminUserItem) => Promise<void>;
  onToggleAutoWithdraw?: (user: AdminUserItem) => Promise<void>;
  onToggleWithdraw?: (user: AdminUserItem) => Promise<void>;
  onOpenCommissionModal: (user: AdminUserItem) => void;
  onOpenNetworkModal: (user: AdminUserItem) => void;
  onCopyText: (text: string, label?: string) => void;
  copiedText: string | null;
  onChangeUserGame?: (user: AdminUserItem, newGameId: string) => Promise<void>;
  onTogglePartner?: (user: AdminUserItem, approve: boolean) => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Helper to determine game badge, name and style
export const getGameInfo = (gameId?: string) => {
  const normalized = (gameId || '').toLowerCase().trim();
  if (normalized.includes('bubble')) {
    return {
      name: 'Bubble Blast',
      short: 'Bubble',
      emoji: '🫧',
      badgeClass: 'bg-purple-500/12 text-purple-800 border-purple-500/20'
    };
  }
  if (normalized.includes('dino') || normalized.includes('t-rex')) {
    return {
      name: 'Gen Dino',
      short: 'Dino',
      emoji: '🦖',
      badgeClass: 'bg-amber-500/12 text-amber-800 border-amber-500/20'
    };
  }
  if (normalized.includes('subway') || normalized.includes('runner')) {
    return {
      name: 'Subway Pay',
      short: 'Subway',
      emoji: '🏃',
      badgeClass: 'bg-amber-500/12 text-amber-800 border-amber-500/20'
    };
  }
  if (normalized.includes('scratch') || normalized.includes('raspa')) {
    return {
      name: 'Raspa Fortuna',
      short: 'Raspa',
      emoji: '🍀',
      badgeClass: 'bg-teal-500/12 text-teal-800 border-teal-500/20'
    };
  }
  return {
    name: 'Block Win',
    short: 'Block Win',
    emoji: '🧩',
    badgeClass: 'bg-blue-500/12 text-blue-800 border-blue-500/20'
  };
};

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  loading,
  searchQuery,
  onSearchChange,
  userStatusFilter,
  onFilterChange,
  selectedSponsorFilter,
  onClearSponsorFilter,
  onSelectSponsorFilter,
  onOpenBalanceModal,
  onQuickAdjustBalance,
  onQuickAdjustAffiliateBalance,
  onQuickToggleAffiliate,
  onToggleBlockUser,
  onToggleAutoWithdraw,
  onToggleWithdraw,
  onOpenCommissionModal,
  onOpenNetworkModal,
  onCopyText,
  copiedText,
  onChangeUserGame,
  onTogglePartner,
  onShowToast,
}) => {
  const [managingUserId,setManagingUserId]=useState<string|null>(null);
  const managedUser = users.find(user => user.id === managingUserId);
  const [accountSection,setAccountSection] = useState<'summary'|'access'>('summary');
  const [accountBusy,setAccountBusy] = useState(false);
  const [accountError,setAccountError] = useState('');
  const [pendingAccountAction,setPendingAccountAction] = useState<{label:string; run:()=>Promise<void>}|null>(null);
  const openAccount = (id:string) => {setAccountError('');setAccountSection('summary');setPendingAccountAction(null);setManagingUserId(id);};
  const closeAccount = () => {if(!accountBusy){setManagingUserId(null);setPendingAccountAction(null);setAccountError('');}};
  const confirmAccountAction = async () => {
    if(!pendingAccountAction || accountBusy)return;
    setAccountBusy(true);setAccountError('');
    try {await pendingAccountAction.run();setPendingAccountAction(null);}
    catch {setAccountError('Não foi possível concluir. Consulte os dados atualizados antes de tentar novamente.');}
    finally {setAccountBusy(false);}
  };

  const [activeAdjustingId, setActiveAdjustingId] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<'all' | 'bubble' | 'block' | 'dino' | 'raspa' | 'subway'>('all');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportModalMode, setExportModalMode] = useState<'all' | 'valid'>('valid');

  // Contagem de todos os influenciadores e de influenciadores com WhatsApp válido
  const totalInfluencersCount = useMemo(() => {
    return users.filter((u) => Boolean(u.isInfluencer)).length;
  }, [users]);

  const validInfluencersCount = useMemo(() => {
    return users.filter((u) => Boolean(u.isInfluencer) && Boolean(healPhoneNumber(u.phone))).length;
  }, [users]);

  const handleExportAllInfluencers = () => {
    setExportModalMode('all');
    setExportModalOpen(true);
  };

  const handleExportValidInfluencers = () => {
    setExportModalMode('valid');
    setExportModalOpen(true);
  };

  const handleQuickBalance = async (userItem: AdminUserItem, delta: number, isSetZero = false) => {
    setActiveAdjustingId(userItem.id);
    try {
      await onQuickAdjustBalance(userItem, delta, isSetZero);
    } finally {
      setActiveAdjustingId(null);
    }
  };

  const handleQuickAffiliateBalance = async (userItem: AdminUserItem, delta: number, isSetZero = false) => {
    if (!onQuickAdjustAffiliateBalance) return;
    setActiveAdjustingId(`aff_${userItem.id}`);
    try {
      await onQuickAdjustAffiliateBalance(userItem, delta, isSetZero);
    } finally {
      setActiveAdjustingId(null);
    }
  };

  const [withdrawFilter, setWithdrawFilter] = useState('all');
  const filterOptions = [
    ['all', 'Todos os perfis'], ['players', 'Jogadores'], ['affiliates', 'Afiliados'],
    ['influencers', 'Influenciadores'], ['with_sponsor', 'Com patrocinador'],
    ['organic', 'Orgânicos'], ['blocked', 'Bloqueados']
  ];
  const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const redeposits = (user: AdminUserItem) => {
    const count = user.redepositCount;
    const label = count == null ? 'Contagem indisponível' : `${count} ${count === 1 ? 'redepósito confirmado' : 'redepósitos confirmados'}`;
    return <span className="aus-count" title={label} aria-label={label}><Repeat2 size={15} aria-hidden="true" />{count ?? '—'}</span>;
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    let totalPlayerBal = 0;
    let totalAffiliateBal = 0;
    let affiliatesCount = 0;
    let influencersCount = 0;

    users.forEach((u) => {
      totalPlayerBal += Number(u.balance || 0);
      if (u.affiliateInfo?.affiliateBalance) {
        totalAffiliateBal += Number(u.affiliateInfo.affiliateBalance);
      }
      if (u.role === 'affiliate') affiliatesCount++;
      if (u.isInfluencer) influencersCount++;
    });

    return {
      totalUsers: users.length,
      affiliatesCount,
      influencersCount,
      totalPlayerBal,
      totalAffiliateBal
    };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Sponsor drilldown filter
      if (selectedSponsorFilter) {
        const sponsor = u.referredBy;
        if (!sponsor) return false;
        if (
          sponsor.affiliateId !== selectedSponsorFilter &&
          sponsor.referralCode !== selectedSponsorFilter
        ) {
          return false;
        }
      }

      // Status filters
      if (
        userStatusFilter === 'players' &&
        (u.role === 'affiliate' || u.role === 'admin' || u.role === 'superadmin')
      ) {
        return false;
      }
      if (userStatusFilter === 'affiliates' && u.role !== 'affiliate') return false;
      if (userStatusFilter === 'influencers' && !u.isInfluencer) return false;
      if (userStatusFilter === 'with_sponsor' && !u.referredBy) return false;
      if (userStatusFilter === 'organic' && !!u.referredBy) return false;
      if (userStatusFilter === 'blocked' && !u.isBlocked) return false;
      if (withdrawFilter === 'auto_withdraw' && u.autoWithdrawBlocked) return false;
      if (withdrawFilter === 'manual_withdraw' && !u.autoWithdrawBlocked) return false;
      if (withdrawFilter === 'withdraw_blocked' && !u.withdrawBlocked) return false;

      // Game of origin filter
      if (gameFilter !== 'all') {
        const gameId = (u.registeredGame || u.acquisitionGame || '').toLowerCase();
        if (gameFilter === 'subway' && !gameId.includes('subway') && !gameId.includes('runner')) return false;
        if (gameFilter === 'bubble' && !gameId.includes('bubble')) return false;
        if (gameFilter === 'dino' && !gameId.includes('dino') && !gameId.includes('t-rex')) return false;
        if (gameFilter === 'raspa' && !gameId.includes('scratch') && !gameId.includes('raspa')) return false;
        if (gameFilter === 'block' && (gameId.includes('subway') || gameId.includes('bubble') || gameId.includes('dino') || gameId.includes('scratch') || gameId.includes('raspa'))) return false;
      }

      // Query search
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const sponsor = u.referredBy;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.affiliateInfo?.referralCode || '').toLowerCase().includes(q) ||
        (sponsor?.sponsorName || '').toLowerCase().includes(q) ||
        (sponsor?.referralCode || '').toLowerCase().includes(q)
      );
    });
  }, [users, userStatusFilter, selectedSponsorFilter, searchQuery, gameFilter, withdrawFilter]);

  // 40 users per page pagination
  const PAGE_SIZE = 40;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userStatusFilter, selectedSponsorFilter, searchQuery, gameFilter, withdrawFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage, PAGE_SIZE]);

  return (
    <div className="adm-workspace AdminUsersTab space-y-5">
      <div className="aus-metrics">
        <div><Users size={21}/><span>Usuários<strong>{metrics.totalUsers.toLocaleString('pt-BR')}</strong></span></div>
        <div><Gamepad2 size={21}/><span>Volume em jogos<strong>{money(metrics.totalPlayerBal)}</strong></span></div>
        <div><Wallet size={21}/><span>Carteiras de afiliados<strong>{money(metrics.totalAffiliateBal)}</strong></span></div>
        <div><Crown size={21}/><span>Parceiros e VIPs<strong>{metrics.affiliatesCount.toLocaleString('pt-BR')}</strong></span></div>
      </div>

      {/* Active Sponsor Filter Pill Notice */}
      {selectedSponsorFilter && (
        <div className="p-3 bg-[#596777]/10 border border-[#596777]/20 rounded-2xl flex items-center justify-between text-xs text-[#596777]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>
              Filtrando indicados pelo código ou ID:{' '}
              <strong className="font-mono font-bold">{selectedSponsorFilter}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSponsorFilter}
            className="text-xs font-bold text-[#596777] hover:underline cursor-pointer"
          >
            Limpar filtro
          </button>
        </div>
      )}

      <IOSCard className="aus-list">
        <div className="aus-toolbar">
          <IOSSearchBar value={searchQuery} onChange={onSearchChange} placeholder="Buscar por nome, e-mail ou PIX" />
          <select aria-label="Perfil ou origem" value={userStatusFilter} onChange={e => onFilterChange(e.target.value)}>
            {filterOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Jogo de origem" value={gameFilter} onChange={e => setGameFilter(e.target.value as typeof gameFilter)}>
            <option value="all">Todos os jogos</option><option value="bubble">Bubble Blast</option>
            <option value="block">Block Win</option><option value="dino">Gen Dino</option>
            <option value="raspa">Raspa Fortuna</option><option value="subway">Subway Pay</option>
          </select>
          <select aria-label="Tipo de saque" value={withdrawFilter} onChange={e => setWithdrawFilter(e.target.value)}>
            <option value="all">Tipo de saque</option><option value="auto_withdraw">Automático</option>
            <option value="manual_withdraw">Manual</option><option value="withdraw_blocked">Bloqueado</option>
          </select>
          <details className="aus-export">
            <summary><Download size={16}/> Exportar</summary>
            <div><button type="button" onClick={handleExportAllInfluencers}>Influenciadores ({totalInfluencersCount})</button>
            <button type="button" onClick={handleExportValidInfluencers}>WhatsApp válido ({validInfluencersCount})</button></div>
          </details>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Nenhum usuário encontrado</p>
            <p className="text-xs text-slate-400 font-medium">
              Tente ajustar os filtros ou termo de busca.
            </p>
          </div>
        ) : (
          <div>
            {/* MOBILE VIEW: High-Contrast Touch Cards (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedUsers.map((user) => {
                const isSuper = user.role === 'superadmin';
                const isAdmin = user.role === 'admin';
                const isAffiliate = user.role === 'affiliate';
                const isInfluencer = !!user.isInfluencer;
                const isBusy = activeAdjustingId === user.id || activeAdjustingId === `aff_${user.id}`;
                const gameInfo = getGameInfo(user.registeredGame || user.acquisitionGame);

                return (
                  <div key={`mob_${user.id}`} className="p-4 space-y-3.5 hover:bg-slate-50/70 transition-colors">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#596777]/12 text-[#596777] font-black text-sm flex items-center justify-center shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{user.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          {user.phone && (
                            <p className="text-[11px] font-mono text-slate-400">{user.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Origin Game Badge / Selector */}
                      {onChangeUserGame ? (
                        <select
                          value={user.registeredGame || user.acquisitionGame || 'g_block_puzzle'}
                          onChange={(e) => onChangeUserGame(user, e.target.value)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 cursor-pointer outline-none ${gameInfo.badgeClass}`}
                          title="Alterar jogo de origem deste usuário"
                        >
                          <option value="g_subway_pay">🏃 Subway Pay</option>
                          <option value="g_block_puzzle">🧩 Block Win</option>
                          <option value="g_count_masters">Count Masters</option>
                          <option value="g_bubble_blast">🫧 Bubble Blast</option>
                          <option value="g_gen_dino">🦖 Gen Dino</option>
                          <option value="g_raspa_fortuna">🍀 Raspa</option>
                          <option value="alliance_hub">🏛️ Hub</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${gameInfo.badgeClass}`}
                        >
                          <span>{gameInfo.emoji}</span>
                          <span>{gameInfo.short}</span>
                        </span>
                      )}
                    </div>

                    <div className="aus-mobile-count">{redeposits(user)} <span>Redepósitos</span></div>
                    {/* Roles and Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSuper ? (
                        <IOSBadge variant="indigo">Super Admin</IOSBadge>
                      ) : isAdmin ? (
                        <IOSBadge variant="blue">Admin</IOSBadge>
                      ) : isAffiliate ? (
                        <IOSBadge variant="purple">Afiliado</IOSBadge>
                      ) : (
                        <IOSBadge variant="gray">Jogador</IOSBadge>
                      )}
                      {isInfluencer && <IOSBadge variant="orange">Influenciador VIP</IOSBadge>}
                      {user.isPartner && user.partnerApproved && (
                        <IOSBadge variant="green">💎 Parceiro ({user.partnerCode || 'VIP'})</IOSBadge>
                      )}
                      {user.partnerRequested && !user.partnerApproved && (
                        <IOSBadge variant="orange">⚠️ Pedido Parceiro</IOSBadge>
                      )}
                      {(user.affiliateInfo?.cpaKillerActive || user.cpaKillerActive) && (
                        <IOSBadge variant="red">
                          Desvio {(user.affiliateInfo?.cpaKillerKillY ?? user.cpaKillerKillY) || 3}/
                          {(user.affiliateInfo?.cpaKillerEveryX ?? user.cpaKillerEveryX) || 10}
                        </IOSBadge>
                      )}
                      {user.autoWithdrawBlocked ? (
                        <IOSBadge variant="orange" title="Saque em análise manual">
                          ⏳ Saque Manual
                        </IOSBadge>
                      ) : (
                        <IOSBadge variant="green" title="Saque automático ativo (Instantâneo)">
                          ⚡ Saque Auto
                        </IOSBadge>
                      )}
                      {user.withdrawBlocked && (
                        <IOSBadge variant="red" title="Saques desativados pelo admin">
                          🚫 Saques Off
                        </IOSBadge>
                      )}
                      {user.isBlocked && <IOSBadge variant="red">Bloqueado</IOSBadge>}
                    </div>

                    {/* Origin / Sponsor / Partner info */}
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Patrocinador / Origem:</span>
                        {user.referredBy ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectSponsorFilter(
                                user.referredBy?.referralCode || user.referredBy?.affiliateId || ''
                              )
                            }
                            className="font-bold text-[#596777] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{user.referredBy.sponsorName}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              ({user.referredBy.referralCode})
                            </span>
                          </button>
                        ) : (
                          <span className="font-medium text-emerald-700 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" /> Orgânico
                          </span>
                        )}
                      </div>
                      {(user.partnerName || user.partnerCode) && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[11px]">
                          <span className="text-slate-400 font-medium">Parceiro Responsável:</span>
                          <span className="font-bold text-indigo-700 flex items-center gap-1">
                            <span>🤝 {user.partnerName || `Código ${user.partnerCode}`}</span>
                            {user.partnerCode && user.partnerName && (
                              <span className="font-mono text-[10px] text-indigo-400">({user.partnerCode})</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <button type="button" className="adm-text-button" aria-haspopup="dialog" onClick={()=>openAccount(user.id)}>Gerenciar conta</button>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="aus-table">
                <thead><tr>
                  <th scope="col">Usuário</th><th scope="col">Perfil</th><th scope="col">Jogo de origem</th>
                  <th scope="col">Patrocinador</th><th scope="col" className="aus-number">Saldo de jogo</th>
                  <th scope="col" className="aus-number">Saldo de afiliado</th><th scope="col" className="aus-number">Redepósitos</th>
                  <th scope="col">Ações</th>
                </tr></thead>
                <tbody>{paginatedUsers.map(user => {
                  const game = getGameInfo(user.registeredGame || user.acquisitionGame);
                  const sponsorCode = user.referredBy?.referralCode || user.referredBy?.affiliateId;
                  const role = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.isInfluencer ? 'Influenciador' : user.role === 'affiliate' ? 'Afiliado' : 'Jogador';
                  return <tr key={user.id}>
                    <td><div className="aus-person"><span aria-hidden="true">{user.name?.charAt(0).toUpperCase() || 'U'}</span><div><strong>{user.name}</strong><small>{user.email}</small>{user.phone && <small>{user.phone}</small>}</div></div></td>
                    <td><span className="aus-tag">{role}</span><small>{user.isBlocked ? 'Conta bloqueada' : user.withdrawBlocked ? 'Saque bloqueado' : user.autoWithdrawBlocked ? 'Saque manual' : 'Saque automático'}</small></td>
                    <td>{onChangeUserGame ? <select aria-label={`Jogo de origem de ${user.name}`} value={user.registeredGame || user.acquisitionGame || ''} onChange={e => onChangeUserGame(user, e.target.value)}>
                      <option value="" disabled>Não informado</option>
                      {Object.entries({g_block_puzzle:'Block Win',g_bubble_blast:'Bubble Blast',g_gen_dino:'Gen Dino',g_raspa_fortuna:'Raspa Fortuna',g_subway_pay:'Subway Pay',g_count_masters:'Count Masters',alliance_hub:'iNEX'}).map(([id,label]) => <option key={id} value={id}>{label}</option>)}
                    </select> : <span className="aus-tag">{game.name}</span>}</td>
                    <td>{user.referredBy ? <>
                      {sponsorCode ? <button type="button" className="aus-sponsor" onClick={() => onSelectSponsorFilter(sponsorCode)}>{user.referredBy.sponsorName || 'Patrocinador'}</button> : user.referredBy.sponsorName || 'Patrocinador'}
                      {user.referredBy.referralCode && <small>{user.referredBy.referralCode}</small>}
                    </> : <span className="aus-tag">Orgânico</span>}
                    {(user.partnerName || user.partnerCode) && <small>Parceiro: {user.partnerName || user.partnerCode}</small>}</td>
                    <td className="aus-number">{money(user.balance)}{(user.totalDeposited ?? 0) > 0 && <small>Dep.: {money(user.totalDeposited ?? 0)}</small>}</td>
                    <td className="aus-number">{user.affiliateInfo ? <button type="button" className="aus-sponsor" title="Ajustar saldo da carteira de afiliado" onClick={() => onOpenBalanceModal(user, 'affiliate')}>{money(user.affiliateInfo.affiliateBalance || 0)}</button> : '—'}</td>
                    <td className="aus-number">{redeposits(user)}</td>
                    <td><button type="button" className="aus-manage" aria-haspopup="dialog" onClick={() => openAccount(user.id)}>Gerenciar</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>

            {/* 40 per page Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="p-4 border-t border-black/[0.05] bg-slate-50/50">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredUsers.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="usuários"
                />
              </div>
            )}
          </div>
        )}
      </IOSCard>

      <Modal isOpen={Boolean(managedUser)} onClose={closeAccount} title="Gerenciar conta" subtitle="Informações e controles da conta" className="adm-modal adm-account-dialog" maxWidth={720}>
        {managedUser && <div className="adm-account-manager" aria-busy={accountBusy}>
          <section className="adm-account-identity">
            <span className="adm-account-avatar" aria-hidden="true">{managedUser.name?.charAt(0).toUpperCase() || 'U'}</span>
            <div><h3>{managedUser.name}</h3><p>{managedUser.email}</p><span className={`adm-account-status ${managedUser.isBlocked?'is-blocked':''}`}>{managedUser.isBlocked?'Bloqueada':'Liberada'}</span><span className="adm-account-role">{({user:'Jogador',affiliate:'Afiliado',admin:'Administrador',superadmin:'Super administrador'})[managedUser.role]}</span></div>
          </section>
          <div className="adm-account-navigation" role="group" aria-label="Seções da conta">
            <button type="button" aria-pressed={accountSection==='summary'} disabled={accountBusy || Boolean(pendingAccountAction)} onClick={()=>setAccountSection('summary')}><UserCheck size={16}/> Visão geral</button>
            <button type="button" aria-pressed={accountSection==='access'} disabled={accountBusy || Boolean(pendingAccountAction)} onClick={()=>setAccountSection('access')}><Shield size={16}/> Acesso e saques</button>
          </div>
          <div key={accountSection} className="adm-account-page">
          <div hidden={accountSection!=='summary'}>
          <section className="adm-account-section"><div className="adm-account-section-heading"><h3>Dados da conta</h3><span>Consulta</span></div><dl className="adm-account-facts">
            <div><dt>Identificador</dt><dd>{managedUser.id}</dd></div>
            <div><dt>Telefone</dt><dd>{managedUser.phone || 'Não informado'}</dd></div>
            <div><dt>Cadastro</dt><dd>{Number.isNaN(Date.parse(managedUser.createdAt))?'Não informado':new Date(managedUser.createdAt).toLocaleDateString('pt-BR')}</dd></div>
            <div><dt>Origem</dt><dd>{getGameInfo(managedUser.registeredGame || managedUser.acquisitionGame).name}</dd></div>
            <div><dt>Patrocinador</dt><dd>{managedUser.referredBy?.sponsorName || 'Orgânico'}</dd></div>
            <div><dt>Chaves PIX cadastradas</dt><dd>{managedUser.pixKeys?.length ?? 0}</dd></div>
            <div><dt>Saque mínimo</dt><dd>{managedUser.minWithdraw == null ? 'Não informado' : Number(managedUser.minWithdraw).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</dd></div>
            <div><dt>Taxa de saque</dt><dd>{managedUser.withdrawFee == null ? 'Não informada' : Number(managedUser.withdrawFee).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</dd></div>
            <div><dt>Código de afiliado</dt><dd>{managedUser.affiliateInfo?.referralCode || 'Não se aplica'}</dd></div>
          </dl></section>
          <section className="adm-account-section"><div className="adm-account-section-heading"><h3>Carteiras</h3><span>Valores em reais</span></div><div className="adm-account-wallets">
            <div><span><Gamepad2 size={16}/> Saldo de jogo</span><strong>{Number(managedUser.balance || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><button type="button" disabled={accountBusy} onClick={()=>{closeAccount();onOpenBalanceModal(managedUser,'player');}}>Ajustar saldo e limites</button></div>
            {managedUser.affiliateInfo && <div><span><Wallet size={16}/> Saldo de comissões</span><strong>{Number(managedUser.affiliateInfo.affiliateBalance || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><button type="button" disabled={accountBusy} onClick={()=>{closeAccount();onOpenBalanceModal(managedUser,'affiliate');}}>Ajustar comissões</button></div>}
          </div></section>
          </div>
          <div hidden={accountSection!=='access'}>
          <fieldset disabled={accountBusy || Boolean(pendingAccountAction)} className="adm-account-controls"><legend>Permissões e acesso</legend>
            {onToggleAutoWithdraw && <div><div><strong>Saque automático</strong><p>{managedUser.autoWithdrawBlocked?'Aprovação manual selecionada.':'Permitido na conta; depende das regras globais e do gateway.'}</p></div><button type="button" role="switch" aria-checked={!managedUser.autoWithdrawBlocked} aria-label="Saque automático" onClick={()=>setPendingAccountAction({label:managedUser.autoWithdrawBlocked?'Permitir saque automático nesta conta?':'Exigir aprovação manual dos saques?',run:()=>onToggleAutoWithdraw(managedUser)})}>{managedUser.autoWithdrawBlocked?'Desativado':'Permitido'}</button></div>}
            {onToggleWithdraw && <div><div><strong>Permitir solicitações de saque</strong><p>Bloquear solicitações não cancela operações já enviadas.</p></div><button type="button" role="switch" aria-checked={!managedUser.withdrawBlocked} aria-label="Permitir saques" onClick={()=>setPendingAccountAction({label:managedUser.withdrawBlocked?'Liberar saques desta conta?':'Bloquear saques desta conta?',run:()=>onToggleWithdraw(managedUser)})}>{managedUser.withdrawBlocked?'Bloqueados':'Permitidos'}</button></div>}
            {managedUser.role!=='superadmin' && <div><div><strong>Acesso à conta</strong><p>{managedUser.isBlocked?'O acesso está bloqueado.':'A conta está liberada.'}</p></div><button type="button" onClick={()=>setPendingAccountAction({label:managedUser.isBlocked?'Desbloquear esta conta?':'Bloquear esta conta?',run:()=>onToggleBlockUser(managedUser)})}>{managedUser.isBlocked?'Desbloquear':'Bloquear'}</button></div>}
            <div><div><strong>Afiliação</strong><p>{managedUser.affiliateInfo?`Comissão acumulada: ${Number(managedUser.affiliateInfo.commissionTotal || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`:'Conta sem cadastro de afiliado.'}</p></div>{managedUser.affiliateInfo?<button type="button" onClick={()=>{closeAccount();onOpenNetworkModal(managedUser);}}>Ver rede</button>:<button type="button" onClick={()=>setPendingAccountAction({label:'Tornar esta conta afiliada?',run:()=>onQuickToggleAffiliate(managedUser,true)})}>Tornar afiliado</button>}</div>
            {onTogglePartner && <div><div><strong>Acesso de parceiro</strong><p>{managedUser.partnerApproved?'Acesso aprovado.':managedUser.partnerRequested?'Solicitação pendente.':'Sem acesso aprovado.'}</p></div><button type="button" onClick={()=>setPendingAccountAction({label:managedUser.partnerApproved?'Revogar acesso de parceiro?':'Aprovar acesso de parceiro?',run:()=>onTogglePartner(managedUser,!managedUser.partnerApproved)})}>{managedUser.partnerApproved?'Revogar':'Aprovar'}</button></div>}
          </fieldset>
          </div></div>
          {pendingAccountAction && <div className="adm-account-confirm" role="group" aria-label="Confirmar alteração"><span className="adm-account-confirm-icon"><ShieldAlert size={18}/></span><strong>{pendingAccountAction.label}</strong><div><button type="button" disabled={accountBusy} onClick={()=>setPendingAccountAction(null)}>Cancelar</button><button type="button" className="adm-account-primary" disabled={accountBusy} onClick={confirmAccountAction}>{accountBusy?<><span className="adm-account-spinner" aria-hidden="true"/> Salvando…</>:'Confirmar alteração'}</button></div></div>}
          {accountError && <p role="alert">{accountError}</p>}
          <footer className="adm-account-footer"><p className="adm-account-note"><Shield size={14} aria-hidden="true"/> Saques seguem as regras da conta e do gateway.</p><button type="button" disabled={accountBusy} onClick={closeAccount}>Concluir</button></footer>
        </div>}
      </Modal>

      {/* Modal de Exportação de Influenciadoras e Influenciadores Válidos */}
      <AdminExportInfluencersModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        users={users}
        initialMode={exportModalMode}
        onShowToast={(msg, type) => {
          if (onShowToast) {
            onShowToast(msg, type);
          } else if (onCopyText && type === 'success') {
            onCopyText(msg);
          }
        }}
      />
    </div>
  );
};
