import test from 'node:test';
import assert from 'node:assert/strict';
import {createWithdrawalKeyResolver} from '../server/dotfy/pixKeys.ts';
import {approveDotfyWithdrawal} from '../server/dotfy/withdrawalApproval.ts';
test('approval resolves the actual PIX address against the current account instead of reusing an old account ID',async()=>{
 const requests:any[]=[];let sent:any;
 const resolver=createWithdrawalKeyResolver((async(url:any,init:any)=>{requests.push({url,method:init.method||'GET'});return Response.json({pixKeys:[{id:'current-account-id',key:'fixture@example.invalid',type:'EMAIL',status:'APPROVED'}]});}) as any);
 await approveDotfyWithdrawal('w',{getTransactionById:async()=>({type:'withdrawal',status:'pending',userId:'u',amount:100,netAmount:92,pixKeyId:'old-account-id',pixKey:{key:'fixture@example.invalid',type:'EMAIL'}}),getUserById:async()=>({name:'Fixture'}),getApiKey:async()=>'fixture',resolveKey:resolver,claimWithdrawal:async()=>'attempt',recordResult:async()=>{},send:async(_key,body)=>{sent=body;return Response.json({withdrawal:{id:'wd',status:'PROCESSING'}})}},{});
 assert.equal(sent.pixKeyId,'current-account-id');assert.equal(requests.length,1);assert.equal(requests[0].method,'GET');
});
test('an unknown stored ID without the actual PIX address never registers the ID as a PIX key',async()=>{
 let calls=0;const resolver=createWithdrawalKeyResolver((async()=>{calls++;return Response.json({pixKeys:[]});}) as any);
 const result=await resolver('fixture','old-id',undefined,undefined,{existingIdOnly:true});assert.equal(result.pixKeyId,'');assert.match(result.error||'',/Recadastre/);assert.equal(calls,1);
});
test('pending and rejected keys block approval without attempting a transfer',async()=>{
 for(const status of ['PENDING_APPROVAL','REJECTED']){
  let calls=0;const resolver=createWithdrawalKeyResolver((async()=>{calls++;return Response.json({pixKeys:[{id:'id',key:'fixture@example.invalid',type:'EMAIL',status}]});}) as any);
  const result=await resolver('fixture','fixture@example.invalid','EMAIL');assert.equal(result.pixKeyId,'');assert.ok(result.error);assert.equal(calls,1);
 }
});
test('newly registered keys must also be approved before being used',async()=>{
 let calls=0;const resolver=createWithdrawalKeyResolver((async()=>{calls++;return calls===1?Response.json({pixKeys:[]}):Response.json({pixKey:{id:'new-key',status:'PENDING_APPROVAL'}});}) as any);
 const result=await resolver('fixture','fixture@example.invalid','EMAIL');assert.equal(calls,2);assert.equal(result.pixKeyId,'');assert.match(result.error||'',/aguarda aprovação/);
});
