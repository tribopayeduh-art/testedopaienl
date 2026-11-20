import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
process.env.DATABASE_PROVIDER='supabase';
process.env.JWT_SECRET='test-only-stable-secret';
const {supabaseStore}=await import('../server/supabaseStore');
const {dbService}=await import('../server/db');
const pg=new PGlite();
before(async()=>{
 await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 const dir=new URL('../supabase/migrations/',import.meta.url);const migration=fs.readdirSync(dir).find(n=>n.endsWith('_inex_authoritative_store.sql'))!;await pg.exec(fs.readFileSync(new URL(migration,dir),'utf8'));await pg.exec(fs.readFileSync(new URL('../supabase/patches/inex_read_performance.sql',import.meta.url),'utf8'));await pg.exec(fs.readFileSync(new URL('../supabase/patches/inex_admin_realtime.sql',import.meta.url),'utf8'));
 (supabaseStore as any).rpc=async(name:string,args:any)=>{const values=Object.values(args).map(v=>typeof v==='object'?JSON.stringify(v):v);const result=await pg.query<{result:any}>(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values);return result.rows[0].result;};
});
after(()=>pg.close());
test('existing admin domain reads and writes use Postgres without demo or memory users',async()=>{
 assert.equal((await dbService.getAllUsers()).length,0);
 await dbService.createUser({id:'u1',name:'Ana',email:'ana@example.com',phone:'85999999999',passwordHash:'test',balance:100,role:'user',createdAt:new Date().toISOString(),partnerId:'p1'} as any);
 assert.equal((await dbService.getUserByEmail('ANA@example.com'))?.id,'u1');
 assert.equal((await dbService.getUsersByPartnerId('p1')).length,1);
 await dbService.updateUserBalance('u1',140.50);assert.equal((await dbService.getUserById('u1'))?.balance,140.50);
 await dbService.deleteUser('u1');assert.equal(await dbService.getUserById('u1'),null);
});
test('webhook deposit credit is persisted exactly once through the existing domain API',async()=>{
 await dbService.createUser({id:'u2',email:'b@example.com',balance:10} as any);
 const charge={correlationID:'charge-test',userId:'u2',value:2000,valueInReais:20,description:'Test PIX'} as any;
 assert.ok(await dbService.creditChargeOnce(charge));assert.equal(await dbService.creditChargeOnce(charge),null);
 assert.equal((await dbService.getUserById('u2'))?.balance,30);
});
test('audit notes, logs and partner notifications keep their actual persistence',async()=>{
 await dbService.saveAdminOperationNote('tx1',{priority:'normal'},0);await assert.rejects(dbService.saveAdminOperationNote('tx1',{priority:'high'},0),/Outro operador/);
 await dbService.saveSecurityEvent({id:'audit1',event:'TEST',timestamp:new Date().toISOString()});assert.equal((await dbService.getSecurityEvents())[0].event,'TEST');
 await dbService.upsertPushSubscription({userId:'u2',endpoint:'https://example.test/sub',subscription:{endpoint:'https://example.test/sub'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 assert.equal((await dbService.getPushSubscriptions(new Set(['u2']))).length,1);
});
test('Supabase persistence failures never return successful domain writes',async()=>{
 const rpc=(supabaseStore as any).rpc;(supabaseStore as any).rpc=async()=>{throw new Error('database unavailable');};
 try{await assert.rejects(dbService.updateAffiliateFields('missing',{affiliateBalance:500}),/unavailable/);await assert.rejects(dbService.getAllUsers(),/unavailable/);}finally{(supabaseStore as any).rpc=rpc;}
});

test('all six game ledgers atomically synchronize wallet, receipt and config statistics',async()=>{
 const games=['g_bubble_blast','g_subway_pay','g_gen_dino','g_block_puzzle','g_zumbla','g_raspa_fortuna'];
 for(const gameId of games){
  const userId='ledger_'+gameId,id='bet_'+gameId;
  await dbService.createUser({id:userId,email:userId+'@example.test',balance:100} as any);
  await supabaseStore.collection('gameConfigs').doc(gameId).set({id:gameId,totalWagered:0,totalPayout:0,totalBetsCount:0,minBet:1,maxBet:500,status:'active'});
  const bet={id,userId,gameId,betAmount:10,payoutAmount:0,status:'active',createdAt:new Date().toISOString()} as any;
  assert.equal(await dbService.startGameBetAtomic(bet,'Test'),90);
  assert.equal(await dbService.startGameBetAtomic(bet,'Test'),90);
  await assert.rejects(dbService.settleGameBetAtomic(id,'u2',20,'cashed_out','Test',gameId),/inválida/);
  assert.equal(await dbService.settleGameBetAtomic(id,userId,20,'cashed_out','Test',gameId),110);
  assert.equal(await dbService.settleGameBetAtomic(id,userId,20,'cashed_out','Test',gameId),110);
  await assert.rejects(dbService.settleGameBetAtomic(id,userId,30,'cashed_out','Test',gameId),/outro resultado/);
  const config=(await supabaseStore.collection('gameConfigs').doc(gameId).get()).data();
  assert.equal(config.totalWagered,10);assert.equal(config.totalPayout,20);assert.equal(config.totalBetsCount,1);assert.equal(config.ggr,-10);
  assert.equal((await dbService.getUserById(userId))?.balance,110);
 }
});
test('simultaneous game debits cannot overspend the same balance',async()=>{
 await dbService.createUser({id:'race_player',email:'race@example.test',balance:10} as any);
 const results=await Promise.allSettled(['a','b'].map(id=>dbService.startGameBetAtomic({id:'race_'+id,userId:'race_player',gameId:'g_bubble_blast',betAmount:10,payoutAmount:0,status:'active',createdAt:new Date().toISOString()} as any)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await dbService.getUserById('race_player'))?.balance,0);
});
test('Bubble and Subway reject foreign and missing rounds and repeat successful settlements safely',async()=>{
 const {startBubble,settleBubble,settleSubway}=await import('../server/gameSync');
 await dbService.createUser({id:'bubble_test',email:'bubble@example.test',balance:100,role:'user'} as any);
 const user=(await dbService.getUserById('bubble_test'))!;
 await assert.rejects(startBubble(dbService,null,{betCents:1000}),/login/);
 await assert.rejects(startBubble(dbService,user,{betCents:-100}),/inválida/);
 const start=await startBubble(dbService,user,{betCents:1000},'repeat-start-test-001');
 assert.equal(start.balanceCents,9000);
 assert.equal((await startBubble(dbService,user,{betCents:1000},'repeat-start-test-001')).balanceCents,9000);
 await assert.rejects(settleBubble(dbService,user,{betId:'missing',payout:20,result:'clear'}),/encontrada/);
 await assert.rejects(settleBubble(dbService,user,{betId:start.betId,payout:100000,result:'clear'}),/limites/);
 const settled=await settleBubble(dbService,user,{betId:start.betId,payout:20,result:'cashout'});
 assert.equal(settled.balanceCents,11000);
 assert.equal((await settleBubble(dbService,user,{betId:start.betId,payout:20,result:'cashout'})).balanceCents,11000);
 await assert.rejects(settleSubway(dbService,user,{betId:start.betId,coins:80,outcome:'win'}),/encontrada/);
});

test('scratch tickets use server prices and stored prizes, ignoring browser balances and claimed winnings',async()=>{
 const {startScratch,revealScratch}=await import('../server/gameSync');
 await dbService.createUser({id:'scratch_test',email:'scratch@example.test',balance:100,role:'user'} as any);
 const user=(await dbService.getUserById('scratch_test'))!;
 const ticket=await startScratch(dbService,user,{gameId:'tech',price:.01,currentBalance:999999,winAmount:999999},'scratch-test-operation-001');
 assert.equal(ticket.balance,90);
 const result=await revealScratch(dbService,user,{betId:ticket.betId,prize:999999});
 assert.equal(result.prize,ticket.prize);assert.equal(result.balance,90+ticket.prize);
 assert.equal((await revealScratch(dbService,user,{betId:ticket.betId,prize:999999})).balance,result.balance);
 await assert.rejects(revealScratch(dbService,{...user,id:'u2'},{betId:ticket.betId}),/encontrada/);
});
test('standard game APIs keep Zumbla, Dino and Block rounds isolated by game and account',async()=>{
 const {startStandardGame,settleStandardGame}=await import('../server/gameSync');
 await dbService.createUser({id:'standard_test',email:'standard@example.test',balance:100,role:'user'} as any);
 const user=(await dbService.getUserById('standard_test'))!;
 for(const game of ['g_zumbla','g_gen_dino','g_block_puzzle']){
  const start=await startStandardGame(dbService,user,game,{betAmount:10,userId:'forged'},'operation-'+game.replaceAll('_','-')+'-001');
  await assert.rejects(settleStandardGame(dbService,user,game==='g_zumbla'?'g_gen_dino':'g_zumbla',{betId:start.betId,payoutAmount:20,status:'won'}),/encontrada/);
  const settled=await settleStandardGame(dbService,user,game,{betId:start.betId,payoutAmount:20,status:'won'});
  assert.equal((await dbService.getGameBetById(start.betId))?.gameId,game);
  assert.equal((await settleStandardGame(dbService,user,game,{betId:start.betId,payoutAmount:20,status:'won'})).balance,settled.balance);
 }
});

test('Count admin configuration is isolated from Block and preserves ledger totals while saving controls',async()=>{
 const config=await dbService.getGameConfig('g_count_masters');assert.equal(config.id,'g_count_masters');
 const stale={...config,minBet:2,rtpPercent:90};
 await supabaseStore.collection('gameConfigs').doc('g_count_masters').update({totalWagered:120,totalPayout:30,totalBetsCount:8,ggr:90});
 await dbService.saveGameConfig(stale);const saved=await dbService.getGameConfig('countmasters');
 assert.equal(saved.minBet,2);assert.equal(saved.rtpPercent,90);assert.equal(saved.totalWagered,120);assert.equal(saved.totalPayout,30);assert.equal(saved.totalBetsCount,8);assert.equal(saved.ggr,90);
 const live=await dbService.getGameLiveMetrics('g_count_masters',[]);assert.equal(live.config.id,'g_count_masters');assert.equal(live.totalWagered,120);
});

test('current game limits are enforced inside the debit transaction and stale admin rules cannot overwrite a newer save',async()=>{
 const userId='limit-test';await dbService.createUser({id:userId,email:'limits@example.test',balance:100} as any);
 const cfg=await dbService.getGameConfig('g_count_masters');const stale={...cfg};cfg.minBet=20;await dbService.saveGameConfig(cfg);
 await assert.rejects(dbService.saveGameConfig(stale),/Outro administrador/);
 await assert.rejects(dbService.startGameBetAtomic({id:'limit-bet',userId,gameId:'g_count_masters',betAmount:10,payoutAmount:0,status:'active',createdAt:new Date().toISOString()} as any),/limites atuais/);
 assert.equal((await dbService.getUserById(userId))?.balance,100);
});

test('an all-game rules update rolls back completely when any selected config is stale',async()=>{
 const first=await dbService.getGameConfig('g_gen_dino'),second=await dbService.getGameConfig('g_count_masters');const stale={...second};second.maxBet=80;await dbService.saveGameConfig(second);
 const before=await dbService.getGameConfig(first.id);first.rtpPercent=33;
 await assert.rejects(dbService.saveGameConfigsAtomic([first,{...stale,rtpPercent:33}]),/Outro administrador/);
 assert.equal((await dbService.getGameConfig(first.id)).rtpPercent,before.rtpPercent);
});

test('external Supabase deletions cannot resurrect cached users, affiliates or partner lists',async()=>{
 const u={id:'external_deleted_user',email:'external@example.test',phone:'11900001234',partnerCode:'PARTNERX',referralCode:'REFEXT',partnerId:'partner_external',balance:55} as any;
 await dbService.createUser(u);
 await dbService.getUserById(u.id);await dbService.getUserByPhone(u.phone);await dbService.getUserByPartnerCode(u.partnerCode);await dbService.getUserByReferralCode(u.referralCode);
 const a={id:'external_deleted_aff',userId:u.id,referralCode:'AFFEXT',affiliateBalance:30} as any;
 await dbService.createAffiliate(a);await dbService.getAffiliateById(a.id);await dbService.getAffiliateByUserId(u.id);await dbService.getAffiliateByCode(a.referralCode);
 await supabaseStore.collection('users').doc(u.id).delete();await supabaseStore.collection('affiliates').doc(a.id).delete();
 assert.equal(await dbService.getUserById(u.id),null);assert.equal(await dbService.getUserByPhone(u.phone),null);assert.equal(await dbService.getUserByPartnerCode(u.partnerCode),null);assert.equal(await dbService.getUserByReferralCode(u.referralCode),null);
 assert.equal(await dbService.getAffiliateById(a.id),null);assert.equal(await dbService.getAffiliateByUserId(u.id),null);assert.equal(await dbService.getAffiliateByCode(a.referralCode),null);
 assert.equal((await dbService.getUsersByPartnerId('partner_external')).some(x=>x.id===u.id),false);
});
test('confirmed empty Supabase collections stay empty despite previously cached records',async()=>{
 const a={id:'last_cached_aff',userId:'cached_user',referralCode:'LASTAFF',affiliateBalance:0} as any;
 await dbService.createAffiliate(a);await dbService.getAllAffiliates();
 const affs=await supabaseStore.collection('affiliates').get();for(const d of affs.docs)await d.ref.delete();
 assert.deepEqual(await dbService.getAllAffiliates(),[]);
 const users=await supabaseStore.collection('users').get();for(const d of users.docs)await d.ref.delete();
 assert.deepEqual(await dbService.getAllUsers(),[]);
});

test('withdrawal attempt fencing preserves balances and refuses stale or unconfirmed retry releases',async()=>{
 const id='approval_attempt_fixture';await supabaseStore.collection('transactions').doc(id).set({id,userId:'fixture',type:'withdrawal',status:'pending',amount:100,netAmount:92});
 const attempt=await dbService.claimWithdrawal(id);assert.ok(attempt);
 await assert.rejects(dbService.claimWithdrawal(id),(e:any)=>e.code==='WITHDRAWAL_RECONCILIATION_REQUIRED');
 await assert.rejects(dbService.recordWithdrawalGatewayResult(id,'foreign-attempt',{kind:'refused',code:'test',message:'test'}),/mudou/);
 await dbService.recordWithdrawalGatewayResult(id,attempt,{kind:'refused',code:'INSUFFICIENT_BALANCE',message:'Saldo insuficiente no gateway.'});
 let tx=(await supabaseStore.collection('transactions').doc(id).get()).data();assert.equal(tx.gatewayProcessing,false);assert.equal(tx.amount,100);assert.equal(tx.status,'pending');
 const next=await dbService.claimWithdrawal(id);assert.notEqual(next,attempt);
 await assert.rejects(dbService.recordWithdrawalGatewayResult(id,attempt,{kind:'refused',code:'test',message:'stale'}),/mudou/);
 await dbService.recordWithdrawalGatewayResult(id,next,{kind:'uncertain',code:'DOTFY_UNCONFIRMED',message:'Conciliação necessária.'});
 await assert.rejects(dbService.claimWithdrawal(id),/conciliação/);tx=(await supabaseStore.collection('transactions').doc(id).get()).data();assert.equal(tx.gatewayProcessing,true);assert.equal(tx.amount,100);
});


test('approval refuses an amount changed between validation and persistent send claim',async()=>{
 const id='stale_approval_fixture';await supabaseStore.collection('transactions').doc(id).set({id,userId:'fixture',type:'withdrawal',status:'pending',amount:200,netAmount:192});
 await assert.rejects(dbService.claimWithdrawal(id,{userId:'fixture',amount:100,netAmount:92}),(e:any)=>e.code==='WITHDRAWAL_CHANGED');
 const tx=(await supabaseStore.collection('transactions').doc(id).get()).data();assert.equal(tx.gatewayProcessing,undefined);assert.equal(tx.netAmount,192);
});

test('affiliate withdrawal policy persists audit and never moves money',async()=>{
 const {setAffiliateWithdrawalPolicy}=await import('../server/affiliateWithdrawalPolicy.ts');
 await dbService.createUser({id:'policy-user',email:'policy@example.test',name:'Policy',balance:44,autoWithdrawBlocked:true} as any);
 await dbService.createAffiliate({id:'policy-aff',userId:'policy-user',status:'active',referralCode:'POLICY',affiliateBalance:120,commissionTotal:300} as any);
 const result=await setAffiliateWithdrawalPolicy({userId:'policy-user',affiliateId:'policy-aff',mode:'auto',expectedBlocked:true,actorId:'admin'});
 assert.equal(result.autoWithdrawBlocked,false);
 assert.equal((await dbService.getUserById('policy-user'))?.autoWithdrawBlocked,false);
 assert.equal((await dbService.getUserById('policy-user'))?.balance,44);
 assert.equal((await dbService.getAffiliateById('policy-aff'))?.affiliateBalance,120);
 const audit=await supabaseStore.collection('admin_control_changes').where('userId','==','policy-user').get();
 assert.equal(audit.docs.length,1);assert.equal(audit.docs[0].data().after,'auto');
 await assert.rejects(setAffiliateWithdrawalPolicy({userId:'policy-user',affiliateId:'policy-aff',mode:'manual',expectedBlocked:true,actorId:'other-admin'}),/mudou/);
 assert.equal((await dbService.getUserById('policy-user'))?.autoWithdrawBlocked,false);
});
test('automatic withdrawal policy refuses mismatched ownership and blocked or influencer accounts',async()=>{
 const {setAffiliateWithdrawalPolicy}=await import('../server/affiliateWithdrawalPolicy.ts');
 await dbService.createUser({id:'policy-influencer',email:'policy-inf@example.test',balance:40,isInfluencer:true,autoWithdrawBlocked:true} as any);
 await dbService.createAffiliate({id:'policy-inf-aff',userId:'policy-influencer',status:'active',referralCode:'POLICYINF',affiliateBalance:90} as any);
 await assert.rejects(setAffiliateWithdrawalPolicy({userId:'policy-influencer',affiliateId:'policy-aff',mode:'auto',expectedBlocked:true,actorId:'admin'}),/não encontrado/);
 await assert.rejects(setAffiliateWithdrawalPolicy({userId:'policy-influencer',affiliateId:'policy-inf-aff',mode:'auto',expectedBlocked:true,actorId:'admin'}),/não é elegível/);
 await dbService.updateUserFields('policy-influencer',{isInfluencer:false,withdrawBlocked:true});
 await assert.rejects(setAffiliateWithdrawalPolicy({userId:'policy-influencer',affiliateId:'policy-inf-aff',mode:'auto',expectedBlocked:true,actorId:'admin'}),/não é elegível/);
 assert.equal((await dbService.getAffiliateById('policy-inf-aff'))?.affiliateBalance,90);
});

test('affiliate withdrawal reserves balance atomically, replay never duplicates and refund returns to commission wallet',async()=>{
 const {reserveAffiliateCashout}=await import('../server/affiliateCashout.ts');
 await dbService.createUser({id:'cashout-owner',email:'cashout@example.test',balance:77,autoWithdrawBlocked:false} as any);
 await dbService.createAffiliate({id:'cashout-aff',userId:'cashout-owner',status:'active',referralCode:'CASHOUT',affiliateBalance:100,withdrawFee:2} as any);
 const input={userId:'cashout-owner',affiliateId:'cashout-aff',requestId:'request-unique-cashout-001',signature:'same-intent',amount:40,fee:2,pixKey:'example@example.test',pixType:'EMAIL',wantAuto:true};
 const first=await reserveAffiliateCashout(input);assert.equal(first.balance,60);assert.equal(first.transaction.status,'pending');assert.equal(first.transaction.netAmount,38);assert.equal(first.transaction.isAutoCashout,true);
 const second=await reserveAffiliateCashout(input);assert.equal(second.replayed,true);assert.equal(second.transaction.id,first.transaction.id);assert.equal(second.balance,60);
 await assert.rejects(reserveAffiliateCashout({...input,signature:'other'}),/Identificador/);
 await assert.rejects(reserveAffiliateCashout({...input,requestId:'request-unique-cashout-002'}),/em andamento/);
 await dbService.rejectPlayerWithdrawal(first.transaction.id);
 assert.equal((await dbService.getAffiliateById('cashout-aff'))?.affiliateBalance,100);assert.equal((await dbService.getUserById('cashout-owner'))?.balance,77);
 await assert.rejects(dbService.rejectPlayerWithdrawal(first.transaction.id));
 assert.equal((await dbService.getAffiliateById('cashout-aff'))?.affiliateBalance,100);
});
test('affiliate withdrawal uncertainty stays reserved and completion requires gateway settlement',async()=>{
 const {reserveAffiliateCashout}=await import('../server/affiliateCashout.ts');
 await dbService.createUser({id:'cashout-pending',email:'cashout-pending@example.test',balance:70,autoWithdrawBlocked:false} as any);
 await dbService.createAffiliate({id:'cashout-pending-aff',userId:'cashout-pending',status:'active',referralCode:'CASHOUTPENDING',affiliateBalance:150,withdrawFee:0} as any);
 const tx=await reserveAffiliateCashout({userId:'cashout-pending',affiliateId:'cashout-pending-aff',requestId:'request-pending-cashout-001',signature:'pending-intent',amount:50,fee:0,pixKey:'example@example.test',pixType:'EMAIL',wantAuto:true});
 const attempt=await dbService.claimWithdrawal(tx.transaction.id);await dbService.recordWithdrawalGatewayResult(tx.transaction.id,attempt,{kind:'accepted',gatewayId:'gateway-test',gatewayStatus:'PROCESSING',split:false,legs:[],approvedByUserId:'auto',approvedByName:'Auto'});
 assert.equal((await dbService.getTransactionById(tx.transaction.id))?.status,'pending');await assert.rejects(dbService.rejectPlayerWithdrawal(tx.transaction.id));
 assert.equal((await dbService.getAffiliateById('cashout-pending-aff'))?.affiliateBalance,100);
 assert.equal(await dbService.settleGatewayWithdrawal(tx.transaction.id,'gateway-test',true),true);
 assert.equal((await dbService.getTransactionById(tx.transaction.id))?.status,'approved');assert.equal((await dbService.getUserById('cashout-pending'))?.balance,70);
});
test('affiliate withdrawal respects live policy changes during reservation',async()=>{
 const {reserveAffiliateCashout}=await import('../server/affiliateCashout.ts');
 await dbService.createUser({id:'cashout-manual',email:'cashout-manual@example.test',balance:0,autoWithdrawBlocked:true} as any);
 await dbService.createAffiliate({id:'cashout-manual-aff',userId:'cashout-manual',status:'active',referralCode:'CASHOUTMANUAL',affiliateBalance:100,withdrawFee:0} as any);
 const result=await reserveAffiliateCashout({userId:'cashout-manual',affiliateId:'cashout-manual-aff',requestId:'request-manual-cashout-001',signature:'manual-intent',amount:30,fee:0,pixKey:'x@example.test',pixType:'EMAIL',wantAuto:true});
 assert.equal(result.transaction.isAutoCashout,false);assert.equal(result.transaction.status,'pending');
});
test('parallel retries of one affiliate cashout debit the wallet once',async()=>{
 const {reserveAffiliateCashout}=await import('../server/affiliateCashout.ts');
 await dbService.createUser({id:'cashout-race',email:'cashout-race@example.test',balance:0,autoWithdrawBlocked:true} as any);
 await dbService.createAffiliate({id:'cashout-race-aff',userId:'cashout-race',status:'active',referralCode:'CASHOUTRACE',affiliateBalance:100,withdrawFee:0} as any);
 const input={userId:'cashout-race',affiliateId:'cashout-race-aff',requestId:'request-concurrent-001',signature:'same',amount:40,fee:0,pixKey:'x@example.test',pixType:'EMAIL',wantAuto:false};
 const results=await Promise.all([reserveAffiliateCashout(input),reserveAffiliateCashout(input)]);
 assert.equal(results.filter(r=>r.replayed).length,1);assert.equal((await dbService.getAffiliateById('cashout-race-aff'))?.affiliateBalance,60);
});

test('Pixup reserves before network, reuses pending PIX and tolerates webhook arriving before API response',async()=>{
 const {reservePixupDeposit,bindPixupConfirmation,finishPixupDeposit}=await import('../server/pixupDepositIntent.ts');
 await dbService.createUser({id:'pixup_user',email:'pixup@example.test',balance:10} as any);
 const intent=await reservePixupDeposit(supabaseStore,'pixup_user',2000);
 await assert.rejects(reservePixupDeposit(supabaseStore,'pixup_user',2000),/gerada/);
 await assert.rejects(bindPixupConfirmation(supabaseStore,intent.reference,'remote_1',2500),/divergente/);
 const charge=await bindPixupConfirmation(supabaseStore,intent.reference,'remote_1',2000);
 const attempts=await Promise.all([1,2,3].map(()=>dbService.creditChargeOnce({...charge,status:'PAID'})));
 assert.equal(attempts.filter(Boolean).length,1);
 assert.equal((await dbService.getUserById('pixup_user'))?.balance,30);
 const completed=await finishPixupDeposit(supabaseStore,intent,{...charge,qrCode:'mock',expiresAt:new Date(Date.now()+3600000).toISOString(),status:'PENDING'});
 assert.equal(completed.status,'PAID');
 assert.equal(completed.credited,true);
 await assert.rejects(bindPixupConfirmation(supabaseStore,intent.reference,'different_id',2000),/divergente/);
 const keyed=await reservePixupDeposit(supabaseStore,'pixup_user',1000,'stable-client-key-12345');
 await assert.rejects(reservePixupDeposit(supabaseStore,'pixup_user',2000,'stable-client-key-12345'),/outro valor/);
 await finishPixupDeposit(supabaseStore,keyed,{...keyed.charge,id:'remote_2',chargeId:'remote_2',qrCode:'mock2',expiresAt:new Date(Date.now()+3600000).toISOString()});
 const replay=await reservePixupDeposit(supabaseStore,'pixup_user',1000,'stable-client-key-12345');
 assert.equal(replay.replayed,true);
 assert.equal(replay.reference,keyed.reference);
 const fallback=await reservePixupDeposit(supabaseStore,'pixup_user',1000);
 await finishPixupDeposit(supabaseStore,fallback,{...fallback.charge,id:'remote_3',chargeId:'remote_3',qrCode:'mock3',expiresAt:new Date(Date.now()+3600000).toISOString()});
 assert.equal((await reservePixupDeposit(supabaseStore,'pixup_user',1000)).reference,fallback.reference);
});
