import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminMetricsTab } from '../src/components/admin/AdminMetricsTab';
test('unavailable dashboard renders an empty state without fabricated financial data',()=>{
 const markup=renderToStaticMarkup(React.createElement(AdminMetricsTab,{metrics:null,loading:false,onNavigateTab:()=>{}}));
 assert.match(markup,/Dados indisponíveis/);
 assert.match(markup,/Sem movimentações disponíveis/);
 assert.match(markup,/Detalhamento financeiro/);
 assert.equal((markup.match(/class="adm-kpi"/g)||[]).length,4);
 assert.ok(!markup.includes('R$'));
});
test('loaded dashboard renders pending requests and chart from the supplied metrics',()=>{
 const metrics={totalUsers:3,totalBalance:120,totalDepositsAmount:400,totalDepositsCount:2,approvedWithdrawalsAmount:40,pendingWithdrawalsCount:1,pendingWithdrawalsAmount:15,activeGamesCount:2,totalGamesCount:5,chartData:[{date:'18/10',deposits:400,withdrawals:40,netBalance:360}]} as any;
 const markup=renderToStaticMarkup(React.createElement(AdminMetricsTab,{metrics,loading:false,onNavigateTab:()=>{}}));
 assert.match(markup,/400,00/);assert.match(markup,/1 solicitação/);assert.match(markup,/2 de 5 jogos ativos/);assert.match(markup,/<svg class="adm-chart-svg"/);
 assert.ok(!markup.includes('NaN'));assert.ok(!markup.includes('Infinity'));
});
