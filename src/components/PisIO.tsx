import { readApiJson } from '../lib/readApiJson';
import {InexLoader} from './InexLoader';
import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Copy,Check,ArrowDownLeft,Send,ShieldCheck,UserRound} from 'lucide-react';
import {Modal} from './Modal';
async function api(path:string,options:RequestInit={}){const token=localStorage.getItem('paygateway_token')||localStorage.getItem('pg_auth_token')||localStorage.getItem('token');const res=await fetch('/api/pis-io'+path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} :{}),...options.headers}});const result=await readApiJson(res);if(!res.ok)throw new Error(result.error||'Não foi possível carregar o PIS IO.');return result;}
export function PisIO(){
 const [account,setAccount]=useState<any>(null),[history,setHistory]=useState<any[]>([]),[error,setError]=useState(''),[open,setOpen]=useState(false),[code,setCode]=useState(''),[amount,setAmount]=useState(''),[recipient,setRecipient]=useState<any>(null),[busy,setBusy]=useState(false),[success,setSuccess]=useState<any>(null),[copied,setCopied]=useState(false),[loading,setLoading]=useState(true);
 const [lookingUp,setLookingUp]=useState(false);
 const validAmount=/^\d{1,9}([.,]\d{1,2})?$/.test(amount)&&Number(amount.replace(',','.'))>0;
 const requestKey=useRef('');const submitting=useRef(false);
 async function refresh(){setLoading(true);try{const me=await api('/me');setAccount(me);const h=await api('/history');setHistory(h.items);setError('');}catch(e:any){setError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{void refresh();const onFocus=()=>void refresh();window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus)},[]);
 const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 useEffect(()=>{
  setRecipient(null);
  setError('');
  setLookingUp(false);
  if(!open||success||code.length!==6)return;
  const controller=new AbortController();
  let active=true;
  setLookingUp(true);
  const timer=window.setTimeout(async()=>{
   try{
    const result=await api('/recipient/'+code,{signal:controller.signal});
    if(active){setRecipient(result);requestKey.current=crypto.randomUUID();}
   }catch(e:any){if(active&&!controller.signal.aborted)setError(e.message);}
   finally{if(active)setLookingUp(false);}
  },350);
  return()=>{active=false;window.clearTimeout(timer);controller.abort();};
 },[open,code,success]);
 async function transfer(){if(submitting.current||!recipient||recipient.code!==code||lookingUp||!validAmount)return;submitting.current=true;setBusy(true);setError('');try{const r=await api('/transfers',{method:'POST',headers:{'Idempotency-Key':requestKey.current},body:JSON.stringify({code:recipient.code,amount:amount.replace(',','.')})});setSuccess(r);setRecipient(null);void refresh();window.dispatchEvent(new Event('pis-io-transferred'));}catch(e:any){setError(e.message)}finally{setBusy(false);submitting.current=false}}
 function start(){setOpen(true);setRecipient(null);setSuccess(null);setCode('');setAmount('');setError('')}
 return <section className="ios-pis"><div className="ios-section-title"><h2>PIS IO <span>Entre afiliados</span></h2><Send size={18}/></div><div className="pis-identity"><span>Seu PIS IO<strong>{account?.code||'— — — — — —'}</strong></span><button disabled={!account} aria-label="Copiar meu PIS IO" onClick={async()=>{try{await navigator.clipboard.writeText(account.code);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{setError('Não foi possível copiar. Selecione seu código.')}}}>{copied?<Check size={18}/>:<Copy size={18}/>}</button></div><div className="pis-available"><span>Disponível para enviar</span><strong>{account?money(account.balance):'—'}</strong></div><button className="ios-primary pis-send" disabled={!account||loading} onClick={start}><ArrowUpRight size={17}/>Enviar para um afiliado</button>{!open&&error&&<div className="pis-error" role="alert">{error}<button onClick={refresh}>Tentar novamente</button></div>}{loading&&!account&&<p className="pis-hint">Carregando seu identificador…</p>}<p className="pis-hint">Seu código identifica a conta. Nunca é usado como senha.</p>{history.length>0&&<div className="pis-history"><h3>Transferências PIS IO</h3>{history.slice(0,5).map(t=><div key={t.id}><i>{t.direction==='sent'?<ArrowUpRight size={16}/>:<ArrowDownLeft size={16}/>}</i><span><strong>{t.name}</strong><small>{t.code} · {new Date(t.createdAt).toLocaleDateString('pt-BR')}</small></span><b>{t.direction==='sent'?'−':'+'}{money(t.amount)}</b></div>)}</div>}
 <Modal isOpen={open} onClose={()=>!busy&&setOpen(false)} title={success?'Transferência concluída':'Enviar com PIS IO'}>
  <div className="pis-form pis-transfer-sheet">
   {success?<div className="pis-success"><span className="pis-success-mark"><Check size={30}/></span><span className="pis-eyebrow">Tudo certo</span><h3>{money(success.amount)}</h3><p>Enviados para <strong>{success.recipientName}</strong></p><div className="pis-receipt"><span>PIS IO<strong>{success.recipientCode}</strong></span><span>Comprovante<small>{success.id}</small></span></div><button className="ios-primary" onClick={()=>setOpen(false)}>Concluir</button></div>:<>
    <div className="pis-transfer-intro"><span className="pis-transfer-icon"><ArrowUpRight size={22}/></span><div><h4>Uma transferência. Sem complicação.</h4><p>Envie suas comissões para outro afiliado iNEX.</p></div></div>
    <div className="pis-transfer-balance"><span>Seu saldo disponível</span><strong>{account?money(account.balance):'—'}</strong></div>
    <label htmlFor="pis-recipient-code" className="pis-code-label"><span>PIS IO do destinatário <small>6 dígitos</small></span><input id="pis-recipient-code" className="pis-code-input" inputMode="numeric" autoComplete="off" maxLength={6} value={code} disabled={busy} onChange={e=>{setCode(e.target.value.replace(/\D/g,''));setRecipient(null);setError('')}} placeholder="000000" aria-describedby="pis-recipient-status"/></label>
    <div id="pis-recipient-status" className={`pis-recipient-preview ${recipient&&recipient.code===code?'is-found':''}`} role="status" aria-live="polite"><span className="pis-recipient-avatar">{recipient&&recipient.code===code?<Check size={20}/>:<UserRound size={20}/>}</span><div><span>{lookingUp?'Buscando destinatário…':recipient&&recipient.code===code?'Quem vai receber':'Encontre seu destinatário'}</span><strong>{recipient&&recipient.code===code?recipient.name:lookingUp?'Só um instante':'Digite o PIS IO acima'}</strong></div>{recipient&&recipient.code===code&&<ShieldCheck size={19} className="pis-recipient-verified"/>}</div>
    <label htmlFor="pis-transfer-amount" className="pis-amount-label"><span>Quanto deseja enviar?</span><div className="pis-amount-input"><span aria-hidden="true">R$</span><input id="pis-transfer-amount" aria-label="Valor da transferência em reais" inputMode="decimal" value={amount} disabled={busy} onChange={e=>{setAmount(e.target.value);requestKey.current=crypto.randomUUID()}} placeholder="0,00"/></div></label>
    {validAmount&&account&&Number(amount.replace(',','.'))>account.balance&&<p className="pis-error" role="alert">O valor ultrapassa seu saldo disponível.</p>}
    <div className="pis-transfer-footer"><p><ShieldCheck size={15}/>Confira o nome e o valor antes de enviar.</p><button className="ios-primary" disabled={busy||lookingUp||!recipient||recipient.code!==code||!validAmount||!account||Number(amount.replace(',','.'))>account.balance} onClick={transfer}>{busy?<><InexLoader compact />Enviando…</>:<>Confirmar envio <ArrowUpRight size={18}/></>}</button><span>Transferência entre contas de afiliados</span></div>
   </>}
   {error&&<p role="alert" className="pis-error">{error}</p>}
  </div>
 </Modal></section>
}
