import { readApiJson } from '../../lib/readApiJson';
import { AdminPixupAccount } from './AdminPixupAccount';
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { AdminPixupCashin } from './AdminPixupCashin';
import { AdminDotfyTab } from './AdminDotfyTab';

type Props = React.ComponentProps<typeof AdminDotfyTab>;
const providers = [
  { id: 'dotfy', name: 'Dotfy', logo: '/assets/gateways/dotfy.svg', status: 'Provedor', description: 'Depósitos e saques conforme roteamento.' },
  { id: 'pixup', name: 'Pixup', logo: '/assets/gateways/pixup.png', status: 'Cobranças avulsas', description: 'QR Code e PIX Copia e Cola pelo admin.' },
] as const;

export function AdminGateways(props: Props) {
  const [provider, setProvider] = useState<'dotfy' | 'pixup'>('pixup');
  const [routing, setRouting] = useState<{adminWithdrawalGateway:'pixup'|'dotfy';depositGateway:'pixup'|'dotfy';pixupCashoutConfigured:boolean;canChangeRouting:boolean;configured:boolean} | null>(null);
  const [draft, setDraft] = useState<'pixup'|'dotfy'>('dotfy');
  const [depositDraft,setDepositDraft] = useState<'pixup'|'dotfy'>('dotfy');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/pixup/config', { headers: { Authorization: `Bearer ${props.token}` }, signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(); const data = await readApiJson(r); if (!controller.signal.aborted) { setRouting(data); setDraft(data.adminWithdrawalGateway); setDepositDraft(data.depositGateway); } })
      .catch(() => { if (!controller.signal.aborted) setError('Não foi possível carregar o roteamento.'); });
    return () => controller.abort();
  }, [props.token]);
  async function save(e: React.FormEvent, operation: 'withdrawals' | 'deposits' = 'withdrawals') {
    e.preventDefault();
    if (!routing?.canChangeRouting || busy) return;
    const deposits = operation === 'deposits';
    const choice = deposits ? depositDraft : draft;
    if (choice === (deposits ? routing.depositGateway : routing.adminWithdrawalGateway)) return;
    setBusy(true);setError('');setNotice('');
    try {
      const r = await fetch(`/api/admin/gateways/${operation}`, {method:'PUT',headers:{Authorization:`Bearer ${props.token}`,'Content-Type':'application/json'},body:JSON.stringify({provider:choice})});
      const data = await readApiJson(r);
      if (!r.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setRouting({...routing,[deposits ? 'depositGateway' : 'adminWithdrawalGateway']:data.provider});
      setNotice(deposits ? 'Gateway atualizado para novas cobranças dos jogadores.' : 'Gateway atualizado para novas aprovações manuais.');
    } catch (e) {setError(e instanceof Error ? e.message : 'Não foi possível salvar.');}
    finally {setBusy(false);}
  }
  return <div className="adm-workspace gateway-workspace">
    <section className="gateway-overview" aria-labelledby="gateway-routing">
      <div><span className="gateway-eyebrow">Roteamento</span><h2 id="gateway-routing">Gateway dos saques manuais</h2><p>Saques automáticos continuam no Dotfy.</p></div>
      <form onSubmit={e=>save(e)} className="flex items-center flex-wrap gap-2">
        <select aria-label="Gateway dos saques manuais" className="rounded-lg border px-3 py-2 text-sm" value={draft} disabled={!routing?.canChangeRouting || busy} onChange={e=>setDraft(e.target.value === 'pixup' ? 'pixup' : 'dotfy')}>
          <option value="dotfy">Dotfy</option><option value="pixup" disabled={!routing?.pixupCashoutConfigured}>Pixup</option>
        </select>
        {routing?.canChangeRouting && <button disabled={busy || draft === routing.adminWithdrawalGateway} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar gateway'}</button>}
      </form>
      <div className="basis-full text-sm"><p>Atual: {routing ? (routing.adminWithdrawalGateway === 'pixup' ? 'Pixup' : 'Dotfy') : 'não verificado'}.</p>
        {routing && !routing.pixupCashoutConfigured && <p>Para habilitar Pixup, configure OAuth e a URL HTTPS do webhook.</p>}
        {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
      </div>
    </section>
    <section className="gateway-overview" aria-labelledby="gateway-deposits">
      <div><span className="gateway-eyebrow">Roteamento</span><h2 id="gateway-deposits">Gateway dos depósitos dos jogadores</h2>
        <p>Atual: {routing ? (routing.depositGateway === 'pixup' ? 'Pixup' : 'Dotfy') : 'não verificado'}. A troca vale para novos PIX.</p>
      </div>
      <form onSubmit={e=>save(e,'deposits')} className="flex flex-wrap gap-2">
        <select aria-label="Gateway dos depósitos" className="rounded-lg border px-3 py-2 text-sm" value={depositDraft} disabled={!routing?.canChangeRouting || busy} onChange={e=>setDepositDraft(e.target.value === 'pixup' ? 'pixup' : 'dotfy')}>
          <option value="dotfy">Dotfy</option><option value="pixup" disabled={!routing?.pixupCashoutConfigured}>Pixup</option>
        </select>
        {routing?.canChangeRouting && <button disabled={busy || depositDraft === routing.depositGateway} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-50">Salvar depósitos</button>}
      </form>
    </section>
    <div className="gateway-grid" role="group" aria-label="Selecionar gateway para visualizar">
      {providers.map(item => <button key={item.id} type="button" className="gateway-card" aria-pressed={provider === item.id} aria-controls="gateway-provider-content" onClick={() => setProvider(item.id)}>
        <span className="gateway-card-top"><img src={item.logo} alt={item.name}/><span className="gateway-badge">{item.status}</span></span>
        <span className="gateway-description">{item.description}</span>
        <span className="gateway-card-action">{provider === item.id ? 'Selecionado' : 'Abrir gateway'}<ArrowUpRight size={15} aria-hidden="true"/></span>
      </button>)}
    </div>
    <div id="gateway-provider-content">
      <div hidden={provider !== 'pixup'}>
        <p className="gateway-note"><LockKeyhole size={16} aria-hidden="true"/> O Pixup gera cobranças avulsas e pode processar depósitos dos jogadores e saques manuais conforme o roteamento acima.</p>
        {provider === 'pixup' && routing?.configured && <AdminPixupAccount token={props.token}/> }
        <AdminPixupCashin token={props.token}/>
      </div>
      <div hidden={provider !== 'dotfy'}>{provider === 'dotfy' && <AdminDotfyTab {...props}/>}</div>
    </div>
  </div>;
}
