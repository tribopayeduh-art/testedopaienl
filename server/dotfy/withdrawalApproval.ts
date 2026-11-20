import {DotfyError} from './client.ts';
type ApprovalDeps={
 getTransactionById:(id:string)=>Promise<any>;
 getUserById:(id:string)=>Promise<any>;
 getApiKey:()=>Promise<string>;
 resolveKey:(key:string,raw:string,type?:string,name?:string,options?:{existingIdOnly?:boolean})=>Promise<{pixKeyId:string;error?:string}>;
 claimWithdrawal:(id:string,expected:{amount:number;netAmount:number;userId:string})=>Promise<string>;
 recordResult:(id:string,attempt:string,result:any)=>Promise<void>;
 send:(key:string,body:any)=>Promise<Response>;
};
export function withdrawalDestination(tx:any,user:any){
 const stored=tx.pixKey??user?.pixKey??user?.pixKeys?.[0];
 const raw=typeof stored==='object'&&stored?stored.key:stored;
 const type=tx.pixType||(typeof stored==='object'?stored?.type:undefined)||user?.pixKeyType;
 return {key:typeof raw==='string'?raw.trim():'',type:typeof type==='string'?type:undefined,pixKeyId:typeof tx.pixKeyId==='string'?tx.pixKeyId.trim():''};
}
export async function approveDotfyWithdrawal(id:string,deps:ApprovalDeps,operator:{id?:string;name?:string},confirmation:{totpCode?:string;confirmationToken?:string}={}){
 const tx=await deps.getTransactionById(id);
 if(!tx||tx.type!=='withdrawal')throw new DotfyError('Solicitação de saque não encontrada.',404,'WITHDRAWAL_NOT_FOUND');
 if(tx.status!=='pending')throw new DotfyError('Somente saques pendentes podem ser enviados.',409,'WITHDRAWAL_NOT_PENDING');
 if(tx.dotfyWithdrawalId)return {dotfyWithdrawalId:tx.dotfyWithdrawalId,replayed:true,message:'Este saque já foi enviado à Dotfy e aguarda confirmação bancária.'};
 if(tx.gatewayProcessing)throw new DotfyError('Este saque já teve uma tentativa de envio e está reservado para conciliação. Confira a Dotfy antes de tentar novamente.',409,'WITHDRAWAL_RECONCILIATION_REQUIRED',true);
 const amount=Number(tx.netAmount??tx.amount);
 if(!Number.isFinite(amount)||amount<=0||Math.abs(amount*100-Math.round(amount*100))>1e-6)throw new DotfyError('Valor líquido do saque inválido. Revise a solicitação e a taxa.',400,'INVALID_WITHDRAWAL_AMOUNT');
 const user=await deps.getUserById(tx.userId);
 if(!user)throw new DotfyError('Conta solicitante não encontrada.',404,'WITHDRAWAL_USER_NOT_FOUND');
 if(user.withdrawBlocked||user.hasAffiliateDemoBalance)throw new DotfyError('Esta conta está impedida de sacar.',403,'WITHDRAWAL_BLOCKED');
 const key=await deps.getApiKey();if(!key)throw new DotfyError('Configure a chave Dotfy no servidor.',503,'DOTFY_NOT_CONFIGURED');
 const destination=withdrawalDestination(tx,user);
 if(!destination.pixKeyId&&!destination.key)throw new DotfyError('Cadastre uma chave PIX para o solicitante antes de aprovar.',400,'PIX_KEY_REQUIRED');
 // Resolve the destination before locking the financial send attempt.
 const resolved=await deps.resolveKey(key,destination.key||destination.pixKeyId,destination.type,user.name||'Beneficiário',{existingIdOnly:!destination.key});
 if(!resolved.pixKeyId)throw new DotfyError(resolved.error||'Não foi possível vincular a chave PIX na Dotfy.',400,'PIX_KEY_NOT_RESOLVED');
 const attempt=await deps.claimWithdrawal(id,{amount:Number(tx.amount),netAmount:amount,userId:tx.userId});let response:Response;
 try{response=await deps.send(key,{amount,pixKeyId:resolved.pixKeyId,...(confirmation.totpCode?{totpCode:confirmation.totpCode}:{}),...(confirmation.confirmationToken?{confirmationToken:confirmation.confirmationToken}:{})});}
 catch{await deps.recordResult(id,attempt,{kind:'uncertain',code:'DOTFY_UNCONFIRMED',message:'Conexão interrompida após reservar o envio.'});throw new DotfyError('A Dotfy não confirmou o resultado. Saque reservado para conciliação; não repita a transferência.',503,'DOTFY_UNCONFIRMED',true);}
 let payload:any;try{payload=await response.json();}catch{payload=null;}
 const wd=payload?.withdrawal||payload?.data||payload;
 if(response.ok&&typeof wd?.id==='string'&&wd.id){
  await deps.recordResult(id,attempt,{kind:'accepted',gatewayId:wd.id,gatewayStatus:wd.status||'PROCESSING',split:!!payload?.split||!!wd.split,legs:payload?.legs||wd.legs||[],approvedByUserId:operator.id||'',approvedByName:operator.name||'Administrador'});
  return {dotfyWithdrawalId:wd.id,replayed:false,message:wd.status==='NEEDS_REVIEW'?'Dotfy recebeu o saque e solicitou conciliação. Aguarde a análise.':'Saque enviado à Dotfy. A confirmação bancária ainda está pendente.'};
 }
 const code=typeof payload?.code==='string'?payload.code:typeof payload?.type==='string'?payload.type:`DOTFY_HTTP_${response.status}`;
 const detail=typeof payload?.error==='string'?payload.error:typeof payload?.message==='string'?payload.message:'Não foi possível confirmar o envio à Dotfy.';
 // Only explicit non-ambiguous refusals unlock a new approval attempt. No wallet refund here.
 const knownRefusal=[400,401,403,404,409,422,429].includes(response.status)&&code!=='WITHDRAWAL_ALREADY_PENDING';
 await deps.recordResult(id,attempt,{kind:knownRefusal?'refused':'uncertain',code,message:detail.slice(0,250)});
 throw new DotfyError(knownRefusal?`Dotfy recusou o saque: ${detail}`:'Resultado Dotfy não confirmado. Saque reservado para conciliação; não repita a transferência.',knownRefusal?422:502,code,!knownRefusal);
}
