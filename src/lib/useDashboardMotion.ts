import {useEffect,useRef} from 'react';
/** Progressive enhancement: content stays visible without animation or observer support. */
export function useDashboardMotion(scope:string){
 const root=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  const node=root.current;if(!node||!window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)').matches||!('IntersectionObserver' in window))return;
  const seen=new WeakSet<Element>(),animations=new Set<Animation>();let stopped=false;
  const observer=new IntersectionObserver(entries=>{let order=0;for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(stopped||!entry.target.animate)continue;const animation=entry.target.animate([{opacity:.55,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:440,delay:Math.min(order++*45,180),easing:'cubic-bezier(.22,1,.36,1)'});animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));}},{threshold:.04});
  const scan=()=>{node.querySelectorAll('.pn-card,.pn-kpis>*,.affiliate-ops-kpis>*,.affiliate-ranking-card,.affiliate-operations-center,.affiliate-hub-overview,.pix-audit-card').forEach(el=>{if(!seen.has(el)){seen.add(el);observer.observe(el);}});};
  scan();const mutation=new MutationObserver(scan);mutation.observe(node,{childList:true,subtree:true});
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(motion.matches){stopped=true;observer.disconnect();animations.forEach(a=>a.cancel());}};motion.addEventListener('change',stop);
  return()=>{stopped=true;observer.disconnect();mutation.disconnect();motion.removeEventListener('change',stop);animations.forEach(a=>a.cancel());};
 },[scope]);return root;
}
