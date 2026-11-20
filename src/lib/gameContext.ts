export type AppContext = 'countmasters' | 'alliance-hub' | 'blockwin' | 'gen-dino' | 'raspa-fortuna' | 'subwaypay' | 'bubbleblast';

export const detectAppContext = (): AppContext => {
  const host = window.location.hostname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const site = new URLSearchParams(window.location.search).get('site')?.toLowerCase().replaceAll('_', '-');
  const pathname = window.location.pathname.toLowerCase();

  if(site==='countmasters'||site==='count-masters'||search.includes('game=count')||pathname.startsWith('/countmasters'))return 'countmasters';
  if (host.includes('goalliancehub')) return 'alliance-hub';
  if (
    host.includes('jogarbubble') || host.includes('bubbleswin') || host.includes('bubbleblast') ||
    host.includes('zumbla') || host.includes('zumblawin') || host.includes('zumblapay') ||
    site === 'bubbleblast' || site === 'bubble-blast' || site === 'bubble' || site === 'bubbles' || site === 'bubbles-win' ||
    site === 'jogarbubble' || site === 'zumbla' || site === 'zumblawin' || site === 'zumbla-win' ||
    search.includes('site=bubble') || search.includes('game=bubble') || search.includes('site=jogarbubble') ||
    search.includes('site=zumbla') || search.includes('game=zumbla') ||
    pathname.startsWith('/bubble') || pathname.startsWith('/zumbla')
  ) return 'bubbleblast';
  if (
    host.includes('joguesubway') || host.includes('subwaypay') || host.includes('subway') ||
    site === 'subway' || site === 'subwaypay' || site === 'subway-pay' || site === 'joguesubway' ||
    search.includes('site=subway') || search.includes('game=subway') || search.includes('site=joguesubway') ||
    pathname.startsWith('/subway')
  ) return 'subwaypay';
  if (
    host.includes('raspadinhaadasorte') || host.includes('raspadinha') || host.includes('raspafortuna') ||
    site === 'raspa-fortuna' || site === 'raspafortuna' || site === 'raspa' || site === 'raspadinha' || site === 'raspadinhaadasorte' ||
    search.includes('site=raspa') || search.includes('game=raspa') || search.includes('site=raspadinha') || search.includes('game=raspadinha') ||
    pathname.startsWith('/raspa') || pathname.startsWith('/raspadinha')
  ) return 'raspa-fortuna';
  if (
    site === 'gen-dino' || site === 'gendino' || site === 'dino' || site === 'dinopay' || site === 'dinoplay' || site === 'dinipay' ||
    host.includes('dinopay') || host.includes('dinoplay') || host.includes('dinipay') || host.includes('gendino') ||
    search.includes('site=dino') || search.includes('site=dinopay') || search.includes('site=dinoplay') || search.includes('site=gendino') || search.includes('site=gen-dino') ||
    search.includes('game=dino') || search.includes('game=dinopay') || search.includes('game=dinoplay') || search.includes('game=gendino') || search.includes('game=gen-dino') ||
    pathname.startsWith('/dinopay') || pathname.startsWith('/dinoplay') || pathname.startsWith('/dino') || pathname.startsWith('/gendino') || pathname.startsWith('/gen-dino') ||
    pathname.includes('gen-dino') || pathname.includes('/dino')
  ) return 'gen-dino';
  if (
    site === 'blockwin' || site === 'block-win' || host.includes('blockwinner') || host.includes('blockwinn.fun') || host.includes('blockwin') ||
    search.includes('site=blockwin') || search.includes('game=blockwin') || pathname.startsWith('/blockwin')
  ) return 'blockwin';
  return 'alliance-hub';
};

