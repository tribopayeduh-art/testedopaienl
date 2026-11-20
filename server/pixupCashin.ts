const api = 'https://api.pixupbr.com';

const oauthEndpoint = 'https://api.pixupbr.com/v2/oauth/token';
let cached: { token: string; expiresAt: number } | undefined;
let pending: Promise<string> | undefined;
let retryAfter = 0;

export class PixupAuthError extends Error {}

export function pixupConfigured() {
  return Boolean(process.env.PIXUP_CLIENT_ID?.trim() && process.env.PIXUP_CLIENT_SECRET?.trim());
}

async function getToken(fetcher: typeof fetch): Promise<string> {
  if (!pixupConfigured()) throw new PixupAuthError('Configure as credenciais OAuth2 do Pixup no servidor.');
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  if (pending) return pending;
  if (Date.now() < retryAfter) throw new PixupAuthError('A autenticação Pixup está em espera. Confira a credencial e tente novamente mais tarde.');
  pending = (async () => {
    const basic = Buffer.from(`${process.env.PIXUP_CLIENT_ID!.trim()}:${process.env.PIXUP_CLIENT_SECRET!.trim()}`).toString('base64');
    const res = await fetcher(oauthEndpoint, {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      retryAfter = Date.now() + (res.status === 403 ? 300000 : 30000);
      throw new PixupAuthError(res.status === 401 ? 'O Pixup recusou as credenciais OAuth2.' : 'Não foi possível autenticar no Pixup.');
    }
    const data = await res.json();
    if (typeof data?.access_token !== 'string' || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0) {
      retryAfter = Date.now() + 30000;
      throw new PixupAuthError('O Pixup retornou uma resposta de autenticação inválida.');
    }
    cached = { token: data.access_token, expiresAt: Date.now() + Math.max(0, data.expires_in * 1000 - 60000) };
    return cached.token;
  })();
  try { return await pending; } finally { pending = undefined; }
}

async function pixupPost(path: 'cashin' | 'cashout', input: object, fetcher: typeof fetch) {
  const send = (token: string) => fetcher(`${api}/v2/transactions/${path}`, {
    method: 'POST', redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, currency: 'BRL' }),
    signal: AbortSignal.timeout(12000),
  });
  const token = await getToken(fetcher);
  let response = await send(token);
  if (response.status === 401) {
    if (cached?.token === token) cached = undefined;
    await response.body?.cancel().catch(() => {});
    const refreshed = await getToken(fetcher);
    response = await send(refreshed);
    if (response.status === 401 && cached?.token === refreshed) {
      cached = undefined;
      retryAfter = Date.now() + 30000;
    }
  }
  return response;
}

export async function requestPixupCashin(input: { amount: number; external_id: string; postback_url?: string; payer?: { name?: string; document?: string } }, fetcher = fetch) {
  const response = await pixupPost('cashin', input, fetcher);
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    const code = result?.error?.code ?? result?.code;
    const messages: Record<string, string> = {
      INVALID_AMOUNT: 'O Pixup recusou o valor da cobrança.',
      BELOW_MIN_LIMIT: 'Valor abaixo do mínimo aceito pelo Pixup.',
      EXCEEDS_MAX_LIMIT: 'Valor acima do limite aceito pelo Pixup.',
      LIMIT_EXCEEDED: 'Limite diário do Pixup atingido.',
      DUPLICATE_EXTERNAL_ID: 'A referência já foi usada em outra transação.',
    };
    const message = response.status === 401 || response.status === 403 ? 'O Pixup recusou a credencial configurada.' : typeof code === 'string' && Object.hasOwn(messages, code) ? messages[code] : 'O Pixup não confirmou a criação. Repita com a mesma referência.';
    return { error: message, status: response.status === 429 ? 429 : response.status === 409 ? 409 : response.status === 422 ? 422 : 502 } as const;
  }
  const data = result.data;
  if (input.postback_url && (data?.external_id !== input.external_id || data?.currency !== 'BRL' || Number(data?.amount) !== input.amount || data?.payment_method !== 'pix' || data?.status !== 'pending')) {
    return { error: 'A cobrança Pixup não corresponde aos dados solicitados.', status: 502 } as const;
  }
  if (typeof data?.transaction_id !== 'string' || typeof data?.payment_info?.qrcode !== 'string' || !data.payment_info.qrcode) {
    return { error: 'Resposta incompleta do Pixup. Repita com a mesma referência.', status: 502 } as const;
  }
  return { id: data.transaction_id, qrcode: data.payment_info.qrcode, expiresAt: typeof data.payment_info.expires_at === 'string' ? data.payment_info.expires_at : null, paymentStatus: data.status };
}

