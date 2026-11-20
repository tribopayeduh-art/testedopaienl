import { readApiJson } from '../lib/readApiJson';
import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from '../components/AdminPanel';
import { InexBoot } from '../components/InexBoot';
import { InexLoader } from '../components/InexLoader';
import type { User } from '../types';
import { canAccessAdmin } from './permissions';
import '../index.css';
import '../styles/ios-wallet.css';
import '../styles/clean-panels.css';
import '../styles/workspaces.css';

const keys = ['pg_auth_token', 'paygateway_token', 'token'];
function clearSession() { for (const key of keys) { localStorage.removeItem(key); sessionStorage.removeItem(key); } }
function AdminApp() {
  const [token, setToken] = useState(() => keys.map(key => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || '');
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{message: string; type: string} | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) { setChecking(false); setUser(null); return; }
    const controller = new AbortController();
    let active = true;
    const validate = async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (res.status === 401 || res.status === 403) { clearSession(); setToken(''); setUser(null); throw new Error('Sessão expirada ou acesso bloqueado. Entre novamente.'); }
        if (!res.ok) throw new Error('Não foi possível validar sua sessão. Tente novamente.');
        const account = await readApiJson(res);
        if (!canAccessAdmin(account)) { setUser(null); throw new Error('Esta conta não possui permissão administrativa.'); }
        if (active) { setUser(account); setError(''); }
      } catch (err) { if (active && !controller.signal.aborted) { setUser(null); setError(err instanceof Error ? err.message : 'Falha ao validar sessão.'); } }
      finally { if (active) setChecking(false); }
    };
    void validate();
    const focus = () => { void validate(); };
    window.addEventListener('focus', focus);
    return () => { active = false; controller.abort(); window.removeEventListener('focus', focus); };
  }, [token, retry]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: form.get('email'), password: form.get('password')}) });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || data.message || 'Não foi possível entrar.');
      if (!data.token || !canAccessAdmin(data.user)) throw new Error('Esta conta não possui permissão administrativa.');
      keys.forEach(key => localStorage.setItem(key, data.token));
      setChecking(true); setToken(data.token);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao entrar.'); }
    finally { setBusy(false); }
  }
  if (checking) return <InexLoader fullScreen label="Validando acesso administrativo"/>;
  return <>
    {user ? <AdminPanel currentUser={user} token={token} onClose={() => window.location.assign('/')} onShowToast={(message, type) => setNotice({message,type})}/> :
    <main className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-5">
      <section className="w-full max-w-sm rounded-3xl bg-white border border-black/5 p-7 shadow-sm space-y-5">
        <img src="/inex-logo.svg" alt="iNEX" className="h-10 mx-auto"/>
        <header><h1 className="text-2xl font-semibold">Administração</h1><p className="text-sm text-neutral-500 mt-2">Acesso exclusivo para administradores.</p></header>
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{error}</p>}
        {token ? <div className="space-y-3"><button className="w-full rounded-xl bg-black text-white p-3" onClick={() => {setChecking(true);setRetry(n=>n+1);}}>Tentar novamente</button><button className="w-full p-3" onClick={() => {clearSession();setToken('');setError('');}}>Entrar com outra conta</button></div> :
        <form onSubmit={login} className="space-y-4">
          <label className="block text-sm">E-mail<input name="email" type="email" autoComplete="username" required className="mt-2 border border-neutral-200 rounded-xl p-3 w-full"/></label>
          <label className="block text-sm">Senha<input name="password" type="password" autoComplete="current-password" required className="mt-2 border border-neutral-200 rounded-xl p-3 w-full"/></label>
          <button disabled={busy} className="w-full rounded-xl bg-black text-white p-3 disabled:opacity-50">{busy ? 'Validando…' : 'Entrar no admin'}</button>
        </form>}
        <a href="/" className="block text-center text-sm text-neutral-500">Voltar à plataforma</a>
      </section>
    </main>}
    {notice && <div role={notice.type === 'error' ? 'alert' : 'status'} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] rounded-2xl bg-neutral-900 text-white px-5 py-3 shadow-lg max-w-[90vw]">{notice.message}</div>}
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><InexBoot><AdminApp/></InexBoot></StrictMode>);

import '../styles/admin-minimal.css';
