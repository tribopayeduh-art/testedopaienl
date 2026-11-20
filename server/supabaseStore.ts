import {notifyAdminCollections} from './adminEvents.ts';
import './environment.ts';
import crypto from 'node:crypto';
import { createClient,type SupabaseClient } from '@supabase/supabase-js';
if(process.env.DATABASE_PROVIDER && process.env.DATABASE_PROVIDER !== 'supabase') throw new Error('Esta versão usa somente Supabase.');
export const usingSupabase = true;
type Filter = { field: string; op: '=='|'array-contains'; value: any };
type RecordRow = { id: string; data: any; version: number; deleted?: boolean };
export type RpcTransport = (name: string, params: any) => Promise<any>;
let transport: RpcTransport | undefined;
let supabaseClient:SupabaseClient<any>|undefined;
export function getServerSupabaseClient(){getSupabaseTransport();return supabaseClient!;}
export function getSupabaseTransport(): RpcTransport {
 if (transport) return transport;
 const url=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret) throw Object.assign(new Error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY no .env do servidor. A chave pública não permite operações administrativas.'),{status:503});
 if(secret.startsWith('sb_publishable_')) throw new Error('Use uma chave secreta de servidor, nunca a chave pública, em SUPABASE_SECRET_KEY.');
 const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:init?.signal||AbortSignal.timeout(15000)})}});
 supabaseClient=client;
 transport=async(name,params)=>{
  const {data,error,status:upstreamStatus}=await client.rpc(name,params);
  if(error){
   const code=error.code||'SUPABASE_UNAVAILABLE';
   const status=code==='23505'||code==='40001'?409:code==='P0002'?404:503;
   const message=status===409?'Conflito ao salvar no banco.':status===404?'Registro não encontrado.':'Banco de dados temporariamente indisponível. Tente novamente em instantes.';
   console.warn('[Supabase] RPC falhou', {name,code,upstreamStatus});
   throw Object.assign(new Error(message),{code,status});
  }
  return data;
 };
 return transport;
}
function clean(value:any):any{return JSON.parse(JSON.stringify(value));}
function pathPart(value:string){if(!value||value.includes('/')||value.length>300)throw new Error('Referência de documento inválida.');return value;}
export class StoreSnapshot {
 constructor(public ref: StoreRef, private row:RecordRow, private native=false){}
 get id(){return this.ref.id;}
 get version(){return Number(this.row.version||0);}
 get present(){return this.row.data!==null&&!this.row.deleted;}
 data(){return this.present?structuredClone(this.row.data):undefined;}
 // Functional adapter uses exists(); native facade below uses a boolean.
 exists(){return this.present;}
}
export class StoreRef {
 constructor(public store:SupabaseStore,public collectionId:string,public id:string){pathPart(collectionId);pathPart(id);}
 async get(){return toNative(await this.store.read(this));}
 async set(data:any,options?:{merge?:boolean}){await this.store.mutate(this,data,options?.merge?'merge':'set');}
 async update(data:any){await this.store.mutate(this,data,'update');}
 async delete(){await this.store.mutate(this,{},'delete');}
}
function toNative(s:StoreSnapshot){return {id:s.id,ref:s.ref,exists:s.present,data:()=>s.data(),version:s.version};}
export class StoreCollection {
 constructor(public store:SupabaseStore,public id:string,public filters:Filter[]=[],public max=Infinity){pathPart(id);}
 doc(id:string=crypto.randomUUID()){return new StoreRef(this.store,this.id,id);}
 where(field:string,op:string,value:any){if(op!=='=='&&op!=='array-contains')throw new Error(`Operador não suportado: ${op}`);return new StoreCollection(this.store,this.id,[...this.filters,{field,op,value}],this.max);}
 limit(max:number){return new StoreCollection(this.store,this.id,this.filters,max);}
 async get(){const s=await this.store.scan(this);return {...s,docs:s.docs.map(toNative),forEach:(fn:any)=>s.docs.map(toNative).forEach(fn)};}
}
type Write={collection_id:string;document_id:string;mode:'set'|'merge'|'update'|'create'|'delete';data:any};
export class StoreTransaction {
 reads=new Map<string,{collection_id:string;document_id:string;version:number}>();
 writes:Write[]=[];
 constructor(private store:SupabaseStore,private native=false){}
 async get(ref:StoreRef):Promise<any>{
  if(this.writes.length)throw new Error('Leia todos os documentos antes de escrever na transação.');
  const s=await this.store.read(ref);const key=ref.collectionId+'/'+ref.id;
  const before=this.reads.get(key);if(before&&before.version!==s.version)throw Object.assign(new Error('Documento alterado durante leitura.'),{code:'40001'});
  this.reads.set(key,{collection_id:ref.collectionId,document_id:ref.id,version:s.version});return this.native?toNative(s):s;
 }
 private write(ref:StoreRef,data:any,mode:Write['mode']){if(ref.store!==this.store)throw new Error('Transação entre bancos diferentes não permitida.');this.writes.push({collection_id:ref.collectionId,document_id:ref.id,mode,data:clean(data)});return this;}
 set(ref:StoreRef,data:any,options?:{merge?:boolean}){return this.write(ref,data,options?.merge?'merge':'set');}
 update(ref:StoreRef,data:any){return this.write(ref,data,'update');}
 create(ref:StoreRef,data:any){return this.write(ref,data,'create');}
 delete(ref:StoreRef){return this.write(ref,{},'delete');}
}
export class SupabaseStore {
 readonly provider='supabase';
 private scans=new Map<string,Promise<any>>();
 constructor(private rpc:RpcTransport=(n,p)=>getSupabaseTransport()(n,p)){}
 collection(id:string){return new StoreCollection(this,id);}
 async userByEmail(email:string){return this.rpc('inex_user_by_email',{p_email:email});}
 async read(ref:StoreRef){const row=await this.rpc('inex_get_document',{p_collection:ref.collectionId,p_id:ref.id});return new StoreSnapshot(ref,{id:ref.id,data:row?.data??null,version:Number(row?.version||0),deleted:row?.deleted});}
 async recent(collectionId:string,limit:number,match:Record<string,any>={}){
  pathPart(collectionId);
  if(!Number.isInteger(limit)||limit<1||limit>5000)throw new Error('Limite de consulta inválido.');
  const rows:RecordRow[]=await this.rpc('inex_recent_documents',{p_collection:collectionId,p_match:match,p_limit:limit});
  if(!Array.isArray(rows))throw new Error('Resposta de coleção inválida.');
  return rows.map(row=>({id:row.id,data:structuredClone(row.data)}));
 }
 async scan(ref:StoreCollection){
  const key=JSON.stringify([ref.id,ref.filters,Number.isFinite(ref.max)?ref.max:null]);
  const existing=this.scans.get(key);if(existing)return existing;
  const request=this.scanUnshared(ref);this.scans.set(key,request);
  try{return await request;}finally{if(this.scans.get(key)===request)this.scans.delete(key);}
 }
 private async scanUnshared(ref:StoreCollection){
  const docs:StoreSnapshot[]=[];let cursor='';
  while(docs.length<ref.max){const pageSize=Math.min(500,ref.max-docs.length);const rows:RecordRow[]=await this.rpc('inex_scan_collection',{p_collection:ref.id,p_filters:ref.filters,p_after:cursor,p_limit:pageSize});if(!Array.isArray(rows))throw new Error('Resposta de coleção inválida.');for(const r of rows)docs.push(new StoreSnapshot(new StoreRef(this,ref.id,r.id),r));if(rows.length<pageSize||docs.length>=ref.max)break;const next=rows.at(-1)?.id;if(!next||next<=cursor)throw new Error('Paginação inválida.');cursor=next;}
  return{docs,size:docs.length,empty:docs.length===0,forEach:(fn:any)=>docs.forEach(fn)};
 }
 async transaction<T>(fn:(tx:StoreTransaction)=>Promise<T>,native=false):Promise<T>{
  for(let attempt=0;attempt<5;attempt++){
   const tx=new StoreTransaction(this,native);
   try{const result=await fn(tx);if(tx.writes.length){await this.rpc('inex_commit',{p_reads:[...tx.reads.values()],p_writes:tx.writes});this.scans.clear();notifyAdminCollections(tx.writes.map(w=>w.collection_id));}return result;}
   catch(error:any){if(error.code!=='40001'||attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,10+crypto.randomInt(30)*(attempt+1)));}
  }throw new Error('Não foi possível concluir a transação.');
 }
 runTransaction<T>(fn:(tx:StoreTransaction)=>Promise<T>){return this.transaction(fn,true);}
 async mutate(ref:StoreRef,data:any,mode:Write['mode']){return this.transaction(async tx=>{await tx.get(ref);if(mode==='delete')tx.delete(ref);else if(mode==='update')tx.update(ref,data);else if(mode==='create')tx.create(ref,data);else tx.set(ref,data,{merge:mode==='merge'});});}
 async health(){await this.rpc('inex_get_document',{p_collection:'_health',p_id:'probe'});return{provider:'supabase',connected:true};}
}
export const supabaseStore=new SupabaseStore();
