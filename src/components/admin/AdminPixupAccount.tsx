import { readApiJson } from '../../lib/readApiJson';
import React, {useEffect, useState} from 'react';

const sections = {balance:'Saldos',transactions:'Transações',profile:'Perfil',limits:'Limites',fees:'Taxas'};
type Section = keyof typeof sections;
const labels: Record<string,string> = {currency:'Moeda',available:'Disponível',blocked:'Bloqueado',pending:'Pendente',total:'Total',wallet_total_brl:'Total da carteira (BRL)',wallet_total_usd:'Total da carteira (USD)',transaction_id:'Transação',external_id:'Referência',source:'Origem',status:'Status',amount:'Valor',fee_amount:'Taxa',created_at:'Criado em',username:'Conta',kyc_level:'Nível KYC',kyc_status:'Status KYC',operation:'Operação',daily_limit:'Limite diário',daily_used:'Usado hoje',daily_remaining:'Disponível hoje',monthly_limit:'Limite mensal',monthly_used:'Usado no mês',per_operation_min:'Mínimo',per_operation_max:'Máximo',type:'Tipo',value:'Valor',min:'Mínimo',max:'Máximo',spread_percent:'Spread (%)',fee_percent:'Taxa (%)',total_transactions:'Total de transações',total_in:'Entradas',total_out:'Saídas',total_fees:'Total de taxas'};
const label = (s:string) => labels[s] || ({cashin:'Depósito',cashout:'Saque',internal_transfer:'Transferência interna'} as Record<string,string>)[s] || s;
const values = (row: Record<string, unknown>) => <dl className="grid gap-2 sm:grid-cols-3">{Object.entries(row).map(([key,val])=><div key={key}><dt className="text-slate-500 text-xs">{label(key)}</dt><dd className="text-sm font-medium break-all">{String(val)}</dd></div>)}</dl>;

export function AdminPixupAccount({token}: {token:string}) {
  const [section,setSection]=useState<Section>('balance');
  const [page,setPage]=useState(1);
  const [refresh,setRefresh]=useState(0);
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const c=new AbortController();
    setData(null);setError('');
    fetch(`/api/admin/pixup/account/${section}?page=${page}`,{headers:{Authorization:`Bearer ${token}`},signal:c.signal})
      .then(async r=>{const d=await readApiJson(r);if(!r.ok)throw new Error(d.error || 'Consulta indisponível.');if(!c.signal.aborted)setData(d);})
      .catch(e=>{if(!c.signal.aborted)setError(e.message || 'Consulta indisponível.');});
    return ()=>c.abort();
  },[token,section,page,refresh]);
  const table = (rows: any[]) => {
    const keys = [...new Set(rows.flatMap(r=>Object.keys(r)))];
    return keys.length ? <div className="overflow-x-auto"><table><thead><tr>{keys.map(k=><th className="p-2 text-left whitespace-nowrap" key={k}>{label(k)}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{keys.map(k=><td className="p-2 whitespace-nowrap" key={k}>{row[k] ?? '—'}</td>)}</tr>)}</tbody></table></div> : <p>Sem registros para exibir.</p>;
  };
  return <section className="adm-surface p-5 mb-4 space-y-4 text-sm" aria-label="Conta Pixup">
    <div className="flex justify-between items-center gap-3"><h2 className="text-lg font-semibold">Conta Pixup</h2><button type="button" className="adm-text-button" onClick={()=>setRefresh(n=>n+1)}>Atualizar</button></div>
    <div className="flex gap-2 flex-wrap">{(Object.keys(sections) as Section[]).map(s=><button type="button" key={s} aria-pressed={s===section} className={`rounded-lg border px-3 py-2 ${s===section?'bg-slate-900 text-white':''}`} onClick={()=>{setSection(s);setPage(1);}}>{sections[s]}</button>)}</div>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Consultando o Pixup…</p> :
      section==='balance' ? <>{values(Object.fromEntries(Object.entries(data).filter(([k])=>k!=='balances')))}{table(data.balances || [])}</> :
      section==='profile' ? values(data) :
      section==='limits' ? table(data.limits || []) :
      section==='fees' ? <>{table(Object.entries(data.fees ?? {}).flatMap(([currency,ops])=>Object.entries(ops as object).map(([operation,row])=>({currency,operation:label(operation),...row}))))}{values(data.conversion || {})}</> :
      <>{values(data.summary || {})}{table(data.items || [])}<div className="flex gap-3 items-center"><button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page}</span><button type="button" disabled={data.pagination?.has_next!==true} onClick={()=>setPage(p=>p+1)}>Próxima</button></div></>}
  </section>;
}
