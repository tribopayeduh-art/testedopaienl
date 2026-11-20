import {CurvedGameGallery} from './CurvedGameGallery';
import {CountMastersPlayerView} from './CountMastersPlayerView';
import {GameMetricsSheet} from './GameMetricsSheet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Game, User, AffiliateInfo } from '../types';
import { IGamingPlayerView } from './IGamingPlayerView';
import { GenDinoPlayerView } from './GenDinoPlayerView';
import { RaspaFortunaPlayerView } from './RaspaFortunaPlayerView';
import { SubwayPayPlayerView } from './SubwayPayPlayerView';
import { BubbleBlastPlayerView } from './BubbleBlastPlayerView';
import { GAME_ASSETS } from '../config/gameAssets';
import { setTrackedGame } from '../lib/gameTracking';
import { applyGameSEO } from '../lib/seo';
import {
  Search,
  Send,
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  CheckCircle2,
  BadgeDollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface GamesViewProps {
  games?: Game[];
  onPlayingChange?:(playing:boolean)=>void;
  user: User;
  affiliateInfo?: AffiliateInfo | null;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  onDeposit?: (gameId?: string) => void;
  onWithdraw?: () => void;
  onPlayGame?: (betAmount: number) => void;
  onBalanceChange?: (balance: number) => void;
  onOpenReferral?: () => void;
  onOpenProfile?: () => void;
}

interface GameCatalogItem {
  id: string;
  title: string;
  category: 'originais' | 'slots' | 'crash' | 'mesa';
  multiplier: string;
  badge?: 'POPULAR' | 'HOT' | 'NOVO' | 'EXCLUSIVO';
  playersOnline: number;
  image: string;
  accentColor: string;
}

const GAMES_LIST: GameCatalogItem[] = [
  {
    id: 'subwaypay',
    title: 'Subway Pay',
    category: 'originais',
    multiplier: 'x10.00',
    badge: 'NOVO',
    playersOnline: 412,
    image: '/assets/game-banners/subway-pay.webp',
    accentColor: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'blockwin',
    title: 'Block Win',
    category: 'originais',
    multiplier: 'x2.90',
    badge: 'EXCLUSIVO',
    playersOnline: 487,
    image: '/assets/game-banners/block-blast.webp',
    accentColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'gen-dino',
    title: 'GEN DINO',
    category: 'originais',
    multiplier: 'R$ 1 por moeda',
    badge: 'NOVO',
    playersOnline: 228,
    image: '/assets/game-banners/gen-dino.webp',
    accentColor: 'from-orange-500 to-cyan-600',
  },
  {
    id: 'raspa-fortuna',
    title: 'Raspa Fortuna',
    category: 'originais',
    multiplier: 'x10.00',
    badge: 'NOVO',
    playersOnline: 195,
    image: '/assets/game-banners/raspa-fortuna.webp',
    accentColor: 'from-emerald-600 to-green-950',
  },
  {
    id: 'bubbleblast',
    title: 'Bubble Blast',
    category: 'originais',
    multiplier: 'x5.00',
    badge: 'NOVO',
    playersOnline: 384,
    image: '/assets/game-banners/bubble-blast.webp',
    accentColor: 'from-purple-600 to-indigo-900',
  },
];

export const GamesView: React.FC<GamesViewProps> = ({
  games = [],
  onPlayingChange,
  user,
  affiliateInfo,
  onShowToast,
  onDeposit,
  onWithdraw,
  onPlayGame,
  onBalanceChange,
  onOpenReferral,
  onOpenProfile,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  useEffect(()=>{onPlayingChange?.(selectedGameId!==null);return()=>onPlayingChange?.(false);},[selectedGameId,onPlayingChange]);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'originais' | 'slots' | 'crash' | 'mesa'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metricsGame, setMetricsGame] = useState<GameCatalogItem | null>(null);

  const referralCode = user?.referralCode || (user?.id ? user.id.substring(0, 8).toUpperCase() : '') || 'BLOCK';
  const catalogGames = useMemo<GameCatalogItem[]>(() => {
    const builtinAliases = new Set([
      'countmasters','count-masters','g_count_masters',
      'blockwin', 'block-puzzle', 'g_block', 'g_block_puzzle',
      'gen-dino', 'gen_dino', 'g_gen_dino',
      'raspa-fortuna', 'raspa_fortuna', 'g_raspa_fortuna', 'raspafortuna',
      'subwaypay', 'subway-pay', 'subway_pay', 'g_subway_pay', 'g-subway-pay',
      'bubbleblast', 'bubble-blast', 'bubble_blast', 'g_bubble_blast', 'bubbles', 'bubbles-win'
    ]);
    const dynamicGames = games
      .filter((game) => !builtinAliases.has(String(game.id).toLowerCase()))
      .map((game) => ({
        id: game.id,
        title: game.name,
        category: (['originais', 'slots', 'crash', 'mesa'].includes(String(game.category).toLowerCase())
          ? String(game.category).toLowerCase()
          : 'originais') as GameCatalogItem['category'],
        multiplier: 'Disponível',
        playersOnline: 0,
        image: game.imageUrl,
        accentColor: 'from-slate-700 to-slate-950',
      }));
    return [...GAMES_LIST, ...dynamicGames];
  }, [games]);

  const handleIndicateGame = async (e: React.MouseEvent | undefined, game: GameCatalogItem) => {
    e?.stopPropagation();
    const normalizedGame = normalizeGameId(game.id);
    const gameDomain = normalizedGame === 'raspa-fortuna'
      ? 'https://raspadinhaadasorte.site'
      : normalizedGame === 'gen-dino'
        ? 'https://dinopay.site'
        : normalizedGame === 'blockwin'
          ? 'https://blockwinner.site'
          : normalizedGame === 'subwaypay'
            ? 'https://joguesubway.surf'
            : normalizedGame === 'bubbleblast'
              ? 'https://jogarbubble.online'
              : window.location.origin;
    const gameReferralUrl = `${gameDomain}/cadastro?ref=${encodeURIComponent(referralCode)}&game=${encodeURIComponent(normalizedGame)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(gameReferralUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = gameReferralUrl;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('copy_failed');
      }
      const commPercent = affiliateInfo?.revSharePercent ?? 70;
      onShowToast(`Link de indicação do ${game.title} copiado! Comissão configurada: ${commPercent}%.`, 'success');
    } catch {
      window.prompt(`Copie seu link de indicação do ${game.title}:`, gameReferralUrl);
      onShowToast('Seu link está pronto para copiar.', 'info');
    }
  };

  const filteredGames = catalogGames.filter((game) => {
    const matchesCategory = activeCategory === 'todos' || game.category === activeCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (selectedGameId) {
      applyGameSEO(selectedGameId);
    } else {
      applyGameSEO('alliance-hub');
    }
    return () => {
      applyGameSEO('alliance-hub');
    };
  }, [selectedGameId]);

  const normalizeGameId = (rawId: string) => {
    const id = String(rawId || '').trim().toLowerCase().replace(/_/g, '-');
    if (['countmasters','count-masters','g-count-masters'].includes(id)) return 'countmasters';
    if (['blockwin', 'block-puzzle', 'g-block', 'g-block-puzzle'].includes(id)) return 'blockwin';
    if (['gen-dino', 'gendino', 'g-gen-dino'].includes(id)) return 'gen-dino';
    if (['raspa-fortuna', 'raspafortuna', 'raspa_fortuna', 'g-raspa-fortuna'].includes(id)) return 'raspa-fortuna';
    if (['subwaypay', 'subway-pay', 'subway_pay', 'g-subway-pay', 'g_subway_pay', 'subway'].includes(id)) return 'subwaypay';
    if (['bubbleblast', 'bubble-blast', 'bubble_blast', 'g-bubble-blast', 'g_bubble_blast', 'bubbles', 'bubbles-win', 'bubble'].includes(id)) return 'bubbleblast';
    return rawId;
  };

  const indicationMatchesGame = (lastGameId: string | undefined, gameId: string) => {
    if (!lastGameId) return false;
    return normalizeGameId(lastGameId) === normalizeGameId(gameId);
  };

  const getGameAffiliateMetrics = (game: GameCatalogItem) => {
    const indications = affiliateInfo?.indications || [];
    const matched = indications.filter((item) => indicationMatchesGame(item.lastGameId, game.id));
    const influencers = matched.filter((item) => item.isInfluencer);
    const directPlayers = matched.filter((item) => !item.isInfluencer);
    const registrations = influencers.reduce((total, item) => total + Number(item.subReferralsCount || 0), 0) + directPlayers.length;
    const ftds = influencers.reduce((total, item) => total + Number(item.ftdCount || 0), 0) + directPlayers.filter((item) => Number(item.totalDeposited || 0) > 0).length;
    const deposits = influencers.reduce((total, item) => total + Number(item.subNetworkDeposits || 0), 0) + directPlayers.reduce((total, item) => total + Number(item.totalDeposited || 0), 0);
    return {
      registrations,
      ftds,
      influencers: influencers.length,
      deposits,
      conversion: registrations > 0 ? (ftds / registrations) * 100 : 0,
      rows: matched,
    };
  };

  const launchGame = (game: GameCatalogItem) => {
    const normalizedId = normalizeGameId(game.id);
    setSelectedGameId(normalizedId);
    if (normalizedId) {
      setTrackedGame(normalizedId, 'lobby_launch_click');
    }
  };

  // If a game is explicitly selected by clicking "JOGAR", show that specific game view with a Back button
  if (selectedGameId === 'blockwin') {
    return (
      <div className="relative">
        {/* Top Back Navigation Bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setSelectedGameId(null)}
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#111111] font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#111111]" />
            <span>Voltar ao Lobby de Jogos</span>
          </button>

          <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Block Win
          </span>
        </div>

        <IGamingPlayerView
          user={user}
          onDeposit={() => {
            if (onDeposit) onDeposit('g_block_puzzle');
            else onShowToast('Abre o modal de depósito PIX.', 'info');
          }}
          onWithdraw={() => {
            if (onWithdraw) onWithdraw();
            else onShowToast('Abre o modal de saque PIX.', 'info');
          }}
          onPlayGame={(betAmount) => {
            if (onPlayGame) {
              onPlayGame(betAmount);
            } else {
              onShowToast(`Aposta de R$ ${betAmount.toFixed(2)} iniciada!`, 'success');
            }
          }}
          onOpenReferral={() => {
            if (onOpenReferral) onOpenReferral();
            else onShowToast('Área de indicação.', 'info');
          }}
          onOpenProfile={() => {
            if (onOpenProfile) onOpenProfile();
            else onShowToast('Perfil do usuário.', 'info');
          }}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  if (normalizeGameId(selectedGameId || '') === 'subwaypay') {
    return (
      <SubwayPayPlayerView
        user={user}
        onBack={() => setSelectedGameId(null)}
        onDeposit={() => onDeposit?.('g_subway_pay')}
        onBalanceChange={(balance) => onBalanceChange?.(balance)}
        onShowToast={onShowToast}
      />
    );
  }

  if (normalizeGameId(selectedGameId || '') === 'gen-dino') {
    return (
      <GenDinoPlayerView
        user={user}
        onBack={() => setSelectedGameId(null)}
        onBalanceChange={(balance) => onBalanceChange?.(balance)}
        onShowToast={onShowToast}
      />
    );
  }

  if (normalizeGameId(selectedGameId || '') === 'raspa-fortuna') {
    return (
      <RaspaFortunaPlayerView
        user={user}
        onBack={() => setSelectedGameId(null)}
        onDeposit={() => onDeposit?.('g_raspa_fortuna')}
        onBalanceChange={(balance) => onBalanceChange?.(balance)}
        onShowToast={onShowToast}
      />
    );
  }

  if (normalizeGameId(selectedGameId || '') === 'bubbleblast') {
    return (
      <BubbleBlastPlayerView
        user={user}
        onBack={() => setSelectedGameId(null)}
        onDeposit={() => onDeposit?.('g_bubble_blast')}
        onBalanceChange={(balance) => onBalanceChange?.(balance)}
        onShowToast={onShowToast}
      />
    );
  }

  if(selectedGameId==='countmasters')return <CountMastersPlayerView user={user} onBack={()=>setSelectedGameId(null)} onBalanceChange={onBalanceChange} onDeposit={()=>onDeposit?.('g_count_masters')}/>;

  // If another game ID is selected
  if (selectedGameId !== null && selectedGameId !== 'blockwin') {
    const selectedGame = catalogGames.find((g) => g.id === selectedGameId);
    return (
      <div className="min-h-screen bg-slate-50 text-[#111111] p-4 flex flex-col items-center justify-center space-y-6">
        <button
          onClick={() => setSelectedGameId(null)}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[#111111] font-mono text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
          <span>Voltar ao Lobby de Jogos</span>
        </button>

        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={selectedGame?.image} alt={selectedGame?.title} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-black font-mono text-[#111111]">{selectedGame?.title}</h2>
          <p className="text-xs text-slate-600 font-mono">
            Multiplicador de até <strong className="text-amber-600 font-bold">{selectedGame?.multiplier}</strong>
          </p>
          <button
            type="button"
            onClick={() => {
              if (onPlayGame) onPlayGame(10);
              else onShowToast(`Entrando no jogo ${selectedGame?.title}...`, 'success');
            }}
            className="w-full py-3.5 bg-[#111111] hover:bg-black text-white font-bold font-mono text-sm rounded-2xl uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Iniciar Rodada
          </button>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'originais', label: 'Originais' },
    { id: 'crash', label: 'Crash' },
    { id: 'slots', label: 'Slots' },
    { id: 'mesa', label: 'Mesa' },
  ];

  const availableCategories=categories.filter(c=>c.id==='todos'||catalogGames.some(g=>g.category===c.id));
  return <div className="games-view clean-section games-clean"><header className="clean-heading"><div><span>EXPLORE O CATÁLOGO</span><h1>Jogos<span>.</span></h1><p>Encontre, acompanhe e compartilhe.</p></div><span className="clean-count">{catalogGames.length} jogos</span></header><section className="clean-game-toolbar"><label className="clean-search"><Search size={17}/><input type="search" aria-label="Buscar jogos" placeholder="Qual jogo você procura?" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>{searchQuery&&<button onClick={()=>setSearchQuery('')} aria-label="Limpar busca"><X size={15}/></button>}</label><div className="clean-tabs" aria-label="Categorias de jogos">{availableCategories.map(c=><button key={c.id} aria-pressed={activeCategory===c.id} className={activeCategory===c.id?'active':''} onClick={()=>setActiveCategory(c.id as typeof activeCategory)}>{c.label}</button>)}</div></section><div className="clean-catalog-heading"><h2>{activeCategory==='todos'?'Todos os jogos':categories.find(c=>c.id===activeCategory)?.label}</h2><span>{filteredGames.length} disponíveis</span></div>{filteredGames.length?<CurvedGameGallery>{filteredGames.map((game,index)=><article className="curved-game-slot" key={game.id}><div className="curved-game-surface"><button type="button" className="curved-game-banner" aria-label={`Jogar ${game.title}`} onClick={()=>launchGame(game)}><img className="curved-game-art" src={game.image} alt="" width={1932} height={814} loading={index===0?'eager':'lazy'} decoding="async"/></button><footer className="curved-game-footer"><div><h3>{game.title}</h3><p>{categories.find(c=>c.id===game.category)?.label||game.category}</p></div><nav aria-label={`Ações de ${game.title}`}><button onClick={e=>void handleIndicateGame(e,game)}><Send size={13}/>Indicar</button><button onClick={()=>setMetricsGame(game)} aria-label={`Ver métricas de ${game.title}`}><TrendingUp size={15}/><span>Métricas</span></button></nav></footer></div></article>)}</CurvedGameGallery>:<div className="clean-empty"><Search size={28}/><h3>Nenhum jogo encontrado</h3><p>Tente outro nome ou escolha outra categoria.</p><button onClick={()=>{setSearchQuery('');setActiveCategory('todos')}}>Limpar filtros</button></div>}
        {metricsGame && <GameMetricsSheet game={metricsGame} metrics={getGameAffiliateMetrics(metricsGame)} onClose={()=>setMetricsGame(null)} onShare={()=>void handleIndicateGame(undefined,metricsGame)}/>}
</div>;
};
