import { readApiJson } from '../lib/readApiJson';
import {InexLoader} from './InexLoader';
import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Loader2, ExternalLink, RefreshCw, Gamepad2, LayoutDashboard } from 'lucide-react';
import { GAME_ASSETS } from '../config/gameAssets';
import { User } from '../types';
import { setTrackedGame } from '../lib/gameTracking';

interface Props {
  user?: User;
  onBack: () => void;
  onDeposit?: () => void;
  onBalanceChange?: (balance: number) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const BubbleBlastPlayerView: React.FC<Props> = ({
  user,
  onBack,
  onDeposit,
  onBalanceChange,
  onShowToast,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'game' | 'lobby'>('game');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastHistoryIdRef = useRef<string | null>(null);

  const phone = user?.phone
    ? String(user.phone).replace(/\D/g, '')
    : user?.id
    ? `u_${user.id.substring(0, 10)}`
    : 'guest';

  // Sincroniza sessão e saldo com o motor local do Bubble Blast (tribopayeduh-art/bubbleblast01)
  useEffect(() => {
    try {
      localStorage.setItem('bb-demo-session-v1', phone);
      const userCents = Math.round((user?.balance ?? 100) * 100);
      localStorage.setItem(`bb-demo-wallet-v1-${phone}`, String(userCents));

      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('pg_auth_token') ||
        localStorage.getItem('paygateway_token') ||
        '';
      if (token) {
        localStorage.setItem('bb_token', token);
        document.cookie = `bb_session=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      const rawAccounts = localStorage.getItem('bb-demo-accounts-v1') || '{}';
      const accounts = JSON.parse(rawAccounts);
      accounts[phone] = {
        id: user?.id || 'demo-' + phone,
        phone,
        name: user?.name || 'Jogador',
        role: 'USER',
      };
      localStorage.setItem('bb-demo-accounts-v1', JSON.stringify(accounts));

      const priorHistory = JSON.parse(localStorage.getItem(`bb-demo-history-v1-${phone}`) || '[]');
      if (priorHistory.length > 0 && priorHistory[0]?.id) {
        lastHistoryIdRef.current = priorHistory[0].id;
      }
    } catch (_) {}
  }, [user, user?.id, user?.phone, phone]);

  useEffect(() => {
    setTrackedGame('g_bubble_blast', 'bubble_blast_player_view');
  }, []);

  // Wallet values always come from the authenticated server, never demo storage.
  const balanceCallback=useRef(onBalanceChange);balanceCallback.current=onBalanceChange;
  useEffect(()=>{
    if(!user?.id)return;
    let active=true,pending=false;
    const controller=new AbortController();
    const syncFromServer=async()=>{
      if(pending||!active)return;pending=true;
      try{
        const token=localStorage.getItem('pg_auth_token')||localStorage.getItem('paygateway_token')||localStorage.getItem('token');
        if(!token)return;
        const response=await fetch('/api/auth/me',{headers:{Authorization:'Bearer '+token},signal:controller.signal});
        if(!response.ok)return;const result=await readApiJson(response);const actual=result.user||result;
        if(active&&actual.id===user.id&&typeof actual.balance==='number')balanceCallback.current?.(actual.balance);
      }catch{}finally{pending=false;}
    };
    const interval=window.setInterval(syncFromServer,15000);
    window.addEventListener('focus',syncFromServer);window.addEventListener('inex-bubble-sync',syncFromServer);
    void syncFromServer();
    return()=>{active=false;controller.abort();window.clearInterval(interval);window.removeEventListener('focus',syncFromServer);window.removeEventListener('inex-bubble-sync',syncFromServer);};
  },[user?.id]);

  const buildUrl = (targetMode: 'game' | 'lobby') => {
    const base = targetMode === 'game' ? '/demo-game.html' : '/painel';
    const params = new URLSearchParams();
    params.set('embedded', '1');
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('pg_auth_token') ||
          localStorage.getItem('paygateway_token') ||
          localStorage.getItem('token') ||
          ''
        : '';
    if (token) params.set('token', token);
    if (typeof user?.balance === 'number') {
      params.set('balance', String(user.balance));
      const betCents = user.balance >= 10 ? 1000 : user.balance >= 5 ? 500 : 1000;
      params.set('betCents', String(betCents));
    }
    if (user?.id) params.set('uid', user.id);
    if (user?.name) params.set('name', user.name);
    if (user?.email) params.set('email', user.email);
    return `${base}?${params.toString()}`;
  };

  const [iframeSrc, setIframeSrc] = useState<string>(() => buildUrl('game'));

  const switchMode = (newMode: 'game' | 'lobby') => {
    setMode(newMode);
    setLoaded(false);
    setFailed(false);
    setIframeSrc(buildUrl(newMode));
  };

  const sendSessionToIframe = () => {
    if (!iframeRef.current?.contentWindow) return;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('pg_auth_token') ||
          localStorage.getItem('paygateway_token') ||
          localStorage.getItem('token') ||
          ''
        : '';
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          source: 'tribopay-parent',
          event: 'session',
          token,
          balance: Number(user?.balance || 0),
          user: user
            ? {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                balance: Number(user?.balance || 0),
              }
            : null,
        },
        '*'
      );
    } catch (_) {}
  };

  useEffect(() => {
    if (loaded) {
      sendSessionToIframe();
    }
  }, [user?.balance, loaded]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!event.data||event.origin!==window.location.origin||event.source!==iframeRef.current?.contentWindow) return;
      const data = event.data;

      if (data.source === 'bubble-blast-shell' || data.source === 'bubble-game') {
        if (data.event === 'ready') {
          sendSessionToIframe();
        }
        if (data.event === 'auth' && data.token) {
          try {
            localStorage.setItem('pg_auth_token', data.token);
            localStorage.setItem('paygateway_token', data.token);
            localStorage.setItem('token', data.token);
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              if (typeof data.user.balance === 'number' && onBalanceChange) {
                onBalanceChange(data.user.balance);
              }
            }
          } catch (_) {}
        }
        if(data.event==='balance')window.dispatchEvent(new Event('inex-bubble-sync'));
        if (data.event === 'round_finish') {
          if (data.win && Number(data.amount) > 0) {
            onShowToast(`🎉 Parabéns! Você ganhou R$ ${Number(data.amount).toFixed(2)} no Bubble Blast!`, 'success');
          } else if (data.result === 'lose') {
            onShowToast(`Rodada encerrada. Entrada de R$ ${Number(data.stake || 0).toFixed(2)}.`, 'info');
          }
          window.dispatchEvent(new Event('inex-bubble-sync'));
        }
        if (data.event === 'deposit') {
          if (onDeposit) {
            onDeposit();
          } else {
            onShowToast('Abra a tela de depósito para adicionar créditos.', 'info');
          }
        }
        if (data.event === 'exit') {
          onBack();
        }
      }
    };

    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [user, onBack, onDeposit, onBalanceChange, onShowToast]);

  const handleIframeLoad = () => {
    setLoaded(true);
    setFailed(false);
    sendSessionToIframe();
  };

  const handleReload = () => {
    setLoaded(false);
    setFailed(false);
    const separator = iframeSrc.includes('?') ? '&' : '?';
    setIframeSrc(`${iframeSrc}${separator}_t=${Date.now()}`);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#1a0e38] overflow-hidden select-none">
      {/* Top Floating Bar */}
      <div className="absolute top-3 left-3 right-3 z-[90] flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar ao Lobby"
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/15 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4 text-purple-400" />
          <span className="hidden sm:inline">Lobby</span>
        </button>

        {/* View toggle (Jogo / Painel) */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-lg">
          <button
            type="button"
            onClick={() => switchMode('game')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mode === 'game'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Partida</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('lobby')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mode === 'lobby'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel</span>
          </button>
          <button
            type="button"
            onClick={handleReload}
            aria-label="Recarregar jogo"
            className="p-1 rounded-full text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="https://jogarbubble.online"
            target="_blank"
            rel="noopener noreferrer"
            title="Acessar jogarbubble.online"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-all text-[11px] font-mono font-bold"
          >
            <span className="hidden sm:inline">jogarbubble.online</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative w-full h-full overflow-hidden">
        {!loaded && !failed && (
          <div className="absolute inset-0 z-[80] grid place-items-center bg-[#1a0e38] text-white">
            <div className="flex flex-col items-center gap-3">
              <InexLoader compact />
              <span className="text-xs font-bold text-purple-200">Carregando Bubble Blast...</span>
            </div>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-[80] grid place-items-center bg-[#1a0e38] p-6 text-white">
            <div className="max-w-xs text-center space-y-4">
              <p className="font-bold text-slate-200">Não foi possível carregar o jogo no iframe.</p>
              <button
                type="button"
                onClick={() => window.open('https://jogarbubble.online', '_blank')}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 text-xs font-black text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir jogarbubble.online
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Bubble Blast"
          className="w-full h-full border-0 bg-transparent"
          allow="autoplay; fullscreen; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
          onLoad={handleIframeLoad}
          onError={() => {
            setLoaded(true);
            setFailed(true);
          }}
        />
      </div>
    </div>
  );
};
