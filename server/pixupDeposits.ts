export const PIXUP_DEPOSIT_REFERENCE = /^inex-dep-[a-f0-9]{32}$/;

export function pixupDepositCents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(String(value))) return null;
  const cents = Math.round(Number(value) * 100);
  return cents >= 100 && Number.isSafeInteger(cents) ? cents : null;
}

export function parsePixupDepositEvent(payload: any, header: string) {
  const d = payload?.data;
  if (header !== 'cashin.confirmed' || payload?.event !== header || d?.type !== 'cashin' || d?.currency !== 'BRL' || d?.status !== 'confirmed') return null;
  if (typeof d.external_id !== 'string' || !PIXUP_DEPOSIT_REFERENCE.test(d.external_id)) return null;
  const cents = pixupDepositCents(d.amount);
  if (!cents || typeof d.transaction_id !== 'string' || !/^[a-z0-9_-]{1,100}$/i.test(d.transaction_id) || d.transaction_id !== payload.transaction_id) throw new Error('Confirmação Pixup inválida.');
  return {reference:d.external_id as string, id:d.transaction_id as string, cents};
}

export function matchesPixupDeposit(charge: {id:string; value:number; userId?:string; gateway?:string} | null, event: {id:string; cents:number}) {
  return Boolean(charge?.gateway === 'pixup' && charge.userId && charge.id === event.id && charge.value === event.cents);
}
