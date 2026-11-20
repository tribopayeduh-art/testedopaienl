import React, { useState } from 'react';
import { Copy, Check, Share2, Users, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';
import { AffiliateInfo } from '../types';

interface ReferralCardProps {
  affiliateInfo: AffiliateInfo;
  onCopySuccess?: () => void;
  onOpenWithdraw?: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ affiliateInfo, onCopySuccess, onOpenWithdraw }) => {
  const [copied, setCopied] = useState(false);
  const [copyError,setCopyError]=useState('');
  const [sharing,setSharing]=useState(false);

  const handleCopy = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(affiliateInfo.referralLink);
    } catch {
      const input = document.createElement('textarea');
      input.value = affiliateInfo.referralLink;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      let success=false;
      try{document.body.appendChild(input);input.select();success=document.execCommand('copy')===true;}catch{}finally{input.remove();}
      if(!success){setCopyError('Não foi possível copiar. Selecione o link acima e copie manualmente.');return;}
    }
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const share=async()=>{if(!navigator.share){await handleCopy();return;}setSharing(true);try{await navigator.share({title:'Meu convite iNEX',text:'Acesse pelo meu link de convite.',url:affiliateInfo.referralLink});}catch(e:any){if(e.name!=='AbortError')setCopyError('Não foi possível compartilhar. Use a opção Copiar link.');}finally{setSharing(false);}};

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="affiliate-referral-card space-y-4">
      {/* Stats Overview Grid */}
      <div className="affiliate-commission-banner bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center justify-between text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold">Taxa de comissão da conta</span>
        </div>
        <span className="text-xs font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
          {affiliateInfo.revSharePercent == null ? 'Consultar regras' : `${affiliateInfo.revSharePercent}% configurado`}
        </span>
      </div>

      <div className="affiliate-stat-grid grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-[#E5E5E5] text-center flex flex-col justify-center min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-1.5 text-[#111111] shrink-0">
            <Users className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#737373] font-medium block truncate">Indicações</span>
          <span className="font-extrabold text-xs sm:text-sm md:text-base text-[#111111] truncate block">{affiliateInfo.indicationsCount}</span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-[#E5E5E5] text-center flex flex-col justify-center min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1.5 text-emerald-600 shrink-0">
            <Wallet className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#737373] font-medium block truncate">Depósitos da Rede</span>
          <span className="font-extrabold text-[11px] sm:text-xs md:text-sm text-emerald-600 truncate block" title={formatCurrency(affiliateInfo.totalNetworkDeposits || 0)}>
            {formatCurrency(affiliateInfo.totalNetworkDeposits || 0)}
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-[#E5E5E5] text-center flex flex-col justify-center min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-1.5 text-[#111111] shrink-0">
            <DollarSign className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#737373] font-medium block truncate">Comissão Total</span>
          <span className="font-extrabold text-[11px] sm:text-xs md:text-sm text-[#111111] truncate block" title={formatCurrency(affiliateInfo.commissionTotal)}>
            {formatCurrency(affiliateInfo.commissionTotal)}
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-[#E5E5E5] text-center flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1.5 text-emerald-600 shrink-0">
              <Wallet className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#737373] font-medium block truncate">Saldo de Afiliado</span>
            <span className="font-extrabold text-[11px] sm:text-xs md:text-sm text-emerald-700 truncate block" title={formatCurrency(affiliateInfo.affiliateBalance)}>
              {formatCurrency(affiliateInfo.affiliateBalance)}
            </span>
          </div>
          {onOpenWithdraw && (
            <button
              onClick={onOpenWithdraw}
              type="button"
              className="mt-1.5 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs w-full shrink-0"
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Sacar</span>
            </button>
          )}
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="affiliate-link-card bg-white text-[#111111] rounded-[24px] p-5 border border-[#E5E5E5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#111111] flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#737373]" />
            Meu link de indicação
          </span>
          <span className="text-[10px] font-mono font-bold uppercase bg-[#F5F5F5] text-[#111111] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
            {affiliateInfo.referralCode}
          </span>
        </div>

        <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-3 flex items-center justify-between gap-2">
          <input aria-label="Seu link de indicação" readOnly value={affiliateInfo.referralLink} onFocus={e=>e.currentTarget.select()} className="w-full min-w-0 bg-transparent text-xs text-[#111111] outline-none"/>
        </div>

        <div className="af-invite-actions"><button
          onClick={handleCopy}
          className={`w-full h-11 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            copied
              ? 'bg-[#111111] text-white'
              : 'bg-[#111111] text-white hover:bg-black active:scale-[0.98]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              Link copiado com sucesso!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2]" />
              Copiar link
            </>
          )}
        </button><button type="button" onClick={share} disabled={sharing} className="af-share-button"><Share2 size={16}/>{sharing?'Abrindo…':'Compartilhar convite'}</button></div>{copyError&&<p className="af-copy-error" role="alert">{copyError}</p>}
      </div>
    </div>
  );
};
