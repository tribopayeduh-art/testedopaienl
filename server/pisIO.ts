import {usingSupabase,supabaseStore} from './supabaseStore.ts';
import {Router} from 'express';
import crypto from 'node:crypto';
import {transferAtomic,parseCents} from './pisLedger.ts';
function database(){return supabaseStore;}
async function affiliate(db:any,userId:string){const rows=await db.collection('affiliates').where('userId','==',userId).limit(2).get();if(rows.size!==1)throw Object.assign(new Error('PIS IO disponível apenas para afiliados com cadastro ativo.'),{status:403});return rows.docs[0];}
async function identity(db:any,userId:string){
 const aff=await affiliate(db,userId);const ref=db.collection('pis_identities').doc(userId);
 for(let i=0;i<30;i++){
  const code=String(crypto.randomInt(100000,1000000));
  const value=await db.runTransaction(async(tx:any)=>{const existing=await tx.get(ref);if(existing.exists)return existing.data();const index=db.collection('pis_codes').doc(code);const candidate=await tx.get(index);if(candidate.exists)return null;const result={code,userId,affiliateId:aff.id,createdAt:new Date().toISOString()};tx.create(ref,result);tx.create(index,result);return result;});if(value)return value;
 }
 throw Object.assign(new Error('Não foi possível gerar o PIS IO. Tente novamente.'),{status:503});
}
export function createPisRouter(auth:any){
 const router=Router();router.use(auth);
 const hits=new Map<string,{at:number,count:number}>();
 router.use((req:any,res,next)=>{const now=Date.now();for(const [key,v]of hits)if(now-v.at>60000)hits.delete(key);const key=req.userId;const entry=hits.get(key)||{at:now,count:0};entry.count++;hits.set(key,entry);if(entry.count>30)return res.status(429).json({error:'Aguarde um minuto antes de tentar novamente.'});next();});
 const route=(fn:any)=>(req:any,res:any)=>Promise.resolve(fn(req,res)).catch(e=>{console.error('[PIS IO]',e.message);res.status(e.status||500).json({error:e.status?e.message:'Não foi possível concluir. Consulte o histórico antes de tentar novamente.'});});
 router.get('/me',route(async(req:any,res:any)=>{const db=database();const id=await identity(db,req.userId);const aff=await db.collection('affiliates').doc(id.affiliateId).get();res.json({code:id.code,balance:Number(aff.data()?.affiliateBalance||0)});}));
 router.get('/recipient/:code',route(async(req:any,res:any)=>{if(!/^\d{6}$/.test(req.params.code))return res.status(400).json({error:'Informe os seis dígitos do PIS IO.'});const db=database();await affiliate(db,req.userId);const code=await db.collection('pis_codes').doc(req.params.code).get();if(!code.exists)return res.status(404).json({error:'PIS IO não encontrado.'});const id=code.data();if(id.userId===req.userId)return res.status(400).json({error:'Escolha outro afiliado.'});const user=await db.collection('users').doc(id.userId).get();if(!user.exists||user.data()?.isBlocked)return res.status(404).json({error:'Destinatário indisponível.'});res.json({code:req.params.code,name:user.data().name||'Afiliado'});}));
 router.get('/history',route(async(req:any,res:any)=>{const db=database();await affiliate(db,req.userId);const rows=await db.collection('pis_transfers').where('members','array-contains',req.userId).get();res.json({items:rows.docs.map((d:any)=>{const t=d.data();return{id:d.id,amount:t.cents/100,direction:t.senderId===req.userId?'sent':'received',name:t.senderId===req.userId?t.recipientName:t.senderName,code:t.senderId===req.userId?t.recipientCode:t.senderCode,createdAt:t.createdAt};}).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30)});}));
 router.post('/transfers',route(async(req:any,res:any)=>{const code=String(req.body.code||'');const cents=parseCents(req.body.amount);const key=String(req.headers['idempotency-key']||'');if(!/^\d{6}$/.test(code)||! /^[a-zA-Z0-9-]{16,80}$/.test(key))return res.status(400).json({error:'PIS IO ou identificador da operação inválido.'});const db=database();const sender=await identity(db,req.userId);const ref=crypto.createHash('sha256').update(req.userId+':'+key).digest('hex');const result=await transferAtomic(db,{sender,code,cents,id:ref});res.json(result);}));
 return router;
}
