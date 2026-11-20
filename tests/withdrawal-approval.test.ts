import test from 'node:test';
import assert from 'node:assert/strict';
import {approveDotfyWithdrawal,withdrawalDestination} from '../server/dotfy/withdrawalApproval.ts';
function fixture(tx:any={}){
 const calls:any[]=[];let result:any;let response=()=>Promise.resolve(Response.json({withdrawal:{id:'gateway-1',status:'PROCESSING'}}));
 const deps={getTransactionById:async()=>({id:'w',type:'withdrawal',status:'pending',userId:'u',amount:100,netAmount:'92.00',...tx}),getUserById:async()=>({name:'Fixture',pixKey:{type:'EMAIL',key:'fixture@example.invalid'}}),getApiKey:async()=>'fixture',resolveKey:async(_key:string,raw:string)=>{calls.push(['resolve',raw]);return {pixKeyId:'pix-1'}},claimWithdrawal:async()=>{calls.push(['claim']);return 'attempt-1'},recordResult:async(_id:string,_attempt:string,r:any)=>{result=r;calls.push(['record',r.kind])},send:async(_key:string,body:any)=>{calls.push(['send',body]);return response()}};
 return {deps,calls,get result(){return result},respond(fn:typeof response){response=fn}};
}
test('approval validates object PIX keys before claim and sends decimal-string amounts as BRL numbers',async()=>{
 const f=fixture();const r=await approveDotfyWithdrawal('w',f.deps,{id:'admin'});assert.equal(r.dotfyWithdrawalId,'gateway-1');assert.deepEqual(f.calls.map(x=>x[0]),['resolve','claim','send','record']);assert.equal(f.calls[0][1],'fixture@example.invalid');assert.equal(f.calls[2][1].amount,92);assert.equal(f.result.kind,'accepted');
 assert.deepEqual(withdrawalDestination({pixKey:{key:'  fixture@example.invalid ',type:'EMAIL'}},{}),{key:'fixture@example.invalid',type:'EMAIL',pixKeyId:''});
});
test('PIX validation failure does not reserve or send a withdrawal',async()=>{
 const f=fixture();f.deps.resolveKey=async()=>({pixKeyId:'',error:'Chave pendente de aprovação.'} as any);
 await assert.rejects(approveDotfyWithdrawal('w',f.deps,{}),(e:any)=>e.code==='PIX_KEY_NOT_RESOLVED'&&e.status===400);assert.equal(f.calls.length,0);
});
test('old uncertain claims are not unlocked or resent and return an actionable conflict',async()=>{
 const f=fixture({gatewayProcessing:true});await assert.rejects(approveDotfyWithdrawal('w',f.deps,{}),(e:any)=>e.status===409&&e.code==='WITHDRAWAL_RECONCILIATION_REQUIRED');assert.equal(f.calls.length,0);
});
test('an already linked withdrawal returns its existing ID without a second financial POST',async()=>{
 const f=fixture({dotfyWithdrawalId:'old-id',gatewayProcessing:true});const r=await approveDotfyWithdrawal('w',f.deps,{});assert.equal(r.dotfyWithdrawalId,'old-id');assert.equal(r.replayed,true);assert.equal(f.calls.length,0);
});
test('a documented refusal preserves its cause and releases only the processing flag for an explicit retry',async()=>{
 const f=fixture();f.respond(async()=>Response.json({error:'Saldo insuficiente na Dotfy.',code:'INSUFFICIENT_BALANCE'},{status:400}));await assert.rejects(approveDotfyWithdrawal('w',f.deps,{}),(e:any)=>e.status===422&&e.message.includes('Saldo insuficiente'));assert.equal(f.result.kind,'refused');assert.equal(f.result.code,'INSUFFICIENT_BALANCE');assert.equal(f.calls.filter(x=>x[0]==='send').length,1);
});
test('timeout, 5xx, already-pending and malformed success stay reserved and are never auto retried',async()=>{
 for(const scenario of ['timeout','500','already-pending','malformed']){
  const f=fixture();f.respond(async()=>{if(scenario==='timeout')throw Error('network');if(scenario==='500')return Response.json({error:'upstream'},{status:500});if(scenario==='already-pending')return Response.json({code:'WITHDRAWAL_ALREADY_PENDING'},{status:400});return Response.json({success:true});});
  await assert.rejects(approveDotfyWithdrawal('w',f.deps,{}),(e:any)=>e.ambiguous===true);assert.equal(f.result.kind,'uncertain');assert.equal(f.calls.filter(x=>x[0]==='send').length,1);
 }
});
test('invalid amounts never claim or send, and a split response is retained for reconciliation',async()=>{
 for(const amount of ['bad',0,-1,1.234]){const f=fixture({netAmount:amount});await assert.rejects(approveDotfyWithdrawal('w',f.deps,{}),/Valor líquido/);assert.equal(f.calls.length,0);}
 const f=fixture();f.respond(async()=>Response.json({split:true,legs:[{id:'leg-1'}],withdrawal:{id:'gw-split',status:'NEEDS_REVIEW'}}));await approveDotfyWithdrawal('w',f.deps,{});assert.equal(f.result.split,true);assert.deepEqual(f.result.legs,[{id:'leg-1'}]);
});
