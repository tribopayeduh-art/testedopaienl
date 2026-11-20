import React from 'react';
import { ArrowUpRight, Layers3, Wallet, Network, ArrowRightLeft } from 'lucide-react';

/** Decorative product illustration; contains no account balances or simulated results. */
export const LoginShowcase: React.FC = () => (
  <aside className="inex-login-showcase" aria-label="Conheça a iNEX">
    <div className="inex-login-showcase-top"><span className="inex-login-wordmark">iNEX<span>®</span></span><span className="inex-login-top-label">Seu espaço de operações</span></div>
    <div className="inex-login-editorial"><span className="inex-login-kicker"><span/> CONEXÕES QUE MOVEM</span><h2>Mais clareza.<br/>Mais controle.<br/><em>Mais possibilidades.</em></h2><p>Carteira, rede e comissões.<br/>Tudo conectado em uma experiência simples.</p></div>
    <div className="inex-login-art" aria-hidden="true">
      <div className="inex-login-orbit inex-login-orbit-one"/><div className="inex-login-orbit inex-login-orbit-two"/>
      <div className="inex-login-mini inex-login-mini-network"><Network size={18}/><span>Sua rede<strong>Conexões em um só lugar</strong></span><ArrowUpRight size={16}/></div>
      <div className="inex-login-product-card"><div><span className="inex-login-card-icon"><Layers3 size={23}/></span><span>iNEX / workspace</span><ArrowUpRight size={20}/></div><p>Uma visão completa<br/>da sua operação.</p><footer><span><Wallet size={14}/> Carteira</span><span><ArrowRightLeft size={14}/> Movimentações</span></footer></div>
      <span className="inex-login-art-dot"/>
    </div>
    <footer className="inex-login-showcase-footer"><span>Menos complexidade. Mais foco.</span><span>iNEX · Plataforma de operações</span></footer>
  </aside>
);
