import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createDotfyTransport,DotfyClient,verifyDotfySignature,normalizeChargePayload} from '../server/dotfy/client.ts';
import {DotfyWebhookQueue,reconcileDotfyEvent,parseDotfyEvent} from '../server/dotfy/webhooks.ts';
import {DOTFY_OPERATIONS} from '../server/dotfy/operations.ts';
import {SupabaseStore} from '../server/supabaseStore.ts';
test('official millisecond HMAC validates exact bytes and rejects stale, future and forged signatures',()=>{
 const now=Date.now(),raw='{ "event": "EVENT:CHARGE_PAID" }',secret='fixture-secret';const sign=(t:number)=>`t=${t},v1=${crypto.createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex')}`;
 assert(verifyDotfySignature(raw,sign(now),secret,now));assert(!verifyDotfySignature('{}',sign(now),secret,now));assert(!verifyDotfySignature(raw,sign(now-300001),secret,now));assert(!verifyDotfySignature(raw,sign(now+300001),secret,now));assert(!verifyDotfySignature(raw,`t=${now},v1=abc`,secret,now));
});
test('all game charge writes share BRL validation, Brazilian phone normalization and real test-labelled credentials',async()=>{
 let calls=0;let sent:any;const transport=createDotfyTransport((async(url:any,init:any)=>{calls++;sent={url:String(url),body:JSON.parse(init.body),authorization:new Headers(init.headers).get('Authorization')};return Response.json({success:true,data:{id:'charge',correlationID:'c',value:4990}});}) as any);
 await transport('https://app.dotfy.com.br/api/charges',{method:'POST',headers:{Authorization:'Bearer vk_test_fixture'},body:JSON.stringify({value:49.9,customer:{phone:'+55 (11) 98888-7777'},correlationID:'ignored'})});
 assert.equal(sent.body.value,49.9);assert.equal(sent.body.customer.phone,'11988887777');assert.equal(sent.body.correlationID,undefined);assert.equal(sent.authorization,'Bearer vk_test_fixture');assert.equal(calls,1);
 for(const value of [0,-1,NaN,Infinity,1.234])assert.throws(()=>normalizeChargePayload({value}));
 await assert.rejects(transport('https://evil.test/api/charges',{headers:{Authorization:'Bearer fixture'}}),/Destino/);assert.equal(calls,1);
});
test('ambiguous write failure is reported after exactly one outbound call',async()=>{
 let calls=0;const transport=createDotfyTransport((async()=>{calls++;throw new Error('secret networking detail')}) as any);
 await assert.rejects(transport('/api/withdrawals',{method:'POST',headers:{Authorization:'Bearer fixture'}}),(e:any)=>e.ambiguous&&e.code==='DOTFY_UNCONFIRMED'&&!e.message.includes('secret'));assert.equal(calls,1);
});
test('SDK covers official non-virtual operations, handles JSON, multipart and required parameters',async()=>{
 let url='',body:any;const client=new DotfyClient(async()=>'fixture',createDotfyTransport((async(u:any,i:any)=>{url=String(u);body=i.body;return Response.json({ok:true})}) as any));
 assert.equal(Object.keys(DOTFY_OPERATIONS).length,113);
 await client.execute('getChargeByCorrelationId',{path:{correlationID:'a/b'}});assert(url.endsWith('/a%2Fb'));
 await assert.rejects(client.execute('getWithdrawal'),/obrigatório/);
 await assert.rejects(client.execute('listCharges',{query:{startDate:'2026-10-01'}}),/juntos/);
 const form=new FormData();form.append('file',new Blob(['fixture']),'fixture.txt');await client.execute('uploadProductImage',{body:form});assert.equal(body,form);
});
test('webhook events never credit from unconfirmed body or a mismatched amount or account charge',async()=>{
 let credits=0;const event=parseDotfyEvent({event:'EVENT:CHARGE_PAID',timestamp:new Date().toISOString(),data:{id:'c1',correlationId:'ref',amount:2500,status:'PAID'}},'EVENT:CHARGE_PAID');
 let remote:any={id:'c1',correlationID:'ref',value:2500,status:'ACTIVE'};
 const deps={getCharge:async()=>({data:remote}),getWithdrawal:async()=>({}),findCharge:async()=>({id:'c1',valueInReais:25}),credit:async()=>{credits++},settleWithdrawal:async()=>true};
 await reconcileDotfyEvent(event,deps);assert.equal(credits,0);
 remote.status='COMPLETED';await reconcileDotfyEvent(event,deps);assert.equal(credits,1);
 remote.value=5000;await assert.rejects(reconcileDotfyEvent(event,deps),/Valor/);assert.equal(credits,1);
 remote.value=2500;remote.id='different';await assert.rejects(reconcileDotfyEvent(event,deps),/divergente/);
 assert.throws(()=>parseDotfyEvent(event,'EVENT:CHARGE_EXPIRED'),/inválido/);
});
test('withdrawal pending, needs review and split results cannot release whole wallet reservations',async()=>{
 let settled=0,remote:any={id:'w',amount:2500,status:'NEEDS_REVIEW'};
 const event={event:'EVENT:WITHDRAWAL_FAILED',timestamp:new Date().toISOString(),data:{id:'w'}};
 const deps={getCharge:async()=>({}),getWithdrawal:async()=>({withdrawal:remote}),findCharge:async()=>null,credit:async()=>{},settleWithdrawal:async()=>{settled++;return true}};
 await assert.rejects(reconcileDotfyEvent(event,deps),/não finalizado/);remote.status='COMPLETED';remote.legs=[{id:'leg'}];await assert.rejects(reconcileDotfyEvent(event,deps),/dividido/);assert.equal(settled,0);
 remote.legs=undefined;await reconcileDotfyEvent(event,deps);assert.equal(settled,1);
});
const pg=new PGlite();const store=new SupabaseStore(async(name,args)=>{const values=Object.values(args).map(v=>typeof v==='object'?JSON.stringify(v):v);const r=await pg.query<{result:any}>(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) as result`,values);return r.rows[0].result;});
before(async()=>{await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;');const dir=new URL('../supabase/migrations/',import.meta.url);const migration=fs.readdirSync(dir).find(n=>n.endsWith('_inex_authoritative_store.sql'))!;await pg.exec(fs.readFileSync(new URL(migration,dir),'utf8'));});after(()=>pg.close());
test('durable webhook queue deduplicates event IDs across workers and survives worker recreation',async()=>{
 let calls=0;const event={event:'EVENT:CHARGE_PAID',timestamp:new Date().toISOString(),data:{id:'c'}};
 const a=new DotfyWebhookQueue(store,async()=>{calls++});const b=new DotfyWebhookQueue(store,async()=>{calls++});
 await a.enqueue('same-event',event);await b.enqueue('same-event',event);await Promise.all([a.drain(),b.drain()]);assert.equal(calls,1);
 await new DotfyWebhookQueue(store,async()=>{calls++}).drain();assert.equal(calls,1);
 await assert.rejects(a.enqueue('same-event',{...event,data:{id:'changed'}}),/diferente/);
});
