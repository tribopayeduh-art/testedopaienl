import React, { useState } from 'react';
import { ArrowUpRight, ChevronRight, ArrowDownLeft, Users, Wallet, Clock, Gamepad2 } from 'lucide-react';
import type { AdminMetrics, AdminTabId } from './adminTypes';
import { chartGeometry, money, getMetricSeries } from './dashboardData';

interface Props { metrics: AdminMetrics | null; loading: boolean; onNavigateTab: (tab: AdminTabId) => void; token?: string | null }
export const AdminMetricsTab: React.FC<Props> = ({ metrics, loading, onNavigateTab }) => {
  const [period, setPeriod] = useState<'today'|'7d'|'30d'>('7d');
  const [point, setPoint] = useState<number | null>(null);
  const [series, setSeries] = useState<'deposits'|'withdrawals'|'netBalance'>('deposits');
  const rows = getMetricSeries(metrics, period);
  const chart = chartGeometry(rows.map(row => row[series]));
  const selected = point !== null ? rows[point] : undefined;
  const total = rows.reduce((sum, row) => sum + (Number(row[series]) || 0), 0);
  const available = Boolean(metrics);
  const value = (n?: number) => available ? money(n) : '—';
  const stats = [
    {label:'Depósitos recebidos',value:value(metrics?.totalDepositsAmount),note:available ? `${metrics?.totalDepositsCount ?? 0} depósitos concluídos` : 'Aguardando dados',icon:ArrowDownLeft,tab:'deposits'},
    {label:'Saques aprovados',value:value(metrics?.approvedWithdrawalsAmount),note:'Total acumulado',icon:ArrowUpRight,tab:'withdrawals'},
    {label:'Saldo dos jogadores',value:value(metrics?.totalBalance),note:'Disponível nas carteiras',icon:Wallet,tab:'users'},
    {label:'Usuários cadastrados',value:available ? (metrics?.totalUsers ?? 0).toLocaleString('pt-BR') : '—',note:available ? `${metrics?.newUsersToday ?? 0} novos hoje` : 'Aguardando dados',icon:Users,tab:'users'},
  ] as const;
  const activities = metrics?.recentActivities ?? [];
  return <div className="adm-dashboard" aria-busy={loading}>
    <div className="adm-section-intro"><div><span className="adm-eyebrow">Seu negócio em perspectiva</span><h2>Resumo da operação</h2></div><span className="adm-data-label">{loading ? 'Atualizando dados…' : available ? 'Dados da plataforma' : 'Dados indisponíveis'}</span></div>
    <section className="adm-kpis" aria-label="Indicadores acumulados">{stats.map(stat => <button key={stat.label} className="adm-kpi" onClick={() => onNavigateTab(stat.tab)}><div><span>{stat.label}</span><stat.icon size={16}/></div><strong>{stat.value}</strong><small>{stat.note}<ChevronRight size={13}/></small></button>)}</section>
    <div className="adm-overview-grid">
      <section className="adm-surface adm-chart"><header className="adm-section-header"><div><h3>Movimentação financeira</h3><p>Entradas e saídas por período</p></div><div className="adm-segments" aria-label="Período">{([['today','Hoje'],['7d','7 dias'],['30d','30 dias']] as const).map(([id,label])=><button key={id} aria-pressed={period===id} onClick={()=>{setPeriod(id);setPoint(null);}}>{label}</button>)}</div></header>
        <div className="adm-chart-summary"><div><span>{selected ? (selected.label || selected.date) : 'Total no período'}</span><strong>{available && rows.length ? money(selected ? selected[series] : total) : '—'}</strong></div><label className="adm-chart-select"><span className="sr-only">Indicador do gráfico</span><select value={series} onChange={event=>{setSeries(event.target.value as typeof series);setPoint(null);}}><option value="deposits">Depósitos</option><option value="withdrawals">Saques</option><option value="netBalance">Saldo líquido</option></select></label></div>
        {rows.length ? <><svg className="adm-chart-svg" viewBox="0 0 640 220" role="img" aria-label={`Gráfico de ${series==='deposits'?'depósitos':series==='withdrawals'?'saques':'saldo líquido'}`}>
          {[0,1,2,3].map(i=><g key={i}><line x1="62" x2="620" y1={20+i*57} y2={20+i*57} stroke="#ebedef" strokeDasharray="3 5"/><text x="0" y={24+i*57} fill="#737982" fontSize="10">{new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(chart.max-(chart.max-chart.min)*i/3)}</text></g>)}
          <path d={chart.area} fill="#f1f3f5"/><path d={chart.path} stroke="#343940" fill="none" strokeWidth="2.5" strokeLinejoin="round"/>
          {chart.points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={point===i ? 5 : 3} fill="#343940"/>)}
        </svg><div className="adm-chart-axis"><span>{rows[0].label || rows[0].date}</span><span>{rows[rows.length-1].label || rows[rows.length-1].date}</span></div>
        <label className="adm-chart-scrubber">Explorar período<input aria-label="Selecionar ponto do gráfico" type="range" min="0" max={Math.max(0,rows.length-1)} value={point ?? rows.length-1} onChange={event=>setPoint(Number(event.target.value))}/><button onClick={()=>setPoint(null)}>Ver total</button></label></> : <div className="adm-empty">{loading ? 'Carregando movimentações…' : 'Sem movimentações disponíveis neste período.'}</div>}
      </section>
      <aside className="adm-surface adm-attention"><span className="adm-eyebrow">Próximas ações</span><h3>Central da operação</h3><button onClick={()=>onNavigateTab('withdrawals')}><span className="adm-action-icon"><Clock size={17}/></span><span><strong>Saques pendentes</strong><small>{available ? `${metrics?.pendingWithdrawalsCount ?? 0} ${(metrics?.pendingWithdrawalsCount ?? 0) === 1 ? 'solicitação' : 'solicitações'} · ${money(metrics?.pendingWithdrawalsAmount)}` : 'Aguardando dados'}</small></span><ChevronRight size={16}/></button><button onClick={()=>onNavigateTab('live')}><span className="adm-action-icon"><Users size={17}/></span><span><strong>Jogadores ao vivo</strong><small>Acompanhar sessões ativas</small></span><ChevronRight size={16}/></button><button onClick={()=>onNavigateTab('games')}><span className="adm-action-icon"><Gamepad2 size={17}/></span><span><strong>Catálogo de jogos</strong><small>{available ? `${metrics?.activeGamesCount ?? 0} de ${metrics?.totalGamesCount ?? 0} jogos ativos` : 'Aguardando dados'}</small></span><ChevronRight size={16}/></button><button className="adm-report-link" onClick={()=>onNavigateTab('reports')}>Abrir relatórios <ArrowUpRight size={15}/></button></aside>
    </div>
    <details className="adm-surface adm-financial-details"><summary><span><strong>Detalhamento financeiro</strong><small>Resultado, comissões e saldos acumulados</small></span><ChevronRight size={17}/></summary><dl>{[
      ['Resultado líquido informado',metrics?.netProfit],['GGR dos jogos',metrics?.gameGgr],['Saldo de afiliados',metrics?.totalAffiliateBalance],['Comissões pagas',metrics?.totalAffiliateCommissionsPaid],['Total apostado',metrics?.totalWagered],['Prêmios pagos',metrics?.totalPayout],['Passivos totais',metrics?.totalLiabilities],['Vendas de hoje',metrics?.todaySalesAmount]
    ].map(([label,n])=><div key={String(label)}><dt>{label}</dt><dd>{available && typeof n === 'number' ? money(n) : '—'}</dd></div>)}</dl><p>Valores acumulados retornados pela plataforma. Consulte os relatórios para analisar o resultado.</p></details>
    <section className="adm-surface adm-activity"><header className="adm-section-header"><div><h3>Atividade recente</h3><p>Últimos eventos da plataforma</p></div><button className="adm-text-button" onClick={()=>onNavigateTab('security')}>Ver registros <ChevronRight size={14}/></button></header>{activities.length ? <ul>{activities.slice(0,6).map(item=><li key={item.id}><span className="adm-activity-icon">{item.type==='deposit'?<ArrowDownLeft size={16}/>:item.type==='withdrawal'?<ArrowUpRight size={16}/>:<Users size={16}/>}</span><div><strong>{item.title}</strong><small>{item.userName} · {item.timeAgo}</small></div>{typeof item.amount==='number'&&<b>{money(item.amount)}</b>}</li>)}</ul> : <div className="adm-empty">{loading ? 'Carregando atividades…' : 'Nenhuma atividade disponível.'}</div>}</section>
  </div>;
};
