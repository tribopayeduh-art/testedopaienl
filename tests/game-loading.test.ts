import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {brotliDecompressSync,gunzipSync} from 'node:zlib';
import {compressedGameAssets} from '../server/gameAssets';
import path from 'node:path';
test('compressed Bubble assets are byte-for-byte equivalent to their originals',()=>{
 const root=new URL('../public/bubbleblast/',import.meta.url);
 for(const name of ['js/index-jrhpc6Vb.js','js/vendor-BW8unCxY.js','css/index-DPX3B-wu.css']){
  const raw=fs.readFileSync(new URL(name,root));
  assert.deepEqual(brotliDecompressSync(fs.readFileSync(new URL(name+'.br',root))),raw);
  assert.deepEqual(gunzipSync(fs.readFileSync(new URL(name+'.gz',root))),raw);
 }
});
test('asset middleware sets encoding without exposing configuration or processing POSTs',()=>{
 const handle=compressedGameAssets(path.resolve('public'));let next=0,sent='',headers:any={};
 const response:any={vary(){},setHeader(k:string,v:any){headers[k]=v;},type(){},sendFile(p:string){sent=p;}};
 handle({method:'GET',path:'/bubbleblast/js/index-jrhpc6Vb.js',acceptsEncodings:()=> 'br'} as any,response,()=>next++);
 assert.ok(sent.endsWith('.js.br'));assert.equal(headers['Content-Encoding'],'br');
 handle({method:'GET',path:'/.env.local'} as any,response,()=>next++);
 handle({method:'POST',path:'/bubbleblast/game.js'} as any,response,()=>next++);
 assert.equal(next,2);
});
test('Bubble bridge never retries a failed money POST and preserves its idempotency key on explicit retry',async()=>{
 let calls=0;const keys:string[]=[];const storage=new Map();
 const window:any={fetch:async(_url:any,options:any)=>{calls++;keys.push(options.headers.get('Idempotency-Key'));throw new Error('connection lost');}};
 window.parent=window;
 const context=vm.createContext({window,location:{href:'http://localhost/bubbleblast/',origin:'http://localhost'},document:{cookie:''},localStorage:{getItem:(k:string)=>storage.get(k)||null,setItem:(k:string,v:string)=>storage.set(k,v)},URL,Headers,crypto,console:{error(){}}});
 vm.runInContext(fs.readFileSync(new URL('../public/bubbleblast/js/demo-auth.js',import.meta.url),'utf8'),context);
 for(let i=0;i<2;i++)await assert.rejects(window.fetch('/api/game/start',{method:'POST',body:'{"betCents":1000}'}),/connection lost/);
 assert.equal(calls,2);assert.ok(keys[0]);assert.equal(keys[0],keys[1]);
});

test('authenticated Bubble engine debits and settles through the API instead of demo credits',async()=>{
 const core=await import('../public/bubbleblast/game-core.mjs');
 const values=new Map<string,string>([['pg_auth_token','session-test'],['bb-demo-session-v1','tester']]);
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)};
 const elements=new Map<string,any>();
 const element=(id:string)=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,disabled:false,style:{},focus(){},addEventListener(){},setAttribute(){},getContext(){return {}},classList:{remove(){},add(){}}});return elements.get(id);};
 const requests:Array<{url:string,body:any}>=[];
 const window:any={parent:{postMessage(){}},addEventListener(){},AudioContext:undefined};
 const sandbox:any={...core,localStorage:storage,sessionStorage:storage,document:{title:'',getElementById:element,querySelector:()=>element('label')},window,location:{search:'?betCents=1000',href:'http://localhost/demo-game.html',origin:'http://localhost',assign(){}},history:{pushState(){}},Image:class{src='';complete=false;naturalWidth=0;},crypto,URLSearchParams,requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},fetch:async(url:string,options:any)=>{const body=options.body?JSON.parse(options.body):null;requests.push({url,body});return {ok:true,json:async()=>url.endsWith('/start')?{betId:'round-001',balanceCents:9000}:{balanceCents:11000,payoutAmount:20}};}};
 const context=vm.createContext(sandbox);
 const script=fs.readFileSync(new URL('../public/bubbleblast/game.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
 vm.runInContext(script,context);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests[0].url,'/api/game/bubble/start');assert.equal(requests[0].body.betCents,1000);
 assert.equal(values.get('bb-demo-wallet-v1-tester'),'9000');
 await vm.runInContext("score=70;finish('cashout')",context);
 assert.equal(requests[1].url,'/api/game/bubble/settle');assert.equal(requests[1].body.betId,'round-001');
 assert.equal(values.get('bb-demo-wallet-v1-tester'),'11000');
 assert.equal(values.get('bb-demo-history-v1-tester'),undefined);
});
