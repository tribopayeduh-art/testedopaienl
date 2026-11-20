import React, { useState, useMemo } from 'react';
import { X, Download, Copy, Check, Users, MessageCircle, FileSpreadsheet } from 'lucide-react';
import { User } from '../../types';

interface AdminExportInfluencersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  initialMode?: 'all' | 'whatsapp' | 'instagram' | string;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminExportInfluencersModal: React.FC<AdminExportInfluencersModalProps> = ({
  isOpen,
  onClose,
  users,
  initialMode = 'all',
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState<string>(initialMode);

  const eligibleUsers = useMemo(() => {
    return (users || []).filter(u => {
      if (exportMode === 'whatsapp') return !!u.phone;
      return true;
    });
  }, [users, exportMode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const lines = eligibleUsers.map(u => `${u.name || 'Sem nome'}\t${u.email || ''}\t${u.phone || ''}\t${u.referralCode || ''}`);
    const text = ['Nome\tEmail\tTelefone\tCódigo', ...lines].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onShowToast) onShowToast(`${eligibleUsers.length} contatos copiados!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const lines = eligibleUsers.map(u => `"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.referralCode || ''}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + ['"Nome","Email","Telefone","Código"', ...lines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `influenciadores_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('Arquivo CSV baixado!', 'success');
  };

  return (
    <div className="inex-operation-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={20} />
            <h3 className="text-base font-bold text-white">Exportar Contatos e Influenciadores</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setExportMode('all')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${exportMode === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Todos ({users?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setExportMode('whatsapp')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${exportMode === 'whatsapp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Com WhatsApp ({users?.filter(u => !!u.phone).length || 0})
          </button>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 max-h-56 overflow-y-auto divide-y divide-zinc-800/40 text-xs">
          {eligibleUsers.slice(0, 50).map(u => (
            <div key={u.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{u.name || 'Sem nome'}</p>
                <p className="text-zinc-400 text-[11px]">{u.email}</p>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">{u.phone || '—'}</span>
            </div>
          ))}
          {eligibleUsers.length > 50 && (
            <div className="pt-2 text-center text-zinc-500 text-[11px]">
              + {eligibleUsers.length - 50} outros contatos prontos para exportação.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Download size={14} />
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
