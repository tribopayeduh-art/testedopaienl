import {dotfyFetch,DOTFY_BASE_URL} from './client.ts';
export function normalizePixKeyForDotfy(rawType: string | undefined, rawKey: string) {
  let cleanType = (rawType || '').trim().toUpperCase();
  let cleanKey = String(rawKey || '').trim();

  if (cleanKey.startsWith('[')) {
    const closeBracket = cleanKey.indexOf(']');
    if (closeBracket !== -1) {
      if (!cleanType) cleanType = cleanKey.substring(1, closeBracket).toUpperCase();
      cleanKey = cleanKey.substring(closeBracket + 1).trim();
    }
  }

  if (!cleanType) {
    if (cleanKey.includes('@')) cleanType = 'EMAIL';
    else if (/^[0-9a-fA-F-]{32,36}$/.test(cleanKey)) cleanType = 'RANDOM';
    else {
      const digits = cleanKey.replace(/\D/g, '');
      if (digits.length === 11) cleanType = 'CPF';
      else if (digits.length === 14) cleanType = 'CNPJ';
      else if (digits.length >= 10 && digits.length <= 13) cleanType = 'PHONE';
      else cleanType = 'CPF';
    }
  }

  let normalizedSearchKey = cleanKey;
  let dotfyRegistrationKey = cleanKey;

  if (cleanType === 'PHONE') {
    let digits = cleanKey.replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      digits = digits.slice(2);
    }
    normalizedSearchKey = digits;
    dotfyRegistrationKey = digits; // Dotfy requires 10 or 11 digits without +55
  } else if (cleanType === 'CPF' || cleanType === 'CNPJ') {
    const digits = cleanKey.replace(/\D/g, '');
    normalizedSearchKey = digits;
    dotfyRegistrationKey = digits;
  } else if (cleanType === 'EMAIL') {
    normalizedSearchKey = cleanKey.trim().toLowerCase();
    dotfyRegistrationKey = normalizedSearchKey;
  } else {
    normalizedSearchKey = cleanKey.trim();
    dotfyRegistrationKey = normalizedSearchKey;
  }

  return { cleanType, cleanKey, normalizedSearchKey, dotfyRegistrationKey };
}

export function createWithdrawalKeyResolver(transport:typeof dotfyFetch=dotfyFetch){
 return async(apiKey:string,rawKey:string,type?:string,name?:string,options?:{existingIdOnly?:boolean})=>{
  const headers={Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'};
  const normalize=normalizePixKeyForDotfy(type,rawKey);
  const accept=(item:any)=>item.status==='APPROVED'?{pixKeyId:String(item.id)}:{pixKeyId:'',error:item.status==='REJECTED'?'A chave PIX foi rejeitada pela Dotfy. Revise o cadastro no gateway.':'A chave PIX aguarda aprovação na Dotfy. Aguarde a liberação antes de enviar o saque.'};
  const list=async()=>{const r=await transport(`${DOTFY_BASE_URL}/api/pix-keys`,{headers});if(!r.ok)throw new Error(`Não foi possível consultar as chaves PIX na Dotfy (HTTP ${r.status}).`);const body=await r.json();if(!Array.isArray(body.pixKeys))throw new Error('Resposta inválida ao consultar as chaves PIX.');return body.pixKeys;};
  const find=(items:any[])=>options?.existingIdOnly?items.find(k=>k.id===rawKey):items.find(k=>{const n=normalizePixKeyForDotfy(k.type,k.key);return n.cleanType===normalize.cleanType&&n.normalizedSearchKey===normalize.normalizedSearchKey;});
  try{
   const current=find(await list());if(current)return accept(current);
   // A stored gateway ID is account-specific, never a PIX address to register.
   if(options?.existingIdOnly)return {pixKeyId:'',error:'O ID da chave PIX salvo não existe na conta Dotfy atual. Recadastre a chave PIX do solicitante.'};
   const response=await transport(`${DOTFY_BASE_URL}/api/pix-keys`,{method:'POST',headers,body:JSON.stringify({type:normalize.cleanType,key:normalize.dotfyRegistrationKey,name:(name||'Beneficiário').slice(0,100)})});
   const body=await response.json();
   if(response.ok&&body.pixKey?.id)return accept(body.pixKey);
   if(response.status===409){const existing=find(await list());if(existing)return accept(existing);}
   return {pixKeyId:'',error:typeof body.error==='string'?body.error:'Não foi possível cadastrar e validar a chave PIX na conta Dotfy atual.'};
  }catch(e:any){return {pixKeyId:'',error:e?.message||'Consulta de chave PIX indisponível.'};}
 };
}
export const resolveApprovedWithdrawalKey=createWithdrawalKeyResolver();
