import type { AdminMetrics } from './adminTypes';
export const money = (n?: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number.isFinite(n) ? n! : 0);
export function getMetricSeries(metrics: AdminMetrics | null, period: 'today'|'7d'|'30d') {
  if (period === 'today') return metrics?.chartSeries?.today ?? [];
  if (period === '30d') return metrics?.chartSeries?.thirtyDays ?? [];
  return metrics?.chartSeries?.sevenDays ?? metrics?.chartData ?? [];
}
export { chartGeometry } from '../../lib/financialChart';
