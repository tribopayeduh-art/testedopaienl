import { readApiJson } from '../lib/readApiJson';
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, AffiliateInfo, InfluencerCommissionRequest } from '../types';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Percent,
  Clock,
  Search,
  FileText,
  Calendar,
  ChevronRight,
  BarChart2,
  Coins,
  CheckCircle2,
  X,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';

interface FinanceViewProps {
  user: User;
  transactions: Transaction[];
  onDeposit: () => void;
  onWithdraw: () => void;
  affiliateInfo?: AffiliateInfo | null;
  onRefresh?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type PeriodFilter = 'hoje' | 'ontem' | '7d' | '30d';

export const FinanceView: React.FC<FinanceViewProps> = ({
  user,
  transactions,
  onDeposit,
  onWithdraw,
  affiliateInfo,
  onRefresh,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'commission'>('all');
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chartPeriod, setChartPeriod] = useState<'30d' | '15d' | '7d'>('30d');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 40;

  // Influencer Commission Requests State
  const [influencerRequests, setInfluencerRequests] = useState<InfluencerCommissionRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [showEditAmount, setShowEditAmount] = useState<Record<string, boolean>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const affiliateBalance = Number(affiliateInfo?.affiliateBalance || 0);
  const consolidatedBalance = user.balance + affiliateBalance;
  const commissionTransactions: Transaction[] = (affiliateInfo?.commissions || []).map((commission) => ({
    id: commission.id,
    userId: user.id,
    type: 'commission',
    amount: commission.amount,
    status: 'approved',
    paymentMethod: commission.gameName || 'Afiliados',
    description: `Comissão de ${commission.buyerName}${commission.gameName ? ` • ${commission.gameName}` : ''}`,
    createdAt: commission.createdAt,
  }));
  const allTransactions = useMemo(
    () => [...transactions, ...commissionTransactions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [transactions, commissionTransactions]
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const fetchInfluencerRequests = async () => {
    const token =
      localStorage.getItem('pg_auth_token') ||
      localStorage.getItem('paygateway_token') ||
      localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/affiliates/influencer-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readApiJson(res);
      if (data && data.success && Array.isArray(data.requests)) {
        setInfluencerRequests(data.requests);
      }
    } catch (e) {
      console.error('Error fetching influencer requests in FinanceView', e);
    }
  };

  useEffect(() => {
    fetchInfluencerRequests();
  }, []);

  const handleProcessInfluencerRequest = async (requestId: string, action: 'approve' | 'reject') => {
    const req = influencerRequests.find((r) => r.id === requestId);
    if (!req) return;

    let modifiedAmount: number | undefined = undefined;

    if (action === 'approve') {
      const customValStr = customAmounts[requestId];
      if (customValStr !== undefined && customValStr.trim() !== '') {
        const parsed = parseFloat(customValStr.replace(',', '.'));
        if (isNaN(parsed) || parsed <= 0) {
          onShowToast?.('Informe um valor válido maior que zero para liberação.', 'error');
          return;
        }
        modifiedAmount = parsed;
      } else {
        modifiedAmount = req.amount;
      }

      if (modifiedAmount > affiliateBalance) {
        onShowToast?.(
          `Saldo insuficiente! Seu saldo disponível é de ${formatCurrency(
            affiliateBalance
          )}, insuficiente para liberar ${formatCurrency(modifiedAmount)}.`,
          'error'
        );
        return;
      }
    }

    let rejectReason = '';
    if (action === 'reject') {
      const reason = window.prompt(
        'Informe o motivo da recusa (opcional):',
        'Solicitação recusada pelo afiliado gestor.'
      );
      if (reason === null) return;
      rejectReason = reason;
    }

    setProcessingRequestId(requestId);
    try {
      const token =
        localStorage.getItem('pg_auth_token') ||
        localStorage.getItem('paygateway_token') ||
        localStorage.getItem('token');
      const res = await fetch('/api/affiliates/influencer-request-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          action,
          modifiedAmount,
          rejectReason,
        }),
      });
      const data = await readApiJson(res);
      if (res.ok && data.success) {
        onShowToast?.(
          data.message || (action === 'approve' ? 'Saque liberado com sucesso!' : 'Saque recusado.'),
          'success'
        );
        await fetchInfluencerRequests();
        if (onRefresh) onRefresh();
      } else {
        onShowToast?.(data.error || 'Erro ao processar solicitação.', 'error');
      }
    } catch (err) {
      onShowToast?.('Erro de conexão ao processar solicitação.', 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const periodStart = (() => {
    const now = new Date();
    if (period === 'hoje') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (period === 'ontem')
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    return now.getTime() - (period === '7d' ? 7 : 30) * 86400000;
  })();
  const periodEnd = period === 'ontem' ? periodStart + 86400000 : Number.POSITIVE_INFINITY;

  const periodTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const timestamp = Date.parse(t.createdAt);
      return timestamp >= periodStart && timestamp < periodEnd;
    });
  }, [allTransactions, periodStart, periodEnd]);

  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((t) => {
      if (filter === 'deposit' && t.type !== 'deposit') return false;
      if (filter === 'withdrawal' && t.type !== 'withdrawal') return false;
      if (filter === 'commission' && t.type !== 'commission') return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchId = (t.id || '').toLowerCase().includes(query);
        const matchAmount = (t.amount || 0).toString().includes(query);
        return matchDesc || matchId || matchAmount;
      }
      return true;
    });
  }, [periodTransactions, filter, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, period, searchQuery]);

  // Paginate transactions: 40 items per page
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage, PAGE_SIZE]);

  // Metric sums for the selected period
  const confirmedDepositsList = useMemo(
    () => periodTransactions.filter((tx) => tx.type === 'deposit' && tx.status === 'approved'),
    [periodTransactions]
  );
  const confirmedDepositsSum = useMemo(
    () => confirmedDepositsList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [confirmedDepositsList]
  );

  const paidWithdrawalsList = useMemo(
    () => periodTransactions.filter((tx) => tx.type === 'withdrawal' && tx.status === 'approved'),
    [periodTransactions]
  );
  const paidWithdrawalsSum = useMemo(
    () => paidWithdrawalsList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [paidWithdrawalsList]
  );

  const commissionList = useMemo(
    () => periodTransactions.filter((tx) => tx.type === 'commission'),
    [periodTransactions]
  );
  const commissionsInPeriod = useMemo(
    () => commissionList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [commissionList]
  );

  const pendingList = useMemo(
    () => periodTransactions.filter((tx) => tx.status === 'pending'),
    [periodTransactions]
  );
  const pendingValuesSum = useMemo(
    () => pendingList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [pendingList]
  );

  const pendingInfluencerRequests = influencerRequests.filter((r) => r.status === 'pending');

  // Chart date baseline points (matching screenshot: 1 ago, 5 ago, 9 ago, 13 ago, 17 ago, 21 ago, 25 ago, 29 ago)
  const chartDays = useMemo(() => {
    return ['1 ago', '5 ago', '9 ago', '13 ago', '17 ago', '21 ago', '25 ago', '29 ago'];
  }, []);

  const hasChartMovement = confirmedDepositsSum > 0 || paidWithdrawalsSum > 0;

  const count = period === 'hoje' || period === 'ontem' ? 1 : period === '7d' ? 7 : 30;
  const flow = Array.from({length:count},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(period==='ontem'?1:count-1-i));const rows=periodTransactions.filter(t=>t.status==='approved'&&new Date(t.createdAt).toDateString()===d.toDateString());return{date:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),incoming:rows.filter(t=>t.type==='deposit'||t.type==='commission').reduce((v,t)=>v+Number(t.amount),0),outgoing:rows.filter(t=>t.type==='withdrawal').reduce((v,t)=>v+Number(t.amount),0)}});
  const flowMax=Math.max(1,...flow.flatMap(d=>[d.incoming,d.outgoing]));
  return <div className="clean-section finance-clean"><header className="clean-heading"><div><span>SEU DINHEIRO</span><h1>Financeiro<span>.</span></h1><p>Clareza em cada movimentação.</p></div><button className="clean-quiet" onClick={()=>onRefresh?.()}>Atualizar <ArrowDown size={14}/></button></header>
  <div className="finance-wallet-row"><section className="clean-wallet"><span>Saldo disponível</span><strong>{formatCurrency(consolidatedBalance)}</strong><div className="clean-wallet-breakdown"><span>Carteira <b>{formatCurrency(user.balance)}</b></span><span>Comissões <b>{formatCurrency(affiliateBalance)}</b></span></div><div className="clean-wallet-buttons"><button className="ios-primary" onClick={onDeposit}><ArrowDownRight size={16}/>Adicionar</button><button onClick={onWithdraw}><ArrowUpRight size={16}/>Retirar</button></div></section><section className="clean-finance-summary"><div className="clean-summary-head"><h2>Visão do período</h2><select aria-label="Período financeiro" value={period} onChange={e=>setPeriod(e.target.value as PeriodFilter)}><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option></select></div><div className="finance-metric-grid">{[{label:'Depósitos',value:confirmedDepositsSum,icon:<ArrowDownRight size={17}/>},{label:'Retiradas',value:paidWithdrawalsSum,icon:<ArrowUpRight size={17}/>},{label:'Comissões',value:commissionsInPeriod,icon:<Coins size={17}/>},{label:'Pendências',value:pendingValuesSum,icon:<Clock size={17}/>}].map(m=><div key={m.label}><i>{m.icon}</i><span>{m.label}</span><strong>{formatCurrency(m.value)}</strong></div>)}</div></section></div>
        {/* Influencer Commission Withdrawal Requests Panel (if any) */}
      {pendingInfluencerRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>Aprovação de Saque de Comissões dos Influenciadores</span>
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {pendingInfluencerRequests.length} pendente{pendingInfluencerRequests.length > 1 ? 's' : ''}
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-600">
                  Influenciadores sob sua gestão solicitaram resgate de comissões. Você pode aprovar, trocar o valor a liberar ou recusar.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-zinc-500 block">Seu Saldo Disponível de Comissões</span>
              <span className="text-xs font-black text-emerald-700 font-mono">
                {formatCurrency(affiliateBalance)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {pendingInfluencerRequests.map((req) => {
              const customValStr = customAmounts[req.id];
              const isCustomSet = customValStr !== undefined && customValStr.trim() !== '';
              const customNum = isCustomSet ? parseFloat(customValStr.replace(',', '.')) : req.amount;
              const effectiveReleaseAmount = !isNaN(customNum) && customNum > 0 ? customNum : req.amount;
              const isExceeded = effectiveReleaseAmount > affiliateBalance;
              const isEditing = showEditAmount[req.id] ?? false;

              return (
                <div
                  key={req.id}
                  className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">{req.influencerName}</span>
                        <span className="text-[9px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-mono">
                          {req.influencerEmail}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        Chave PIX: <strong className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">{req.pixKey}</strong> ({req.pixKeyType || 'PIX'})
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-500 block font-semibold">Valor Solicitado</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCurrency(req.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditAmount((prev) => ({ ...prev, [req.id]: true }));
                          if (!customAmounts[req.id]) {
                            setCustomAmounts((prev) => ({ ...prev, [req.id]: req.amount.toFixed(2) }));
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-200/60"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Trocar o valor que vai liberar para o influenciador</span>
                      </button>
                    ) : (
                      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            Ajustar valor a liberar (R$):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditAmount((prev) => ({ ...prev, [req.id]: false }));
                              setCustomAmounts((prev) => {
                                const copy = { ...prev };
                                delete copy[req.id];
                                return copy;
                              });
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                          >
                            Restaurar valor original
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={affiliateBalance}
                            value={customAmounts[req.id] ?? req.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomAmounts((prev) => ({ ...prev, [req.id]: val }));
                            }}
                            placeholder="0.00"
                            className="w-36 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isExceeded && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <strong className="block font-bold">Saldo Insuficiente!</strong>
                        Seu saldo disponível de comissões é de <strong>{formatCurrency(affiliateBalance)}</strong>, insuficiente para liberar <strong>{formatCurrency(effectiveReleaseAmount)}</strong>.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <span className="text-[10px] text-zinc-500">
                      Valor a debitar: <strong className={isExceeded ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(effectiveReleaseAmount)}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingRequestId === req.id || isExceeded}
                        onClick={() => handleProcessInfluencerRequest(req.id, 'approve')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                          isExceeded
                            ? 'bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isExceeded ? 'Saldo Insuficiente' : `Aprovar (${formatCurrency(effectiveReleaseAmount)})`}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingRequestId === req.id}
                        onClick={() => handleProcessInfluencerRequest(req.id, 'reject')}
                        className="px-3 py-2 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 border border-zinc-200 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


  <div className="finance-detail-grid"><section className="clean-statement"><div className="clean-summary-head"><h2>Seu extrato</h2><span>{filteredTransactions.length} registros</span></div><label className="clean-search"><Search size={16}/><input type="search" aria-label="Buscar no extrato" placeholder="Buscar descrição, valor ou código" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>{searchQuery&&<button aria-label="Limpar busca" onClick={()=>setSearchQuery('')}><X size={14}/></button>}</label><div className="clean-tabs" aria-label="Tipo de movimentação">{([{id:'all',label:'Tudo'},{id:'deposit',label:'Depósitos'},{id:'withdrawal',label:'Retiradas'},{id:'commission',label:'Comissões'}] as const).map(t=><button key={t.id} aria-pressed={filter===t.id} className={filter===t.id?'active':''} onClick={()=>setFilter(t.id)}>{t.label}</button>)}</div><div className="clean-transaction-list">{paginatedTransactions.length?paginatedTransactions.map(t=><TransactionItem key={t.id} transaction={t}/>):<div className="clean-empty"><FileText size={27}/><h3>Nada por aqui ainda</h3><p>Nenhuma movimentação para os filtros selecionados.</p>{searchQuery&&<button onClick={()=>setSearchQuery('')}>Limpar busca</button>}</div>}</div>{filteredTransactions.length>PAGE_SIZE&&<Pagination currentPage={currentPage} totalItems={filteredTransactions.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} itemLabel="movimentações"/>}</section><aside className="clean-flow"><div className="clean-summary-head"><h2>Entradas e saídas</h2><BarChart2 size={17}/></div><p>Movimentações confirmadas no período</p><div className="clean-flow-chart" role="img" aria-label="Gráfico de entradas e saídas do período">{flow.map(d=><div key={d.date} title={`${d.date}: entradas ${formatCurrency(d.incoming)}, saídas ${formatCurrency(d.outgoing)}`}><i style={{height:`${d.incoming/flowMax*100}%`}}/><i style={{height:`${d.outgoing/flowMax*100}%`}}/></div>)}</div><div className="clean-chart-dates"><span>{flow[0].date}</span><span>{flow[flow.length-1].date}</span></div><div className="clean-flow-legend"><span>● Entradas</span><span>● Saídas</span></div><div className="clean-flow-note"><CheckCircle2 size={16}/><p>O resumo considera apenas valores confirmados. Pendências ficam separadas.</p></div></aside></div></div>;
};