export async function requestPixupCashout(input: { amount: number; external_id: string; key: string; key_type: string; name: string; postback_url: string }, fetcher = fetch) {
  const res = await pixupPost('cashout', input, fetcher);
  const body = await res.json().catch(() => null);
  const d = body?.data;
  const requestId = typeof body?.request_id === 'string' && /^[a-z0-9_-]{1,100}$/i.test(body.request_id) ? body.request_id : undefined;
  if (res.status === 202 && body?.success === true && /^[a-z0-9_-]{1,100}$/i.test(d?.transaction_id ?? '') &&
      d.external_id === input.external_id && d.currency === 'BRL' && Number(d.amount) === input.amount && d.status === 'pending') {
    return { kind: 'accepted' as const, gatewayId: String(d.transaction_id), requestId };
  }
  const code = typeof body?.error?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(body.error.code) ? body.error.code : 'PIXUP_UNCONFIRMED';
  const knownRefusal = ['INVALID_AMOUNT','INVALID_PIX_KEY','INSUFFICIENT_FUNDS','BELOW_MIN_LIMIT','EXCEEDS_MAX_LIMIT','LIMIT_EXCEEDED','ACCOUNT_UNDER_REVIEW','PERMISSION_DENIED','UNAUTHORIZED_IP','KYC_REQUIRED'].includes(code);
  return { kind: body?.success === false && body.error?.retryable === false && [403,409,422].includes(res.status) && knownRefusal ? 'refused' as const : 'uncertain' as const, code, requestId };
}

export async function readPixupAccount(resource: 'balance' | 'transactions' | 'profile' | 'limits' | 'fees', page = 1, fetcher = fetch) {
  const paths = { balance: 'balance', transactions: 'transactions/list', profile: 'info/profile', limits: 'limits', fees: 'fees' };
  const send = (token: string) => fetcher(`${api}/v2/account/${paths[resource]}`, {
    method: resource === 'transactions' ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(resource === 'transactions' ? { body: JSON.stringify({ page, page_size: 20 }) } : {}),
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const token = await getToken(fetcher);
  let response = await send(token);
  if (response.status === 401) {
    if (cached?.token === token) cached = undefined;
    await response.body?.cancel().catch(() => {});
    response = await send(await getToken(fetcher));
  }
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.success !== true || !json.data) {
    const code = /^[A-Z0-9_]{1,80}$/.test(json?.error?.code || '') ? json.error.code : '';
    throw new PixupAuthError(code ? `Consulta Pixup indisponível: ${code}.` : 'Consulta Pixup indisponível.');
  }
  const fields = (obj: any, keys: string[]) => Object.fromEntries(keys.flatMap(key => ['string','number','boolean'].includes(typeof obj?.[key]) ? [[key,obj[key]]] : []));
  const data = json.data;
  if (resource === 'transactions') return {
    items: (Array.isArray(data.items) ? data.items : []).slice(0,20).map((row: any) => fields(row, ['transaction_id','external_id','source','status','amount','fee_amount','currency','created_at'])),
    pagination: fields(data.pagination,['page','total','total_pages','has_next','has_prev']),
    summary: fields(data.summary,['total_transactions','total_in','total_out','total_fees']),
  };
  if (resource === 'balance') return { balances: (Array.isArray(data.balances) ? data.balances : []).map((row: any) => fields(row,['currency','available','blocked','pending','total'])), ...fields(data,['wallet_total_brl','wallet_total_usd']) };
  if (resource === 'profile') return fields(data,['username','kyc_level','kyc_status','status','created_at']);
  if (resource === 'limits') return { limits: (Array.isArray(data.limits) ? data.limits : []).map((row: any) => fields(row,['currency','operation','daily_limit','daily_used','daily_remaining','monthly_limit','monthly_used','per_operation_min','per_operation_max'])) };
  const fees = data.fees ?? data.by_currency ?? {};
  return { fees: Object.fromEntries(Object.entries(fees).filter(([currency]) => /^[A-Z]{3,5}$/.test(currency)).map(([currency, operations]) => [currency, Object.fromEntries(Object.entries((operations ?? {}) as object).filter(([key]) => ['cashin','cashout','internal_transfer'].includes(key)).map(([key, value]) => [key, fields(value,['type','value','min','max'])]))])), conversion: fields(data.conversion,['spread_percent','fee_percent']) };
}
