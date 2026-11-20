import {useEffect} from 'react';
/** Keep full-screen workspaces inside the viewport left visible by the mobile keyboard. */
export function useWorkspaceMobile(kind:'admin'|'partner',section:string){
 useEffect(()=>{
  const body=document.body,v=window.visualViewport;
  let baselineHeight=window.innerHeight;
  const update=()=>{
   const height=v?.height||window.innerHeight;
   body.style.setProperty('--ws-visible-height',`${Math.round(height)}px`);
   const a=document.activeElement;
   const editing=a instanceof HTMLElement&&a.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable=true]');
   if(!editing)baselineHeight=window.innerHeight;
   body.classList.toggle('ws-keyboard-open',!!(window.innerWidth<900&&editing&&Math.max(baselineHeight,window.innerHeight)-height>140&&(v?.scale||1)<1.1));
  };
  const focus=(event:FocusEvent)=>{update();const t=event.target;if(window.innerWidth<768&&t instanceof HTMLElement&&t.matches('input,textarea,select'))requestAnimationFrame(()=>{if(t===document.activeElement)t.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});});};
  update();v?.addEventListener('resize',update);window.addEventListener('resize',update);document.addEventListener('focusin',focus);document.addEventListener('focusout',update);
  return()=>{v?.removeEventListener('resize',update);window.removeEventListener('resize',update);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',update);body.classList.remove('ws-keyboard-open');body.style.removeProperty('--ws-visible-height');};
 },[kind]);
 useEffect(()=>{
  const main=document.querySelector<HTMLElement>(kind==='admin'?'.admin-minimal main':'.partner-minimal .pc-content');if(!main)return;
  document.querySelectorAll<HTMLDetailsElement>('.adm-header-more[open]').forEach(menu=>{menu.open=false;});
  main.scrollTo({top:0,behavior:'auto'});main.classList.remove('ws-panel-enter');
  const frame=requestAnimationFrame(()=>main.classList.add('ws-panel-enter'));return()=>cancelAnimationFrame(frame);
 },[kind,section]);
}
