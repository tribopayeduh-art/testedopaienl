import crypto from 'node:crypto';
import {supabaseStore,type SupabaseStore} from './supabaseStore.ts';
import {effectiveAffiliateWithdrawalMode} from './affiliateWithdrawalPolicy.ts';
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
export function affiliateCashoutId(userId:string,requestId:string){if(!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))throw fail('Atualize a página antes de solicitar o saque. Identificador ausente ou inválido.');return 'tx_aff_wd_'+crypto.createHash('sha256').update(userId+':'+requestId).digest('hex').slice(0,40);}
export function affiliateCashoutSignature(amount:number,key:string,type:string,wantAuto:boolean){return JSON.stringify([amount,key.trim(),type||'',wantAuto]);}
export async function reserveAffiliateCashout(input:{userId:string;affiliateId:string;requestId:string;signature:string;amount:number;fee:number;pixKey:string;pixType:string;wantAuto:boolean},store:SupabaseStore=supabaseStore){
 const id=affiliateCashoutId(input.userId,input.requestId);
 if(!Number.isFinite(input.amount)||input.amount<20||input.amount>100000||Math.abs(input.amount*100-Math.round(input.amount*100))>1e-6||!Number.isFinite(input.fee)||input.fee<0||input.fee>=input.amount||!input.pixKey.trim())throw fail('Valor ou destino do saque inválido.');
 return store.transaction(async tx=>{
  const tr=store.collection('transactions').doc(id),ur=store.collection('users').doc(input.userId),ar=store.collection('affiliates').doc(input.affiliateId),gr=store.collection('affiliate_cashout_requests').doc(input.userId);
  const previous=(await tx.get(tr)).data(),user=(await tx.get(ur)).data(),affiliate=(await tx.get(ar)).data(),guard=(await tx.get(gr)).data(),config=(await tx.get(store.collection('settings').doc('dotfy'))).data();
  if(!user||!affiliate||affiliate.userId!==input.userId)throw fail('Carteira de comissões não encontrada.',404);
  if(previous){if(previous.requestSignature!==input.signature)throw fail('Identificador já utilizado em outro saque.',409);return{transaction:previous,balance:Number(affiliate.affiliateBalance||0),replayed:true};}
  if(guard?.transactionId){const prior=(await tx.get(store.collection('transactions').doc(guard.transactionId))).data();if(prior?.status==='pending')throw fail('Já existe um saque em andamento. Consulte o histórico antes de solicitar outro.',409);}
  if(user.isBlocked||user.withdrawBlocked||user.hasAffiliateDemoBalance)throw fail('Esta conta está impedida de sacar.',403);
  const balance=Number(affiliate.affiliateBalance||0),currentFee=Number(affiliate.withdrawFee??user.withdrawFee??0);
  if(currentFee!==input.fee)throw fail('A taxa mudou. Atualize antes de sacar.',409);
  if(!Number.isFinite(balance)||balance<input.amount)throw fail('Saldo de comissões insuficiente.',409);
  const automatic=input.wantAuto&&effectiveAffiliateWithdrawalMode(user,affiliate,config?.affiliateAutoCashoutEnabled!==false).mode==='auto';
  if(automatic&&input.amount-input.fee<=5)throw fail('O valor líquido precisa superar R$ 5,00 para envio automático.');
  const createdAt=new Date().toISOString(),next=Math.round((balance-input.amount)*100)/100;
  const record={id,userId:input.userId,type:'withdrawal',status:'pending',amount:input.amount,fee:input.fee,netAmount:Math.round((input.amount-input.fee)*100)/100,walletKind:'affiliate',affiliateId:input.affiliateId,pixKey:{key:input.pixKey,type:input.pixType},pixType:input.pixType,paymentMethod:automatic?'Dotfy Gateway (Automático)':user.isInfluencer?'Afiliado Influenciador (Análise Manual)':'Afiliados Hub (Análise Manual)',description:'Saque de comissões · aguardando processamento e confirmação',isAutoCashout:automatic,requestSignature:input.signature,createdAt};
  tx.update(ar,{affiliateBalance:next});tx.create(tr,record);tx.set(gr,{transactionId:id,createdAt});
  if(user.isInfluencer){const rid='inf_req_'+id;tx.create(store.collection('influencerCommissionRequests').doc(rid),{id:rid,transactionId:id,affiliateId:user.parentAffiliateId||user.affiliateId||'',affiliateUserId:user.parentAffiliateUserId||'',influencerUserId:input.userId,influencerName:user.name||'',influencerEmail:user.email||'',amount:input.amount,pixKey:input.pixKey,pixKeyType:input.pixType,status:'pending',createdAt});}
  return{transaction:record,balance:next,replayed:false};
 });
}
