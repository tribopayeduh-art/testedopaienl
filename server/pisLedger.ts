function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
export function parseCents(value:unknown):number{
 const raw=String(value??'').trim().replace(',','.');if(!/^\d{1,9}(\.\d{1,2})?$/.test(raw))fail('Informe um valor em reais com até duas casas decimais.');
 const [whole,fraction='']=raw.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(!Number.isSafeInteger(cents)||cents<1||cents>10000000)fail('O valor deve ser de R$ 0,01 a R$ 100.000,00.');return cents;
}
export async function transferAtomic(db:any,{sender,code,cents,id}:any){
 return db.runTransaction(async(tx:any)=>{
 const receiptRef=db.collection('pis_transfers').doc(id);const receipt=await tx.get(receiptRef);
 if(receipt.exists){const previous=receipt.data();if(previous.recipientCode!==code||previous.cents!==cents||previous.senderId!==sender.userId)fail('Identificador já usado em outra transferência.',409);return{...previous,replayed:true};}
 const codeDoc=await tx.get(db.collection('pis_codes').doc(code));if(!codeDoc.exists)fail('PIS IO não encontrado.',404);const recipient=codeDoc.data();if(recipient.userId===sender.userId||recipient.affiliateId===sender.affiliateId)fail('Não é possível enviar para sua própria conta.');
 const fromRef=db.collection('affiliates').doc(sender.affiliateId),toRef=db.collection('affiliates').doc(recipient.affiliateId);
 const from=await tx.get(fromRef),to=await tx.get(toRef);const fromUser=await tx.get(db.collection('users').doc(sender.userId)),toUser=await tx.get(db.collection('users').doc(recipient.userId));
 if(!from.exists||!to.exists||!fromUser.exists||!toUser.exists||fromUser.data().isBlocked||toUser.data().isBlocked)fail('Uma das contas está indisponível.',403);
 if(from.data().userId!==sender.userId||to.data().userId!==recipient.userId)fail('Cadastro de afiliado inconsistente.',409);
 const available=Math.round(Number(from.data().affiliateBalance||0)*100),receiving=Math.round(Number(to.data().affiliateBalance||0)*100);
 if(!Number.isSafeInteger(cents)||cents<=0||!Number.isSafeInteger(available)||!Number.isSafeInteger(receiving)||receiving<0||!Number.isSafeInteger(receiving+cents))fail('Saldo ou valor inválido.');if(available<cents)fail('Saldo de comissões insuficiente.',409);
 const result={id,cents,amount:cents/100,senderId:sender.userId,recipientId:recipient.userId,senderCode:sender.code,recipientCode:code,senderName:fromUser.data().name||'Afiliado',recipientName:toUser.data().name||'Afiliado',members:[sender.userId,recipient.userId],createdAt:new Date().toISOString(),status:'completed'};
 tx.update(fromRef,{affiliateBalance:(available-cents)/100});tx.update(toRef,{affiliateBalance:(receiving+cents)/100});tx.create(receiptRef,result);return result;
 });
}
