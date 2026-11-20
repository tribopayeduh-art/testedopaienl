import { readApiJson } from '../../lib/readApiJson';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { GameUser } from '../types';
import './block-entry.css';

type Entry = 'home' | 'login' | 'register';
export function BlockEntry({ mode, navigate, onSuccess, refCode, signedIn, onPlay }: {
  mode: Entry; navigate: (mode: Entry) => void; signedIn: boolean; onPlay: () => void;
  refCode: string; onSuccess: (user: GameUser, token: string) => void;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const register = mode === 'register';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    const raw = contact.trim();
    const emailLogin = !register && raw.includes('@');
    const phone = raw.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    if ((!emailLogin && (!/^[+\d ()-]+$/.test(raw) || !/^\d{10,11}$/.test(phone))) || (emailLogin && !/^\S+@\S+\.\S+$/.test(raw))) {
      setError(register ? 'Informe um telefone válido com DDD.' : 'Informe seu telefone com DDD ou um e-mail válido.');
      return;
    }
    if (register && name.trim().length < 2) {
      setError('Informe seu nome.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(register ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Game-Origin': 'g_block_puzzle', 'X-Game-Id': 'g_block_puzzle' },
        body: JSON.stringify(register
          ? { name: name.trim(), phone, password, refCode, registeredGame: 'g_block_puzzle', acquisitionGame: 'g_block_puzzle', game: 'g_block_puzzle', gameId: 'g_block_puzzle', trackingSource: 'game_register_blockwin' }
          : { login: emailLogin ? raw.toLowerCase() : phone, password }),
      });
      const result = await readApiJson(res).catch(() => null);
      if (!res.ok || !result?.user || !result?.token) {
        setError(result?.error || result?.message || 'Não foi possível concluir. Tente novamente.');
        return;
      }
      onSuccess(result.user, result.token);
    } catch {
      setError('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const logo = <img className="bw-entry-logo" src="/assets/games/block-win/entry-logo.png" alt="Block Win" width="80" height="80" />;
  return <div className={`bw-entry bw-entry--${mode}`}>
    {mode === 'home' ? <>
      <header>{logo}<div>{!signedIn && <><button onClick={() => navigate('login')}>Entrar</button><button onClick={() => navigate('register')}>Criar conta</button></>}</div></header>
      <div className="bw-hero">
        <h1>Encaixe os blocos</h1>
        <p>Complete linhas e colunas no tabuleiro do Block Win.</p>
        <button className="bw-primary" onClick={signedIn ? onPlay : () => navigate('register')}>{signedIn ? 'Jogar agora' : 'Jogar grátis'}</button>
        {!signedIn && <button className="bw-link" onClick={() => navigate('login')}>Já tenho conta →</button>}
      </div>
      <footer>18+ · Jogue com responsabilidade.</footer>
    </> : <>
      <button className="bw-back bw-link" disabled={busy} onClick={() => navigate('home')}>← Início</button>
      <div className="bw-auth-stack">{logo}
        <section className="bw-card" aria-labelledby="bw-title">
          <h1 id="bw-title">{register ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
          <p>{register ? 'Leva menos de 1 minuto. Jogue e saque via PIX.' : 'Entre para continuar jogando e resgatando.'}</p>
          <form onSubmit={submit}>
            {register && <input aria-label="Seu nome" placeholder="Seu nome" autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} />}
            <input aria-label={register ? 'Telefone com DDD' : 'Telefone com DDD ou e-mail'} placeholder={register ? 'Telefone com DDD (ex: 11 99999-0000)' : 'Telefone com DDD ou e-mail'} type={register ? 'tel' : 'text'} autoComplete={register ? 'tel-national' : 'username'} required maxLength={120} value={contact} onChange={e => setContact(e.target.value)} />
            <div className="bw-password">
              <input aria-label="Senha" placeholder={register ? 'Senha (mín. 6 caracteres)' : 'Sua senha'} type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 6 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
            {error && <div role="alert" className="bw-error">{error}</div>}
            <button className="bw-primary" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta grátis' : 'Entrar'}</button>
          </form>
          <div className="bw-switch">{register ? 'Já tem conta? ' : 'Ainda não tem conta? '}<button className="bw-link" disabled={busy} onClick={() => navigate(register ? 'login' : 'register')}>{register ? 'Entrar' : 'Cadastre-se grátis'}</button></div>
        </section>
      </div>
    </>}
  </div>;
}
