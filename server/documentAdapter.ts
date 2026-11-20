import {supabaseStore,StoreRef,StoreCollection} from './supabaseStore.ts';
export {usingSupabase} from './supabaseStore.ts';
export function getDocumentStore():any{return supabaseStore;}
export function collection(db:any,id:string):any{return db.collection(id);}
export function doc(db:any,collectionId:string,id:string):any{return new StoreRef(db,collectionId,id);}
export function where(field:string,op:any,value:any):any{return {field,op,value};}
export function query(ref:any,...filters:any[]):any{return new StoreCollection(ref.store,ref.id,[...ref.filters,...filters]);}
export async function getDoc(ref:any):Promise<any>{return ref.store.read(ref);}
export async function getDocs(ref:any):Promise<any>{return ref.store.scan(ref);}
export async function setDoc(ref:any,data:any,options?:any):Promise<void>{await ref.store.mutate(ref,data,options?.merge?'merge':'set');}
export async function updateDoc(ref:any,data:any):Promise<void>{await ref.store.mutate(ref,data,'update');}
export async function deleteDoc(ref:any):Promise<void>{await ref.store.mutate(ref,{},'delete');}
export async function runTransaction<T>(db:any,fn:(tx:any)=>Promise<T>):Promise<T>{return db.transaction(fn);}
