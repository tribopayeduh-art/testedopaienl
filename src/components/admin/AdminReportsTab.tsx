import {WorkspaceFinancialChart} from '../WorkspaceFinancialChart';
import {downloadReportCsv} from '../../lib/reportExport';
import {InexLoader} from '../InexLoader';
import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Percent,
  Gamepad2,
  Users,
  Award,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Loader2,
  Server,
  Database,
  Crown
} from 'lucide-react';
import { ReportAnalyticsData } from './adminTypes';
import {
  IOSCard,
  IOSStatCard,
  IOSSegmentedControl,
  IOSBadge,
  IOSButton
} from './IOSComponents';

interface AdminReportsTabProps {
  reportData: ReportAnalyticsData | null;
  loading: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  onExportCsv: (type: string) => void;
  onFetchReports: (period?: string) => Promise<void>;
  onOpenMigrationModal?: () => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  reportData,
  loading,
  selectedPeriod,
  onPeriodChange,
  onExportCsv,
  onFetchReports,
  onOpenMigrationModal
}) => {
  const [subTab, setSubTab] = useState<
    'dre' | 'gaming' | 'affiliates' | 'players' | 'transactions'
  >('dre');

  const periodOptions = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: '7days', label: '7 Dias' },
    { id: '30days', label: '30 Dias' },
    { id: 'this_month', label: 'Este Mês' },
    { id: 'last_month', label: 'Mês Passado' }
  ];

  const subTabOptions = [
    { id: 'dre' as const, label: 'Caixa', icon: FileText },
    { id: 'gaming' as const, label: 'Apostas', icon: Gamepad2 },
    { id: 'affiliates' as const, label: 'Afiliados', icon: Award },
    { id: 'players' as const, label: 'Jogadores', icon: Users },
    { id: 'transactions' as const, label: 'Transações', icon: BarChart3 }
  ];

  const summary = reportData?.periodSummary;
  const [query,setQuery]=useState('');
  const [transactionStatus,setTransactionStatus]=useState('all');
  const [visibleTransactions,setVisibleTransactions]=useState(50);
  const matches=(row:any)=>!query.trim()||Object.values(row).some(v=>String(v??'').toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  const transactions=(reportData?.transactions||[]).filter(matches).filter(t=>transactionStatus==='all'||t.status===transactionStatus);
  const affiliates=(reportData?.affiliateRanking||[]).filter(matches);
  const players=(reportData?.topProfitablePlayers||[]).filter(matches);
  const exportCurrent=()=>{
    if(!reportData)return;
    let headers:string[],rows:unknown[][];
    if(subTab==='affiliates'){headers=['Nome','E-mail','Indicações no período','Primeiros depósitos','Depósitos BRL','Comissões BRL'];rows=affiliates.map(a=>[a.userName,a.userEmail,a.periodReferralsCount,a.ftdCount,a.referralDepositsTotal,a.commissionTotal]);}
    else if(subTab==='players'){headers=['Nome','E-mail','Depósitos BRL','Saques BRL','Apostado BRL','Prêmios BRL','GGR BRL'];rows=players.map(p=>[p.name,p.email,p.totalDeposited,p.totalWithdrawn,p.totalWagered,p.totalPayouts,p.ggrGenerated]);}
    else if(subTab==='transactions'){headers=['ID','Usuário','E-mail','Tipo','Valor BRL','Status','Data'];rows=transactions.map(t=>[t.id,t.userName,t.userEmail,t.type,t.amount,t.status,t.createdAt]);}
    else{headers=['Data','Depósitos BRL','Saques BRL','Fluxo de caixa BRL','Apostado BRL','Prêmios BRL','GGR BRL'];rows=reportData.dailyBreakdown.map(r=>[r.date,r.deposits,r.withdrawals,r.netCashflow,r.wagered,r.payouts,r.ggr]);}
    downloadReportCsv(`relatorio-${subTab}-${selectedPeriod}.csv`,headers,rows);
  };

  return (
    <div className="adm-workspace AdminReportsTab space-y-5">
      {/* Top Filter Bar: Period Selector & CSV Export */}
      <IOSCard className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <IOSSegmentedControl
            options={periodOptions}
            value={selectedPeriod}
            onChange={(val) => {
              onPeriodChange(val);
              onFetchReports(val);
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">


          <IOSButton
            variant="secondary"
            size="sm"
            onClick={exportCurrent}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar esta visão</span>
          </IOSButton>

          <IOSButton
            variant="secondary"
            size="sm"
            onClick={() => onExportCsv('influencers')}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border-amber-500/20 font-bold"
            title="Exportar influenciadores com telefone válido para Excel e WhatsApp"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Exportar Influenciadoras</span>
          </IOSButton>
        </div>
      </IOSCard>

      {onOpenMigrationModal && <details className="adm-disclosure"><summary><span><strong>Cópia dos dados</strong><small>Opções de exportação do banco</small></span></summary><div className="adm-disclosure-body adm-export-row"><p>Gere uma cópia para transferência ou armazenamento privado.</p><IOSButton variant="secondary" onClick={onOpenMigrationModal}><Download size={14}/>Exportar banco</IOSButton></div></details>}

      {reportData&&!loading&&<div className="ws-reports ws-report-summary"><WorkspaceFinancialChart rows={reportData.dailyBreakdown.map(r=>({label:r.displayDate||r.date,deposits:r.deposits,withdrawals:r.withdrawals}))}/><p className="ws-report-note">Período retornado: {new Date(reportData.startTime).toLocaleDateString('pt-BR')} a {new Date(reportData.endTime).toLocaleDateString('pt-BR')}. Fluxo de caixa é a diferença entre entradas e saídas; não substitui a apuração contábil.</p></div>}
      {/* Sub-Navigation */}
      <div className="flex items-center overflow-x-auto pb-1">
        <IOSSegmentedControl
          options={subTabOptions}
          value={subTab}
          onChange={(tab)=>{setSubTab(tab);setQuery('');setTransactionStatus('all');setVisibleTransactions(50);}}
          className="w-full sm:w-auto"
        />
      </div>

      {['affiliates','players','transactions'].includes(subTab)&&<div className="ws-report-search"><input aria-label="Buscar no relatório" placeholder="Buscar por nome, e-mail ou identificação…" value={query} onChange={e=>{setQuery(e.target.value);setVisibleTransactions(50);}}/>{subTab==='transactions'&&<select aria-label="Filtrar status" value={transactionStatus} onChange={e=>{setTransactionStatus(e.target.value);setVisibleTransactions(50);}}><option value="all">Todos os status</option><option value="approved">Aprovados</option><option value="pending">Pendentes</option><option value="rejected">Rejeitados</option></select>}<span className="ws-report-note">{subTab==='affiliates'?affiliates.length:subTab==='players'?players.length:transactions.length} resultado(s) nos dados carregados</span></div>}
      {subTab==='transactions'&&transactions.length>visibleTransactions&&<div className="ws-reports"><button onClick={()=>setVisibleTransactions(n=>n+50)}>Carregar mais transações ({Math.min(visibleTransactions,transactions.length)} de {transactions.length})</button></div>}
      {loading ? (
        <IOSCard className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
          <InexLoader compact />
          <span>Calculando métricas avançadas de BI...</span>
        </IOSCard>
      ) : !reportData ? (
        <IOSCard className="p-12 text-center text-slate-400 text-xs font-semibold">
          Nenhum dado analítico disponível para este período.
        </IOSCard>
      ) : (
        <>
          {/* 1. DRE & CAIXA SUB-TAB */}
          {subTab === 'dre' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <IOSStatCard
                  title="Depósitos Brutos (Entradas)"
                  value={`R$ ${(summary?.grossDeposits || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle={`${summary?.grossDepositsCount || 0} depósitos pagos`}
                  icon={ArrowDownLeft}
                  iconBgColor="bg-[#657466]"
                  isPositive={true}
                />

                <IOSStatCard
                  title="Saques Aprovados (Saídas)"
                  value={`R$ ${(summary?.totalWithdrawals || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle={`${summary?.totalWithdrawalsCount || 0} saques liquidados`}
                  icon={ArrowUpRight}
                  iconBgColor="bg-[#7c7469]"
                />

                <IOSStatCard
                  title="GGR Operacional"
                  value={`R$ ${(summary?.ggr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle={`RTP Real: ${(summary?.realRtpPercent ?? 0).toFixed(1)}%`}
                  icon={TrendingUp}
                  iconBgColor="bg-[#596777]"
                  isPositive={true}
                />

                <IOSStatCard
                  title="Resultado Líquido Caixa"
                  value={`R$ ${(summary?.netCashflow || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle={`Margem: ${(summary?.netOperatingMargin || 0).toFixed(1)}%`}
                  icon={DollarSign}
                  iconBgColor="bg-[#697587]"
                  isPositive={(summary?.netCashflow || 0) >= 0}
                />
              </div>

              {/* DRE Breakdown Table */}
              <IOSCard className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">
                      Resumo operacional de caixa
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Indicadores operacionais do período selecionado
                    </p>
                  </div>
                  <IOSBadge variant="blue">Período Selecionado</IOSBadge>
                </div>

                <div className="divide-y divide-black/[0.04] text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-slate-900">1. RECEITA BRUTA DE DEPÓSITOS (PIX)</span>
                    <span className="font-mono font-bold text-[#657466]">
                      +R$ {(summary?.grossDeposits || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between pl-4">
                    <span className="text-slate-600">(-) Saques Aprovados aos Usuários</span>
                    <span className="font-mono font-semibold text-[#986a70]">
                      -R$ {(summary?.totalWithdrawals || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between bg-black/[0.02] px-2 rounded-lg font-bold">
                    <span className="text-slate-900">(=) SALDO LÍQUIDO DO FLUXO FINANCEIRO</span>
                    <span className="font-mono text-slate-900">
                      R$ {(summary?.netCashflow || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-slate-900">2. RESULTADO DE JOGOS & APOSTAS (GGR)</span>
                    <span className="font-mono font-bold text-[#596777]">
                      +R$ {(summary?.ggr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between pl-4">
                    <span className="text-slate-600">(+) Volume Total Apostado (Handle/Turnover)</span>
                    <span className="font-mono font-medium text-slate-700">
                      R$ {(summary?.wagered || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between pl-4">
                    <span className="text-slate-600">(-) Total de Prêmios Pagos aos Jogadores (Payouts)</span>
                    <span className="font-mono font-medium text-slate-700">
                      -R$ {(summary?.payouts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between pl-4">
                    <span className="text-slate-600">(-) Comissões Pagas sobre Depósitos à Rede de Afiliados</span>
                    <span className="font-mono font-semibold text-[#737080]">
                      -R$ {(summary?.totalAffiliateCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between bg-[#657466]/10 px-3 rounded-xl font-bold text-sm">
                    <span className="text-slate-900">(=) LUCRO LÍQUIDO OPERACIONAL (NGR)</span>
                    <span className="font-mono text-[#59685d]">
                      R$ {(summary?.ngr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </IOSCard>
            </div>
          )}

          {/* 2. GAMING & GGR SUB-TAB */}
          {subTab === 'gaming' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <IOSStatCard
                  title="Volume Apostado (Turnover)"
                  value={`R$ ${(summary?.wagered || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle={`${summary?.totalBetsCount || 0} rodadas disputadas`}
                  icon={Gamepad2}
                  iconBgColor="bg-[#FF2D55]"
                />

                <IOSStatCard
                  title="RTP Efetivo Médio"
                  value={`${(summary?.realRtpPercent ?? 0).toFixed(1)}%`}
                  subtitle={`Target do sistema: ~88%`}
                  icon={Percent}
                  iconBgColor="bg-[#596777]"
                  isPositive={true}
                />

                <IOSStatCard
                  title="Taxa de Vitória do Jogador"
                  value={`${(summary?.winRatePercent || 42.5).toFixed(1)}%`}
                  subtitle={`${summary?.winsCount || 0} vitórias / ${summary?.lossesCount || 0} derrotas`}
                  icon={Award}
                  iconBgColor="bg-[#657466]"
                />
              </div>
            </div>
          )}

          {/* 3. AFFILIATES RANKING SUB-TAB */}
          {subTab === 'affiliates' && (
            <IOSCard className="overflow-hidden">
              <div className="p-4 bg-[#F2F2F7] font-bold text-xs text-slate-700 flex items-center justify-between">
                <span>Ranking de Desempenho dos Melhores Afiliados</span>
                <span className="text-slate-400 font-normal">Ordenado por volume de depósitos</span>
              </div>

              {reportData.affiliateRanking && reportData.affiliateRanking.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-black/[0.04]">
                      <tr>
                        <th className="py-3 px-4">Posição / Afiliado</th>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4 text-center">Indicados</th>
                        <th className="py-3 px-4 text-center">FTDs</th>
                        <th className="py-3 px-4 text-right">Depósitos da Rede</th>
                        <th className="py-3 px-4 text-right">Comissões Geradas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {affiliates.map((aff, idx) => (
                        <tr key={aff.affiliateId || `aff-${idx}`} className="hover:bg-black/[0.015]">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                idx === 0 ? 'bg-[#7c7469] text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900">{aff.userName}</div>
                                <div className="text-[11px] text-slate-400">{aff.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#596777]">
                            {aff.referralCode}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                            {aff.totalReferrals}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#657466]">
                            {aff.ftdCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            R$ {aff.referralDepositsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#737080]">
                            R$ {aff.commissionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum dado de afiliado registrado no período.
                </div>
              )}
            </IOSCard>
          )}

          {/* 4. TOP PLAYERS SUB-TAB */}
          {subTab === 'players' && (
            <IOSCard className="overflow-hidden">
              <div className="p-4 bg-[#F2F2F7] font-bold text-xs text-slate-700">
                Top 20 Jogadores Mais Lucrativos para a Casa
              </div>
              {reportData.topProfitablePlayers && reportData.topProfitablePlayers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-black/[0.04]">
                      <tr>
                        <th className="py-3 px-4">Jogador</th>
                        <th className="py-3 px-4 text-right">Saldo Atual</th>
                        <th className="py-3 px-4 text-right">Depósitos</th>
                        <th className="py-3 px-4 text-right">Saques</th>
                        <th className="py-3 px-4 text-right">Volume Apostado</th>
                        <th className="py-3 px-4 text-right">GGR Gerado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {players.map((p, idx) => (
                        <tr key={p.userId || `p-${idx}`} className="hover:bg-black/[0.015]">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            R$ {p.currentBalance.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#657466]">
                            R$ {p.totalDeposited.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#7c7469]">
                            R$ {p.totalWithdrawn.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                            R$ {p.totalWagered.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#596777]">
                            R$ {p.ggrGenerated.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum jogador registrado no período.
                </div>
              )}
            </IOSCard>
          )}

          {/* 5. TRANSACTIONS EXTRACT SUB-TAB */}
          {subTab === 'transactions' && (
            <IOSCard className="overflow-hidden">
              <div className="p-4 bg-[#F2F2F7] font-bold text-xs text-slate-700">
                Histórico Transacional do Período
              </div>
              {reportData.transactions && reportData.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-black/[0.04]">
                      <tr>
                        <th className="py-3 px-4">Usuário</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {transactions.slice(0, visibleTransactions).map((t) => {
                        const isDep = t.type === 'deposit';
                        return (
                          <tr key={t.id} className="hover:bg-black/[0.015]">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{t.userName}</div>
                              <div className="text-[11px] text-slate-400">{t.userEmail}</div>
                            </td>
                            <td className="py-3 px-4">
                              <IOSBadge variant={isDep ? 'green' : 'orange'}>
                                {isDep ? 'Depósito PIX' : 'Saque PIX'}
                              </IOSBadge>
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${isDep ? 'text-[#657466]' : 'text-[#7c7469]'}`}>
                              {isDep ? '+' : '-'}R$ {t.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <IOSBadge variant={t.status === 'approved' ? 'green' : t.status === 'pending' ? 'orange' : 'red'}>
                                {t.status}
                              </IOSBadge>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {new Date(t.createdAt).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma transação no período.
                </div>
              )}
            </IOSCard>
          )}
        </>
      )}
    </div>
  );
};
