import React,{useEffect,useRef} from 'react';
import '../styles/curved-gallery.css';
export function CurvedGameGallery({children}:{children:React.ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=root.current;if(!el)return;const media=matchMedia('(prefers-reduced-motion: reduce)');let raf=0;const visible=new Set<Element>();const reset=()=>el.querySelectorAll<HTMLElement>('.curved-game-surface').forEach(n=>{n.style.removeProperty('transform');});
 const update=()=>{raf=0;if(media.matches){reset();return;}const height=window.innerHeight;for(const card of visible){const box=card.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(box.top+box.height*.5-height*.5)/(height*.7)));const surface=card.querySelector<HTMLElement>('.curved-game-surface');if(surface)surface.style.transform=`translateZ(${-Math.abs(progress)*36}px) rotateX(${-progress*13}deg) scale(${1-Math.abs(progress)*.028})`;}};
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);});schedule();},{rootMargin:'140px 0px'});el.querySelectorAll('.curved-game-slot').forEach(n=>observer.observe(n));
 window.addEventListener('scroll',schedule,{capture:true,passive:true});window.addEventListener('resize',schedule,{passive:true});media.addEventListener('change',schedule);schedule();return()=>{observer.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);media.removeEventListener('change',schedule);cancelAnimationFrame(raf);reset();};
 },[children]);
 return <div ref={root} className="curved-game-gallery">{children}</div>;
}
