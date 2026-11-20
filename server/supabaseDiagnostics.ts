import type {RpcTransport} from './supabaseStore.ts';
export const REQUIRED_GAME_CONFIGS=['g_gen_dino','g_block_puzzle','g_zumbla','g_raspa_fortuna','g_subway_pay','g_bubble_blast','g_count_masters'];
type Check={name:string;ok:boolean;durationMs:number;code?:string};
// Read-only: never start rounds, touch wallets or create probe tombstones.
export async function diagnoseSupabase(rpc:RpcTransport){
 const checks:Check[]=[];let revisions=0;let integrity:Record<string,number>|undefined;
 const tasks:[string,any,(value:any)=>boolean][]=[
  ['inex_get_document',{p_collection:'_health',p_id:'probe'},v=>v===null||typeof v==='object'],
  ['inex_scan_collection',{p_collection:'gameConfigs',p_filters:[],p_after:'',p_limit:1},Array.isArray],
  ['inex_recent_documents',{p_collection:'gameBets',p_match:{},p_limit:1},Array.isArray],
  ['inex_user_by_email',{p_email:'inex-diagnostics-nonexistent@invalid.invalid'},v=>v===null||typeof v==='object'],
  ['inex_revision_snapshot',{},v=>{if(!v||Array.isArray(v)||typeof v!=='object')return false;revisions=Object.keys(v).length;return true;}],
  ['inex_admin_metrics',{},v=>!!v?.totals&&Array.isArray(v.daily)&&Array.isArray(v.hourly)],
  ['inex_admin_integrity',{},v=>{const keys=['negativePlayerWallets','negativeAffiliateWallets','betsWithoutCurrentUser','affiliatesWithoutCurrentUser','canonicalGameConfigs'];if(!v||!keys.every(k=>Number.isFinite(Number(v[k]))))return false;integrity=Object.fromEntries(keys.map(k=>[k,Number(v[k])]));return true;}],
  ...REQUIRED_GAME_CONFIGS.map(id=>[`config:${id}`,{p_collection:'gameConfigs',p_id:id},(v:any)=>!!v?.data&&!v.deleted] as [string,any,(value:any)=>boolean])
 ];
 // Bound concurrency so the diagnostic itself does not flood the database.
 let cursor=0;
 await Promise.all(Array.from({length:3},async()=>{while(cursor<tasks.length){const index=cursor++;const [name,params,valid]=tasks[index];const start=performance.now();try{const value=await rpc(name.startsWith('config:')?'inex_get_document':name,params);checks[index]={name,ok:valid(value),durationMs:Math.round(performance.now()-start)};}catch(e:any){checks[index]={name,ok:false,durationMs:Math.round(performance.now()-start),code:typeof e?.code==='string'?e.code:'CONNECTION_ERROR'};}}}));
 return {observedAt:new Date().toISOString(),provider:'supabase',readOnly:true,ok:checks.every(c=>c.ok),checks,revisionCollections:revisions,integrity};
}
