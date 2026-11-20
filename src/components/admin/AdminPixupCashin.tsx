import { readApiJson } from '../../lib/readApiJson';
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, QrCode } from 'lucide-react';

export function AdminPixupCashin({ token }: { token: string }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<{ id: string; qrcode: string; expiresAt: string | null; paymentStatus?: string } | null>(null);
  const [qrImage, setQrImage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/pixup/config', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(); setConfigured(Boolean((await readApiJson(r)).configured)); })
      .catch(() => { if (!controller.signal.aborted) setError('Não foi possível consultar a configuração do Pixup.'); });
    return () => controller.abort();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || result || !configured) return;
    setError('');
    const doc = document.replace(/[^0-9]/g, '');
    if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(amount.trim()) || Number(amount.replace(',', '.')) < 1) {
      return setError('Informe um valor a partir de R$ 1,00, com até duas casas decimais.');
    }
    if (doc && doc.length !== 11 && doc.length !== 14) return setError('Informe um CPF ou CNPJ válido.');
    const id = reference || crypto.randomUUID();
    setReference(id);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/pixup/cashin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amount.trim(), name: name.trim(), document: doc, reference: id }),
      });
      const data = await readApiJson(res).catch(() => null);
      if (!res.ok || !data?.qrcode) throw new Error(data?.error || 'Sem confirmação. Repita com a mesma referência.');
      setResult(data);
      QRCode.toDataURL(data.qrcode, { width: 232, margin: 2 }).then(setQrImage).catch(() => {});
    } catch (e) {
      setError(e instanceof Error && e.message !== 'Failed to fetch' ? e.message : 'Sem confirmação. Repita com a mesma referência.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="adm-surface p-5 space-y-4" aria-labelledby="pixup-title">
    <div className="flex items-center gap-2"><QrCode size={20} aria-hidden="true"/><h2 id="pixup-title" className="text-lg font-semibold">Pixup · Gerar PIX</h2></div>
    <p className="text-sm text-slate-600">Crie uma cobrança avulsa em reais. Gerar o código não credita a carteira de um jogador.</p>
    {configured === false && <p role="status" className="text-sm text-slate-600">Configure <code>PIXUP_CLIENT_ID</code> e <code>PIXUP_CLIENT_SECRET</code> no servidor e reinicie o aplicativo.</p>}
    <form onSubmit={submit} className="space-y-3">
      <fieldset disabled={Boolean(reference) || busy} className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Valor em reais<input required inputMode="decimal" maxLength={12} value={amount} onChange={e => setAmount(e.target.value)} placeholder="100,00" className="block w-full rounded-lg border p-2 mt-1"/></label>
        <label className="text-sm">Nome do pagador (opcional)<input maxLength={120} value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-lg border p-2 mt-1"/></label>
        <label className="text-sm">CPF ou CNPJ (opcional)<input inputMode="numeric" maxLength={20} value={document} onChange={e => setDocument(e.target.value)} className="block w-full rounded-lg border p-2 mt-1"/></label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {!result && <button disabled={busy || !configured} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Gerando…' : reference ? 'Tentar com a mesma referência' : 'Gerar PIX'}</button>}
      {reference && <p className="text-xs text-slate-500 break-all">Referência: {reference}</p>}
    </form>
    {result && <div className="space-y-3 border-t pt-4">
      <p className="text-sm">Cobrança {result.paymentStatus === 'pending' ? 'aguardando pagamento' : 'gerada'}.</p>
      {qrImage && <img src={qrImage} alt="QR Code da cobrança PIX" width={232} height={232}/>}
      {result.expiresAt && <p className="text-xs text-slate-600">Validade: {new Date(result.expiresAt).toLocaleString('pt-BR')}</p>}
      <label className="block text-sm">PIX Copia e Cola<textarea readOnly value={result.qrcode} className="block w-full rounded-lg border p-2 mt-1"/></label>
      <button type="button" onClick={() => navigator.clipboard.writeText(result.qrcode).then(() => setNotice('Código copiado.')).catch(() => setNotice('Selecione o código acima para copiar.'))} className="inline-flex gap-2 items-center rounded-lg border px-3 py-2 text-sm"><Copy size={16}/> Copiar PIX</button>
      <span className="ml-2 text-sm" role="status">{notice}</span>
    </div>}
    {reference && !busy && <button type="button" className="text-sm underline" onClick={() => {
      if (!result && !window.confirm('A cobrança anterior pode ter sido criada. Abrir um novo formulário?')) return;
      setReference(''); setResult(null); setError(''); setNotice(''); setQrImage(''); setAmount(''); setName(''); setDocument('');
    }}>Nova cobrança</button>}
    <details className="text-sm text-slate-600"><summary>Documentação Cash-in</summary>
      <p className="mt-2"><code>POST /v2/transactions/cashin</code> · Bearer · <code>currency: BRL</code>. A referência única evita cobrança duplicada em tentativas repetidas.</p>
      <a className="underline" href="https://dev.pixupbr.com/introduction" target="_blank" rel="noreferrer">Documentação oficial do Pixup</a>
    </details>
  </section>;
}
