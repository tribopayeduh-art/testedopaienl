import crypto from 'node:crypto';
import type {SupabaseStore} from './supabaseStore.ts';
import type {StoredChargeDB} from './db.ts';

const fail=(message:string,status=409)=>Object.assign(new Error(message),{status});
export async function reservePixupDeposit(store:SupabaseStore,userId:string,cents:number,key?:string) {
  if(key&&!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw fail('Identificador da cobrança inválido.',400);
  const scope=crypto.createHash('sha256').update(userId+':'+(key||'pending:'+cents)).digest('hex');
  const pointer=store.collection('pixup_deposit_intents').doc(scope);
  const lease=crypto.randomUUID();
  return store.runTransaction(async tx=>{
    const old=(await tx.get(pointer)).data();
    let charge:StoredChargeDB|undefined;
    if(old?.reference)charge=(await tx.get(store.collection('charges').doc(old.reference))).data();
    if(old&&old.cents!==cents)throw fail('A referência já foi usada com outro valor.');
    if(charge && (key || !charge.credited && (!charge.expiresAt || Date.parse(charge.expiresAt)>Date.now()))) {
      if(charge.qrCode || charge.credited)return {reference:charge.correlationID,charge,scope,lease,replayed:true};
      if(Number(old.leaseUntil)>Date.now())throw fail('A cobrança está sendo gerada. Aguarde e tente novamente.');
      tx.update(pointer,{lease,leaseUntil:Date.now()+20000});
      return {reference:charge.correlationID,charge,scope,lease,replayed:false};
    }
    const reference='inex-dep-'+crypto.randomBytes(16).toString('hex');
    const draft:StoredChargeDB={id:reference,chargeId:'',correlationID:reference,value:cents,valueInReais:cents/100,userId,gateway:'pixup',status:'PENDING',description:'Depósito via Pixup',createdAt:new Date().toISOString()};
    tx.set(pointer,{reference,cents,lease,leaseUntil:Date.now()+20000});
    tx.create(store.collection('charges').doc(reference),draft);
    return {reference,charge:draft,scope,lease,replayed:false};
  });
}

export async function finishPixupDeposit(store:SupabaseStore,intent:{reference:string;scope:string;lease:string},charge:StoredChargeDB) {
  return store.runTransaction(async tx=>{
    const ref=store.collection('charges').doc(intent.reference),pointer=store.collection('pixup_deposit_intents').doc(intent.scope);
    const saved=(await tx.get(ref)).data(),owner=(await tx.get(pointer)).data();
    if(!saved||saved.gateway!=='pixup'||saved.userId!==charge.userId||saved.value!==charge.value)throw fail('Cobrança divergente.');
    if(saved.chargeId && saved.id!==charge.id)throw fail('O provedor retornou outra cobrança.');
    if(owner?.lease!==intent.lease)throw fail('A cobrança está em conciliação.');
    const result={...charge,...(saved.credited?{credited:true,status:'PAID' as const}:{})};
    tx.set(ref,result,{merge:true});
    tx.update(pointer,{leaseUntil:0});
    return result;
  });
}

export async function bindPixupConfirmation(store:SupabaseStore,reference:string,id:string,cents:number) {
  return store.runTransaction(async tx=>{
    const ref=store.collection('charges').doc(reference),charge=(await tx.get(ref)).data();
    if(!charge)throw fail('Cobrança local ainda indisponível.',503);
    if(charge.gateway!=='pixup'||charge.value!==cents||!charge.userId||(charge.chargeId&&charge.id!==id))throw fail('Confirmação divergente.');
    if(!charge.chargeId)tx.update(ref,{id,chargeId:id,transactionID:id});
    return {...charge,id,chargeId:id,transactionID:id} as StoredChargeDB;
  });
}
