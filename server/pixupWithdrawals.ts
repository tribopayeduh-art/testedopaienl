import { isIP } from 'node:net';
import { withdrawalDestination } from './dotfy/withdrawalApproval.ts';
import { pixupConfigured, requestPixupCashout } from './pixupCashin.ts';

export function pixupPostback() {
  try {
    const url = new URL(process.env.PIXUP_POSTBACK_URL || '');
    if (url.protocol === 'https:' && !['seu-dominio.com','seusite.com','localhost'].includes(url.hostname) && url.pathname === '/api/webhooks/pixup' && !url.username && !url.password && !url.search && !url.hash) return url.toString();
  } catch {}
  return '';
}
export function pixupTrustedSource(remote: string, forwarded: string) {
  const clean = (ip: string) => ip.trim().toLowerCase().replace(/^::ffff:/, '');
  const peer = clean(remote);
  const proxy = clean(process.env.PIXUP_TRUSTED_PROXY_IP || '');
  // Use only the immediate proxy's appended address; never a client-controlled first entry.
  const source = proxy && isIP(proxy) && peer === proxy ? clean(forwarded.split(',').at(-1) || '') : peer;
  return source === '185.193.127.186' || source === '2a0a:3840:1337:127::b9c1:7fba:1337';
}
export function pixupCashoutEvent(payload: any, event: string) {
  if (!['cashout.confirmed','cashout.failed'].includes(event)) return null;
  const data = payload?.data;
  if (payload?.event !== event || data?.currency !== 'BRL' || data?.type !== 'cashout' ||
      data?.status !== (event === 'cashout.confirmed' ? 'confirmed' : 'failed') ||
      !/^[a-z0-9_-]{1,100}$/i.test(data?.transaction_id ?? '') || payload.transaction_id !== data.transaction_id ||
      typeof data?.external_id !== 'string' || !/^inex-wd-[a-z0-9_-]{1,100}$/i.test(data.external_id) ||
      !/^\d{1,10}(\.\d{1,2})?$/.test(String(data.amount)) || Number(data.amount) <= 0) throw new Error('Evento Pixup inválido.');
  return { id: data.external_id.slice(8), gatewayId: data.transaction_id, completed: event === 'cashout.confirmed', cents: Math.round(Number(data.amount) * 100) };
}
export async function approvePixupWithdrawal(tx: any, user: any, deps: {
  claim: (expected: { amount: number; netAmount: number; userId: string }) => Promise<string>;
  record: (attempt: string, result: any) => Promise<void>;
  send?: typeof requestPixupCashout;
}, operator: { id?: string; name?: string }) {
  const fail = (message: string, status: number, code: string) => Object.assign(new Error(message), { status, code });
  if (tx.pixupWithdrawalId) return { pixupWithdrawalId: tx.pixupWithdrawalId, replayed: true, message: 'Saque já enviado ao Pixup; consulte o status no painel.' };
  if (tx.status !== 'pending' || tx.gatewayProcessing || tx.dotfyWithdrawalId) throw fail('Saque já enviado ou reservado para conciliação.',409,'WITHDRAWAL_RECONCILIATION_REQUIRED');
  if (!user || user.withdrawBlocked || user.hasAffiliateDemoBalance) throw fail('Esta conta está impedida de sacar.',403,'WITHDRAWAL_BLOCKED');
  const postback = pixupPostback();
  if (!postback || !pixupConfigured()) throw fail('Configure OAuth e PIXUP_POSTBACK_URL no servidor.',503,'PIXUP_NOT_CONFIGURED');
  const amount = Number(tx.netAmount ?? tx.amount);
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount*100-Math.round(amount*100)) > 1e-6 || !/^[a-z0-9_-]{1,100}$/i.test(tx.id)) throw fail('Valor ou referência de saque inválidos.',400,'INVALID_WITHDRAWAL');
  const destination = withdrawalDestination(tx,user);
  const kind = destination.type?.toLowerCase();
  const type = kind === 'evp' || kind === 'aleatoria' ? 'random' : kind;
  if (!destination.key || !type || !['cpf','cnpj','email','phone','random'].includes(type)) throw fail('Informe uma chave PIX com tipo válido no cadastro do saque.',400,'INVALID_PIX_KEY');
  const attempt = await deps.claim({ amount: Number(tx.amount), netAmount: amount, userId: tx.userId });
  let result;
  try { result = await (deps.send ?? requestPixupCashout)({ amount, external_id: `inex-wd-${tx.id}`, key: destination.key, key_type: type, name: user.name || 'Beneficiário', postback_url: postback }); }
  catch { result = {kind:'uncertain' as const,code:'PIXUP_UNCONFIRMED',requestId:undefined}; }
  if (result.kind === 'accepted') {
    await deps.record(attempt,{...result,gatewayStatus:'PENDING',legs:[],approvedByUserId:operator.id||'',approvedByName:operator.name||'Administrador'});
    return { pixupWithdrawalId:result.gatewayId,replayed:false,message:'Saque enviado ao Pixup. Aguarde a confirmação bancária.' };
  }
  const message = result.kind === 'refused' ? 'Pixup recusou o saque.' : 'Envio sem confirmação. Saque reservado para conciliação.';
  await deps.record(attempt,{...result,message});
  throw fail(message + (result.requestId ? ` Referência Pixup: ${result.requestId}` : ''),result.kind==='refused'?422:503,result.code);
}
