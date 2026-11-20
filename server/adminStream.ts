import type {Request,Response} from 'express';
import {adminEvents,notifyAdminCollections,ADMIN_COLLECTIONS} from './adminEvents.ts';
import {getServerSupabaseClient,getSupabaseTransport} from './supabaseStore.ts';
let clients=0,channel:any,timer:ReturnType<typeof setInterval>|undefined,snapshot:Record<string,string>|null=null,polling=false,mode:'realtime'|'fallback'|'offline'='fallback';
function status(next:typeof mode){if(mode!==next){mode=next;adminEvents.emit('status',mode);}}
export function changedCollections(previous:Record<string,string>|null,next:Record<string,string>){return Object.keys(next).filter(k=>!previous||next[k]!==previous[k]);}
async function poll(){if(polling||!clients)return;polling=true;try{const next=await getSupabaseTransport()('inex_revision_snapshot',{});notifyAdminCollections(changedCollections(snapshot,next));snapshot=next;if(mode==='offline')status('fallback');}catch{status('offline');}finally{polling=false;}}
function start(){clients++;if(clients!==1)return;void poll();timer=setInterval(()=>void poll(),10000);timer.unref();try{const client=getServerSupabaseClient();channel=client.channel('inex-admin-internal').on('postgres_changes',{event:'*',schema:'public',table:'inex_collection_revisions'},(payload:any)=>{const row=payload.new||payload.old;if(typeof row?.collection_id==='string'){notifyAdminCollections([row.collection_id]);if(snapshot)snapshot[row.collection_id]=String(row.revision);}status('realtime');}).subscribe((s:string)=>{status(s==='SUBSCRIBED'?'realtime':'fallback');});}catch{status('fallback');}}
function stop(){clients--;if(clients>0)return;clients=0;if(timer)clearInterval(timer);timer=undefined;snapshot=null;if(channel){void getServerSupabaseClient().removeChannel(channel);channel=undefined;}mode='fallback';}
export async function attachAdminStream(_req:Request,res:Response,authorized:()=>Promise<boolean>){
 res.status(200).set({'Content-Type':'text/event-stream','Cache-Control':'no-store, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
 let closed=false,checking=false;const pending=new Set<string>();let flush:ReturnType<typeof setTimeout>|undefined;
 const send=(type:string,data:any)=>{if(closed)return;try{if(!res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`))close();}catch{close();}};
 const onStatus=()=>send('connection',{mode,observedAt:new Date().toISOString()});
 const onChange=(collections:string[])=>{collections.filter(c=>ADMIN_COLLECTIONS.has(c)).forEach(c=>pending.add(c));if(!flush)flush=setTimeout(()=>{flush=undefined;send('update',{collections:[...pending],observedAt:new Date().toISOString()});pending.clear();},250);};
 const heartbeat=setInterval(async()=>{if(checking||closed)return;checking=true;try{if(!await authorized()){send('expired',{});close();return;}send('connection',{mode,observedAt:new Date().toISOString()});}catch{send('connection',{mode:'offline'});}finally{checking=false;}},15000);heartbeat.unref();
 const close=()=>{if(closed)return;closed=true;clearInterval(heartbeat);if(flush)clearTimeout(flush);adminEvents.off('change',onChange);adminEvents.off('status',onStatus);stop();res.end();};
 adminEvents.on('change',onChange);adminEvents.on('status',onStatus);res.on('close',close);start();onStatus();send('update',{collections:[...ADMIN_COLLECTIONS],observedAt:new Date().toISOString()});
}
