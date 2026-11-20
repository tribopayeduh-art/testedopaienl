import crypto from 'node:crypto';
import type {SupabaseStore} from '../supabaseStore.ts';
import {DotfyError,paidCharge} from './client.ts';
export type DotfyEvent={event:string;timestamp:string;data:Record<string,any>};
export function parseDotfyEvent(payload:any,headerEvent:string){
 if(!payload||typeof payload.event!=='string'||payload.event!==headerEvent||!Number.isFinite(Date.parse(payload.timestamp))||!payload.data||Array.isArray(payload.data)||typeof payload.data!=='object')throw new DotfyError('Evento Dotfy inválido.',400,'INVALID_WEBHOOK');
 return payload as DotfyEvent;
}
export class DotfyWebhookQueue{
 private busy=false;private timer:ReturnType<typeof setInterval>|undefined;
 constructor(private store:SupabaseStore,private process:(event:DotfyEvent)=>Promise<void|string>){}
 async enqueue(id:string,event:DotfyEvent){
  if(!id||id.length>300)throw new DotfyError('Identificador do evento inválido.',400,'INVALID_WEBHOOK_ID');
  const key=crypto.createHash('sha256').update(id).digest('hex'),ref=this.store.collection('dotfy_webhook_events').doc(key);
  const digest=crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
  await this.store.runTransaction(async tx=>{const old=await tx.get(ref);if(old.exists){if(old.data().digest!==digest)throw new DotfyError('Evento repetido com conteúdo diferente.',409,'WEBHOOK_CONFLICT');return;}tx.create(ref,{id:key,eventId:id,digest,event,state:'pending',attempts:0,createdAt:new Date().toISOString(),nextAttemptAt:0});});
  return key;
 }
 start(){if(this.timer)return;this.timer=setInterval(()=>void this.drain(),10000);this.timer.unref();void this.drain();}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
 async drain(){if(this.busy)return;this.busy=true;try{
  const pending=await this.store.collection('dotfy_webhook_events').where('state','==','pending').limit(100).get();
  for(const snapshot of pending.docs){
   const ref=snapshot.ref;const lease=crypto.randomUUID();
   const job=await this.store.runTransaction(async tx=>{const s=await tx.get(ref),v=s.data(),now=Date.now();if(!v||v.state!=='pending'||Number(v.nextAttemptAt)>now||Number(v.leaseUntil)>now)return null;tx.update(ref,{lease,leaseUntil:now+60000,attempts:Number(v.attempts)+1});return v;});
   if(!job)continue;
   let failure:string|undefined;let outcome='done';
   try{if(await this.process(job.event)==='audit_only')outcome='recorded';}catch(e:any){failure=typeof e?.code==='string'?e.code:'RECONCILIATION_PENDING';}
   await this.store.runTransaction(async tx=>{const s=await tx.get(ref),v=s.data();if(v?.lease!==lease)return;const attempts=Number(v.attempts);tx.update(ref,failure?{state:attempts>=12?'failed':'pending',lastError:failure,leaseUntil:0,nextAttemptAt:Date.now()+Math.min(3600000,10000*2**Math.min(attempts,8))}:{state:outcome,processedAt:new Date().toISOString(),leaseUntil:0});});
  }
 }catch{console.warn('[Dotfy] Fila de conciliação indisponível; nova tentativa será feita.');}finally{this.busy=false;}}
}
export async function reconcileDotfyEvent(event:DotfyEvent,deps:{getCharge:(id:string)=>Promise<any>;getWithdrawal:(id:string)=>Promise<any>;findCharge:(id:string)=>Promise<any>;credit:(charge:any)=>Promise<void>;settleWithdrawal:(id:string,completed:boolean,amountCents:number)=>Promise<boolean>}){
 const d=event.data;
 if(['EVENT:CHARGE_PAID','EVENT:CHARGE_CREATED','EVENT:CHARGE_EXPIRED'].includes(event.event)){
  const correlation=String(d.correlationID||d.correlationId||'');if(!correlation)throw new DotfyError('Cobrança sem correlationID.',400,'MISSING_CORRELATION');
  const charge=await deps.findCharge(correlation);if(!charge)throw new DotfyError('Cobrança local ainda não disponível.',503,'CHARGE_NOT_FOUND');
  const remote=await deps.getCharge(correlation);const confirmed=remote.data||remote;
  if(String(confirmed.correlationID||confirmed.correlationId)!==correlation||String(confirmed.id)!==String(charge.id))throw new DotfyError('Cobrança divergente.',409,'CHARGE_MISMATCH');
  if(!Number.isSafeInteger(confirmed.value)||confirmed.value!==Math.round(Number(charge.valueInReais)*100))throw new DotfyError('Valor confirmado diverge do depósito.',409,'AMOUNT_MISMATCH');
  if(paidCharge(confirmed))await deps.credit({...charge,status:'PAID',isPaid:true});
  return;
 }
 if(['EVENT:WITHDRAWAL_COMPLETED','EVENT:WITHDRAWAL_FAILED'].includes(event.event)){
  if(!d.id)throw new DotfyError('Saque sem identificador.',400,'MISSING_WITHDRAWAL');
  const remote=await deps.getWithdrawal(String(d.id));const wd=remote.withdrawal||remote.data||remote;
  if(String(wd.id)!==String(d.id))throw new DotfyError('Saque divergente.',409,'WITHDRAWAL_MISMATCH');
  // NEEDS_REVIEW and split legs never release a whole wallet reservation.
  if(wd.split||wd.legs?.length||remote.split||remote.legs?.length)throw new DotfyError('Saque dividido requer conciliação das pernas.',409,'SPLIT_REVIEW_REQUIRED');
  const status=String(wd.status).toUpperCase();if(!['COMPLETED','FAILED'].includes(status))throw new DotfyError('Saque não finalizado no gateway.',503,'WITHDRAWAL_PENDING');
  if(!Number.isSafeInteger(wd.amount)||wd.amount<=0)throw new DotfyError('Valor do saque inválido.',409,'AMOUNT_MISMATCH');
  if(!await deps.settleWithdrawal(String(d.id),status==='COMPLETED',wd.amount))throw new DotfyError('Saque não vinculado localmente.',503,'WITHDRAWAL_NOT_FOUND');
 }
 // Other documented families are durably audited, without inventing wallet credits.
 return 'audit_only';
}
