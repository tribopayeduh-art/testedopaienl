import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseSupabase,REQUIRED_GAME_CONFIGS} from '../server/supabaseDiagnostics.ts';
const response=(name:string,args:any):any=>name==='inex_get_document'?{data:{},version:1}:name==='inex_admin_metrics'?{totals:{},daily:[],hourly:[]}:name==='inex_admin_integrity'?{negativePlayerWallets:0,negativeAffiliateWallets:0,betsWithoutCurrentUser:1,affiliatesWithoutCurrentUser:0,canonicalGameConfigs:7}:name==='inex_revision_snapshot'?{users:'1'}:name==='inex_user_by_email'?null:[];
test('connection diagnostic checks all canonical games and RPC reads without writes or personal output',async()=>{
 const calls:string[]=[];const report=await diagnoseSupabase(async(name,args)=>{calls.push(name);return response(name,args);});
 assert.equal(report.ok,true);assert.equal(report.readOnly,true);assert.equal(report.integrity?.betsWithoutCurrentUser,1);assert.equal(report.checks.filter(c=>c.name.startsWith('config:')).length,REQUIRED_GAME_CONFIGS.length);assert(!calls.includes('inex_commit'));assert(!JSON.stringify(report).includes('orphanExamples'));
});
test('diagnostic continues after missing RPC and missing game configuration',async()=>{
 const report=await diagnoseSupabase(async(name,args)=>{if(name==='inex_admin_metrics')throw Object.assign(new Error('private error'),{code:'PGRST202'});if(args.p_id==='g_bubble_blast')return null;return response(name,args);});
 assert.equal(report.ok,false);assert.equal(report.checks.length,14);assert.equal(report.checks.find(c=>c.name==='inex_admin_metrics')?.code,'PGRST202');assert.equal(report.checks.find(c=>c.name==='config:g_bubble_blast')?.ok,false);assert(!JSON.stringify(report).includes('private error'));
});
