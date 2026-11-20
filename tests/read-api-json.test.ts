import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readApiJson} from '../src/lib/readApiJson.ts';
test('accepts valid API JSON, including API errors',async()=>{
 assert.deepEqual(await readApiJson(new Response('{"ok":true}')),{ok:true});
 assert.deepEqual(await readApiJson(new Response('{"error":"Sessão expirada"}',{status:401})),{error:'Sessão expirada'});
 assert.equal(await readApiJson(new Response(null,{status:204})),null);
});
test('plain hosting error and HTML never become raw parser errors or successful data',async()=>{
 for(const [body,status] of [['The page could not be found',404],['<!DOCTYPE html><title>down</title>',502],['not JSON',200],['',500]] as const){
  await assert.rejects(()=>readApiJson(new Response(body,{status})),(error:any)=>error.code==='API_INVALID_RESPONSE'&&error.status===status&&!error.message.includes('Unexpected token')&&!error.message.includes('<!DOCTYPE'));
 }
});
