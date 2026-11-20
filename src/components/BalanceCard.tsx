import React, { useState } from 'react';
import { Eye, EyeOff, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';

interface BalanceCardProps {
  balance: number;
  walletBalance?: number;
  affiliateBalance?: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({balance,walletBalance=balance,affiliateBalance=0,onDeposit,onWithdraw,className=''}) => {const [show,setShow]=useState(true);const money=(n:number)=>show?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'••••';return <section className={`cupertino-balance ${className}`}><span className="wallet-currency">🇧🇷 Carteira em reais</span><div className="balance-caption">Saldo disponível <button aria-label={show?'Ocultar valores':'Mostrar valores'} onClick={()=>setShow(!show)}>{show?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><h2>{money(balance)}</h2><div className="balance-actions"><button onClick={onDeposit}><ArrowDownRight size={18}/>Adicionar</button><button onClick={onWithdraw}><ArrowUpRight size={18}/>Retirar</button></div><div className="balance-breakdown"><span>Carteira<strong>{money(walletBalance)}</strong></span><span>Comissões<strong>{money(affiliateBalance)}</strong></span></div></section>};