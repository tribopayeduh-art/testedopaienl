import crypto from 'node:crypto';
import {supabaseStore,type SupabaseStore} from './supabaseStore.ts';
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
export function effectiveAffiliateWithdrawalMode(user:any,affiliate:any,globalEnabled:boolean){
 if(user?.isBlocked||user?.withdrawBlocked||user?.hasAffiliateDemoBalance)return{mode:'blocked',reason:'Conta impedida de sacar'};
 if(user?.isInfluencer)return{mode:'manual',reason:'Influenciador sujeito à análise manual'};
 if(!affiliate||affiliate.status!=='active')return{mode:'manual',reason:'Afiliação não está ativa'};
 if(!globalEnabled)return{mode:'manual',reason:'Automação global desativada no gateway'};
 if(user?.autoWithdrawBlocked)return{mode:'manual',reason:'Aprovação manual configurada para esta conta'};
 return{mode:'auto',reason:'Elegível para envio automático de novas solicitações'};
}
export async function setAffiliateWithdrawalPolicy(input:{userId:string;affiliateId:string;mode:string;expectedBlocked:boolean;actorId:string},store:SupabaseStore=supabaseStore){
 if(!input.userId||!input.affiliateId||input.userId.includes('/')||input.affiliateId.includes('/')||!['auto','manual'].includes(input.mode)||typeof input.expectedBlocked!=='boolean'||!input.actorId)throw fail('Configuração de saque inválida.');
 return store.transaction(async tx=>{
  const ur=store.collection('users').doc(input.userId),ar=store.collection('affiliates').doc(input.affiliateId);
  const user=(await tx.get(ur)).data(),affiliate=(await tx.get(ar)).data();
  if(!user||!affiliate||affiliate.userId!==input.userId)throw fail('Afiliado não encontrado.',404);
  const before=Boolean(user.autoWithdrawBlocked),after=input.mode==='manual';
  if(before!==input.expectedBlocked)throw fail('A configuração mudou. Atualize a lista antes de salvar.',409);
  if(!after&&(user.isInfluencer||user.isBlocked||user.withdrawBlocked||user.hasAffiliateDemoBalance||affiliate.status!=='active'))throw fail('Esta conta não é elegível para saque automático. Revise os bloqueios e a afiliação.',409);
  if(before===after)return{autoWithdrawBlocked:after,changed:false};
  const at=new Date().toISOString();
  tx.update(ur,{autoWithdrawBlocked:after,withdrawalPolicyUpdatedAt:at,withdrawalPolicyUpdatedBy:input.actorId});
  tx.create(store.collection('admin_control_changes').doc(crypto.randomUUID()),{kind:'affiliate_withdrawal_policy',actorId:input.actorId,userId:input.userId,affiliateId:input.affiliateId,before:before?'manual':'auto',after:input.mode,createdAt:at});
  return{autoWithdrawBlocked:after,changed:true,updatedAt:at};
 });
}
export function summarizeAffiliateCashouts(transactions:any[]){
 const rows=transactions.filter(t=>t.type==='withdrawal'&&(t.isAutoCashout||(String(t.id).startsWith('tx_aff_wd_')&&String(t.paymentMethod||'').includes('Dotfy'))));
 return{rows,approvedAmount:Math.round(rows.filter(t=>t.status==='approved').reduce((n,t)=>n+Math.round(Number(t.amount||0)*100),0))/100,pendingCount:rows.filter(t=>t.status==='pending').length};
}
