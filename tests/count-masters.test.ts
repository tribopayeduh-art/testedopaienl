import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {SupabaseStore} from '../server/supabaseStore';
import {CountMastersService,COUNT_DEFAULT,COUNT_ID,countChance,countMultipliers} from '../server/countMasters';
const pg=new PGlite();
const store=new SupabaseStore(async(name,args)=>{const values=Object.values(args).map(v=>typeof v==='object'?JSON.stringify(v):v);const r=await pg.query<{result:any}>(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values);return r.rows[0].result;});
const game=new CountMastersService(store);
before(async()=>{await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;');const dir=new URL('../supabase/migrations/',import.meta.url),name=fs.readdirSync(dir).find(n=>n.endsWith('_inex_authoritative_store.sql'))!;await pg.exec(fs.readFileSync(new URL(name,dir),'utf8'));await store.collection('gameConfigs').doc(COUNT_ID).set(COUNT_DEFAULT);});
after(()=>pg.close());
async function user(id:string,balance=100,extra:any={}){await store.collection('users').doc(id).set({id,email:id+'@example.test',balance,role:'user',registeredGame:COUNT_ID,...extra});}
async function forcedSeed(id:string,won:boolean){for(let i=0;i<1000;i++){const seed='test-seed-'+i;const roll=parseInt(crypto.createHmac('sha256',seed).update('stage:0').digest('hex').slice(0,12),16)/281474976710656;if((roll<.95/1.25)===won){await store.collection('countRounds').doc(id).update({seed});return;}}throw new Error('seed not found');}
test('Count starts once, resumes, prevents overlapping bets, excludes secrets and PIX cashflow',async()=>{
 await user('one');const key='key-one-1234567890';const r=await game.start('one',500,key);assert.equal(r.balance,95);assert.equal((r as any).seed,undefined);assert.equal((r as any).revealedSeed,undefined);assert.equal((await game.start('one',500,key)).balance,95);assert.equal((await game.active('one')).round?.id,r.id);await assert.rejects(game.start('one',500,'different-key-123456789'),/Conclua/);await assert.rejects(game.start('one',600,key),/outro valor/);assert.equal((await store.collection('gameReceipts').doc('stake_'+r.id).get()).data().amount,5);assert.equal((await store.collection('transactions').get()).size,0);
});
test('stages, cashouts and concurrent retries credit the wallet exactly once',async()=>{
 await user('win');const r=await game.start('win',1000,'key-win-1234567890');await forcedSeed(r.id,true);const a=await game.action('win',r.id,'advance',0,1);assert.equal(a.stage,1);assert.equal(a.cashoutCents,1250);assert.equal(a.crowd,20);const repeated=await game.action('win',r.id,'advance',0,1);assert.equal(repeated.stage,1);
 const [x,y]=await Promise.all([game.action('win',r.id,'cashout',1),game.action('win',r.id,'cashout',1)]);assert.equal(x.balance,102.5);assert.equal(y.balance,102.5);assert.equal((await store.collection('users').doc('win').get()).data().balance,102.5);assert.equal((await store.collection('gameBets').doc(r.id).get()).data().payoutAmount,12.5);assert.equal((await store.collection('gameReceipts').doc('game_'+r.id).get()).data().amount,12.5);assert.ok(x.revealedSeed);
});
test('Count rejects foreign rounds, invalid money, unauthenticated, affiliate, blocked and paused accounts',async()=>{
 await user('foreign');await user('owner');const r=await game.start('owner',500,'owner-key-123456789');await assert.rejects(game.action('foreign',r.id,'advance',0),/não encontrada/);await assert.rejects(game.start('missing',500,'missing-key-123456789'),/login/);for(const bet of [-1,NaN,Infinity,2.5,0,10001])await assert.rejects(game.start('foreign',bet,'money-key-123456789'));
 for(const [id,extra] of [['blocked',{isBlocked:true}],['affiliate',{role:'affiliate'}],['hub',{registeredGame:'alliance_hub'}]] as const){await user(id,100,extra);await assert.rejects(game.start(id,500,'blocked-key-123456789'));}
 await store.collection('gameConfigs').doc(COUNT_ID).update({status:'inactive'});await assert.rejects(game.start('foreign',500,'paused-key-123456789'),/manutenção/);await store.collection('gameConfigs').doc(COUNT_ID).update({status:'active'});
});
test('loss and forfeit settle without credit; configuration changes do not change an open round',async()=>{
 await user('loss');const r=await game.start('loss',500,'loss-key-1234567890');await forcedSeed(r.id,false);await store.collection('gameConfigs').doc(COUNT_ID).update({rtpPercent:50,maxMultiplier:2});const closed=await game.action('loss',r.id,'advance',0);assert.equal(closed.status,'lost');assert.equal(closed.balance,95);assert.equal(closed.payoutCents,0);assert.equal(closed.totalStages,5);
 await user('quit');const q=await game.start('quit',500,'quit-key-1234567890');await assert.rejects(game.action('quit',q.id,'cashout',0),/etapa/);await assert.rejects(game.action('quit',q.id,'advance',2),/mudou/);assert.equal((await game.action('quit',q.id,'forfeit',0)).balance,95);await store.collection('gameConfigs').doc(COUNT_ID).set(COUNT_DEFAULT);
});
test('simultaneous starts cannot overspend or create two active Count rounds',async()=>{await user('race',5);const result=await Promise.allSettled([game.start('race',500,'race-one-1234567890'),game.start('race',500,'race-two-1234567890')]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal((await store.collection('users').doc('race').get()).data().balance,0);});
test('displayed probabilities preserve theoretical RTP at every cashout stage',()=>{for(const rtp of [.1,50,95,99.9])for(const max of [1.05,1.25,2,5,10]){const steps=countMultipliers(max);let survival=1;for(let stage=0;stage<steps.length;stage++){const chance=countChance({stage,steps,rtp});assert.ok(chance>0&&chance<1);survival*=chance;assert.ok(Math.abs(survival*steps[stage]-rtp/100)<1e-12);}}});
