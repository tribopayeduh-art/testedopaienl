import crypto from 'node:crypto';
import {supabaseStore, type SupabaseStore} from './supabaseStore.ts';
export const COUNT_ID='g_count_masters';
export const COUNT_DEFAULT={id:COUNT_ID,name:'Count Masters',category:'Runner & Multidão',status:'active' as const,maintenance:false,rtpPercent:95,difficulty:'medium' as const,minBet:1,maxBet:100,totalWagered:0,totalPayout:0,ggr:0,totalBetsCount:0,totalWinsCount:0,totalLossesCount:0,houseEdgeMode:'balanced' as const,maxMultiplier:5,configVersion:1,heroBannerImageUrl:'/assets/game-banners/count-masters.webp'};
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
const cents=(n:number)=>Math.round(n*100);
const hash=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
export function countMultipliers(max:number){const end=Math.min(10,Math.max(1.05,Number(max)||5));return [...new Set([1.25,1.6,2,3,5,10].filter(n=>n<end).concat(end))];}
export function countChance(round:any){if(round.stage>=round.steps.length)return 0;return (round.stage===0?round.rtp/100:round.steps[round.stage-1])/round.steps[round.stage];}
function draw(seed:string,stage:number){return parseInt(crypto.createHmac('sha256',seed).update('stage:'+stage).digest('hex').slice(0,12),16)/281474976710656;}
function view(r:any,balance:number){const current=r.stage? r.steps[r.stage-1]:0;return {id:r.id,status:r.status,stage:r.stage,totalStages:r.steps.length,crowd:r.crowd,lane:r.lane??0,betCents:r.betCents,balance,balanceCents:cents(balance),multiplier:r.status==='lost'?0:current,payoutCents:r.payoutCents||0,cashoutCents:r.status==='active'?Math.floor(r.betCents*current):0,nextMultiplier:r.steps[r.stage]??null,chance:r.status==='active'?countChance(r):0,commitment:hash(r.seed),...(r.status!=='active'?{revealedSeed:r.seed}:{}),gates:[{label:'+20',value:20},{label:'×2',value:2}]};}
function canPlay(u:any){if(!u)throw fail('Faça login para jogar.',401);if(u.isBlocked||u.role==='affiliate'||u.isAffiliate||u.registeredGame==='alliance_hub'||u.registeredGame==='alliance-hub')throw fail('Esta conta é de parceiro. Utilize uma conta de jogador.',403);}
export class CountMastersService{
 constructor(private store:SupabaseStore=supabaseStore){}
 async start(userId:string,betCents:number,key:string){
  if(!/^[a-zA-Z0-9_-]{16,80}$/.test(key))throw fail('Identificador da rodada inválido.');
  if(!Number.isSafeInteger(betCents)||betCents<=0)throw fail('Aposta inválida.');
  const id='cm_'+hash(userId+':'+key).slice(0,32),seed=crypto.randomBytes(32).toString('hex'),now=new Date().toISOString();
  return this.store.transaction(async tx=>{
   const ur=this.store.collection('users').doc(userId),rr=this.store.collection('countRounds').doc(id),cr=this.store.collection('gameConfigs').doc(COUNT_ID),ar=this.store.collection('countActive').doc(userId);
   const u=(await tx.get(ur)).data(),old=(await tx.get(rr)).data(),cfg={...COUNT_DEFAULT,...(await tx.get(cr)).data()},active=(await tx.get(ar)).data();canPlay(u);
   if(old){if(old.betCents!==betCents)throw fail('A chave já foi usada com outro valor.',409);return view(old,Number(u.balance));}
   if(active?.id){const other=(await tx.get(this.store.collection('countRounds').doc(active.id))).data();if(other?.status==='active')throw fail('Conclua a rodada em andamento antes de iniciar outra.',409);}
   if(cfg.status!=='active'||cfg.maintenance)throw fail('Count Masters está em manutenção.',503);
   if(betCents<cents(cfg.minBet)||betCents>cents(cfg.maxBet))throw fail(`Aposta permitida: R$ ${cfg.minBet} a R$ ${cfg.maxBet}.`);
   const available=cents(Number(u.balance));if(!Number.isSafeInteger(available)||available<betCents)throw fail('Saldo insuficiente.');
   const r={id,userId,betCents,seed,stage:0,crowd:10,steps:countMultipliers(cfg.maxMultiplier),rtp:Math.min(99.9,Math.max(.1,Number(cfg.rtpPercent)||95)),status:'active',createdAt:now};
   const wagered=cents(Number(cfg.totalWagered||0))+betCents;
   tx.update(ur,{balance:(available-betCents)/100});tx.set(rr,r);tx.set(ar,{id});
   tx.set(cr,{...cfg,totalWagered:wagered/100,totalBetsCount:Number(cfg.totalBetsCount||0)+1,ggr:(wagered-cents(cfg.totalPayout||0))/100});
   tx.create(this.store.collection('gameBets').doc(id),{id,userId,userName:u.name||'',gameId:COUNT_ID,betAmount:betCents/100,status:'active',payoutAmount:0,multiplier:0,difficulty:cfg.difficulty,rtpPercent:r.rtp,createdAt:now});
   tx.create(this.store.collection('gameReceipts').doc('stake_'+id),{id:'stake_'+id,userId,type:'bet',amount:betCents/100,status:'approved',paymentMethod:'CountMasters',gameId:COUNT_ID,description:'Entrada Count Masters',createdAt:now});
   return view(r,(available-betCents)/100);
  });
 }
 async active(userId:string){const u=(await this.store.collection('users').doc(userId).get()).data();canPlay(u);const a=(await this.store.collection('countActive').doc(userId).get()).data();if(!a)return {round:null,balance:Number(u.balance)};const r=(await this.store.collection('countRounds').doc(a.id).get()).data();return {round:r?view(r,Number(u.balance)):null,balance:Number(u.balance)};}
 async action(userId:string,id:string,action:'advance'|'cashout'|'forfeit',expectedStage:number,lane=0){
  if(!/^cm_[a-f0-9]{32}$/.test(id)||!Number.isInteger(expectedStage)||expectedStage<0||expectedStage>6||![0,1].includes(lane))throw fail('Ação inválida.');
  return this.store.transaction(async tx=>{
   const ur=this.store.collection('users').doc(userId),rr=this.store.collection('countRounds').doc(id),br=this.store.collection('gameBets').doc(id),cr=this.store.collection('gameConfigs').doc(COUNT_ID);
   const u=(await tx.get(ur)).data(),r=(await tx.get(rr)).data(),bet=(await tx.get(br)).data(),cfg=(await tx.get(cr)).data();canPlay(u);
   if(!r||r.userId!==userId||!bet||bet.userId!==userId||bet.gameId!==COUNT_ID)throw fail('Rodada não encontrada.',404);
   if(r.status!=='active')return view(r,Number(u.balance));
   if(action==='advance'&&expectedStage<r.stage)return view(r,Number(u.balance));
   if(expectedStage!==r.stage)throw fail('A rodada mudou. Atualize antes de continuar.',409);
   let payout=0;
   if(action==='advance'){
    const won=draw(r.seed,r.stage)<countChance(r);r.lane=lane;r.stage++;r.crowd=lane===0?r.crowd+20:r.crowd*2;
    r.lastWon=won;
    if(!won){r.status='lost';r.crowd=0;}
    else if(r.stage===r.steps.length){r.status='cashed_out';payout=Math.floor(r.betCents*r.steps[r.stage-1]);}
   }else if(action==='cashout'){
    if(r.stage===0)throw fail('Complete ao menos uma etapa antes de resgatar.');
    r.status='cashed_out';payout=Math.floor(r.betCents*r.steps[r.stage-1]);
   }else r.status='lost';
   let balance=Number(u.balance);r.updatedAt=new Date().toISOString();
   if(r.status!=='active'){
    if(!cfg)throw fail('Configuração indisponível.',503);
    r.payoutCents=payout;balance=(cents(balance)+payout)/100;
    tx.update(ur,{balance});
    const paid=cents(Number(cfg.totalPayout||0))+payout;
    tx.update(cr,{totalPayout:paid/100,ggr:(cents(Number(cfg.totalWagered||0))-paid)/100,totalWinsCount:Number(cfg.totalWinsCount||0)+(payout>0?1:0),totalLossesCount:Number(cfg.totalLossesCount||0)+(payout===0?1:0)});
    if(payout)tx.create(this.store.collection('gameReceipts').doc('game_'+id),{id:'game_'+id,userId,type:'win',amount:payout/100,status:'approved',paymentMethod:'CountMasters',gameId:COUNT_ID,description:'Prêmio Count Masters',createdAt:r.updatedAt});
   }
   tx.update(rr,r);tx.update(br,{status:r.status,score:r.crowd,multiplier:r.status==='lost'?0:r.stage?r.steps[r.stage-1]:0,payoutAmount:payout/100,profitAmount:r.status==='active'?0:(payout-r.betCents)/100,updatedAt:r.updatedAt,...(r.status!=='active'?{settledAt:r.updatedAt}:{})});
   return view(r,balance);
  });
 }
}
export const countMasters=new CountMastersService();
