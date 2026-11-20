import React from 'react';
interface Row{label:string;deposits:number;withdrawals:number}
export const WorkspaceFinancialChart:React.FC<{rows:Row[];title?:string}>=({rows,title='Evolução financeira'})=>{
 const safe=rows.map(r=>({...r,deposits:Number.isFinite(r.deposits)?r.deposits:0,withdrawals:Number.isFinite(r.withdrawals)?r.withdrawals:0}));
 const max=Math.max(1,...safe.flatMap(r=>[r.deposits,r.withdrawals]));
 const x=(i:number)=>safe.length===1?390:48+i*704/Math.max(1,safe.length-1),y=(n:number)=>170-n/max*140;
 const path=(key:'deposits'|'withdrawals')=>safe.map((r,i)=>`${i?'L':'M'}${x(i)},${y(r[key])}`).join(' ');
 const amount=(n:number)=>new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(n);
 return <div className="ws-report-card"><div className="ws-chart-head"><div><h3>{title}</h3><p>Valores em reais · dados disponíveis no período</p></div><div className="ws-chart-legend"><span><i/>Depósitos</span><span><i/>Saques</span></div></div>{safe.length?<svg className="ws-report-chart" viewBox="0 0 800 215" role="img" aria-label={`${title}. Depósitos e saques de ${safe.length} dias.`}>{[0,.5,1].map(v=><g key={v}><line x1="48" x2="752" y1={y(max*v)} y2={y(max*v)} stroke="#edf0f4"/><text x="3" y={y(max*v)+4}>{amount(max*v)}</text></g>)}<path d={path('deposits')} fill="none" stroke="#536172" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d={path('withdrawals')} fill="none" stroke="#b0bac7" strokeWidth="2" strokeDasharray="5 4"/>{safe.map((r,i)=><g key={i}><circle cx={x(i)} cy={y(r.deposits)} r="3" fill="#536172"><title>{r.label}: depósitos R$ {r.deposits.toFixed(2)}, saques R$ {r.withdrawals.toFixed(2)}</title></circle>{(i===0||i===safe.length-1||i===Math.floor(safe.length/2))&&<text x={x(i)} y="204" textAnchor="middle">{r.label}</text>}</g>)}</svg>:<div className="ws-report-empty">Ainda não há movimentações nesse período.</div>}</div>;
};
