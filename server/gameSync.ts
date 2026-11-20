import { drawScratchPrize } from './scratchRtp.ts';
import crypto from 'node:crypto';
import type {GameBetDB,UserDB} from './db.ts';
const failure=(message:string,status=400)=>Object.assign(new Error(message),{status});
function player(user:UserDB|null):asserts user is UserDB{
 if(!user)throw failure('Faça login para jogar com seu saldo.',401);
 if(user.isBlocked||user.role==='affiliate'||(user as UserDB & {isAffiliate?:boolean}).isAffiliate||user.registeredGame==='alliance_hub')throw failure('Conta indisponível para apostas.',403);
}
function betId(game:string,userId:string,key?:string){
 if(key){if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw failure('Identificador da operação inválido.');return game+'_'+crypto.createHash('sha256').update(userId+':'+key).digest('hex');}
 return game+'_'+crypto.randomUUID();
}
export async function startBubble(db:any,user:UserDB|null,body:any,key?:string){
 player(user);
 const cents=Number(body.betCents??body.stake??1000),config=await db.getGameConfig('g_bubble_blast');
 if(!Number.isSafeInteger(cents)||cents<=0)throw failure('Entrada inválida.');
 const amount=cents/100;
 if(config.status==='inactive'||config.maintenance)throw failure('O jogo está em manutenção.');
 if(amount<(config.minBet??5)||amount>(config.maxBet??500))throw failure('Entrada fora dos limites do jogo.');
 const id=betId('bubble',user.id,key);
 const bet:GameBetDB={id,gameId:'g_bubble_blast',userId:user.id,betAmount:amount,payoutAmount:0,profitAmount:-amount,multiplier:1,status:'active',difficulty:config.difficulty||'medium',createdAt:new Date().toISOString()};
 const balance=await db.startGameBetAtomic(bet,'BubbleWin');
 return {ok:true,betId:id,balanceCents:Math.round(balance*100),rtpPercent:config.rtpPercent??95,difficulty:config.difficulty||'medium'};
}
export async function settleBubble(db:any,user:UserDB|null,body:any){
 player(user);
 if(typeof body.betId!=='string'||!body.betId)throw failure('Informe a rodada iniciada.');
 const bet=await db.getGameBetById(body.betId);
 if(!bet||bet.userId!==user.id||bet.gameId!=='g_bubble_blast')throw failure('Rodada não encontrada.',404);
 const payout=Number(body.payout??body.amount??0);
 if(!Number.isFinite(payout)||payout<0||payout>bet.betAmount*8)throw failure('Prêmio fora dos limites da rodada.');
 const won=body.result==='clear'||body.result==='cashout';
 if(!won&&payout!==0)throw failure('Resultado e prêmio incompatíveis.');
 const balance=await db.settleGameBetAtomic(bet.id,user.id,payout,won?'cashed_out':'lost','BubbleWin','g_bubble_blast');
 return {ok:true,won,payoutAmount:payout,balanceCents:Math.round(balance*100)};
}
export async function settleSubway(db:any,user:UserDB|null,body:any){
 player(user);
 const bet=typeof body.betId==='string'?await db.getGameBetById(body.betId):null;
 if(!bet||bet.userId!==user.id||bet.gameId!=='g_subway_pay')throw failure('Rodada não encontrada.',404);
 const won=body.outcome==='cashout'||body.outcome==='win';
 const coins=Number(body.coins??0);
 if(!Number.isSafeInteger(coins)||coins<0)throw failure('Pontuação inválida.');
 const multiplier=won?Math.min(5,1+Math.min(1,coins/80)*4):0;
 const payout=won?Math.round(bet.betAmount*multiplier*100)/100:0;
 const balance=await db.settleGameBetAtomic(bet.id,user.id,payout,won?'cashed_out':'lost','SubwayPay','g_subway_pay');
 return {success:true,outcome:won?'cashout':'loss',payout,multiplier,balance};
}

const scratchPrices:Record<string,number>={carros:20,fan160:10,twister:15,tech:10,iphone:5,dinheiro:5,pix:5,'byd-song':20,'byd-dolphin':15,'bmw-audi':25,'bmw-motos':20,combo:25};
export async function startScratch(db:any,user:UserDB|null,body:any,key?:string){
 player(user);const price=scratchPrices[String(body.gameId)];if(!price)throw failure('Raspadinha não encontrada.');
 const config=await db.getGameConfig('g_raspa_fortuna');if(config.status==='inactive'||config.maintenance)throw failure('O jogo está em manutenção.');
 const id=betId('scratch',user.id,key),existing=await db.getGameBetById(id);
 if(existing&&(existing.userId!==user.id||existing.cardId!==body.gameId))throw failure('Rodada incompatível.');
 const rtpPercent=existing?.rtpPercent ?? config.rtpPercent ?? 88;
 const prize=existing?existing.scratchPrize:drawScratchPrize(price,rtpPercent);
 const balance=await db.startGameBetAtomic({id,userId:user.id,gameId:'g_raspa_fortuna',cardId:body.gameId,scratchPrize:prize,rtpPercent,difficulty:config.difficulty||'medium',betAmount:price,payoutAmount:0,multiplier:1,status:'active',createdAt:new Date().toISOString()} as GameBetDB,'RaspaFortuna');
 const stored=await db.getGameBetById(id);
 return {success:true,betId:id,balance,prize:stored.scratchPrize};
}
export async function revealScratch(db:any,user:UserDB|null,body:any){
 player(user);const bet=typeof body.betId==='string'?await db.getGameBetById(body.betId):null;
 if(!bet||bet.userId!==user.id||bet.gameId!=='g_raspa_fortuna'||!Number.isFinite(bet.scratchPrize))throw failure('Rodada não encontrada ou criada por uma versão anterior.',404);
 const prize=bet.scratchPrize;
 const balance=await db.settleGameBetAtomic(bet.id,user.id,prize,prize>0?'cashed_out':'lost','RaspaFortuna','g_raspa_fortuna');
 return {success:true,balance,prize};
}

const standardGames:Record<string,string>={g_gen_dino:'g_gen_dino','gen-dino':'g_gen_dino',g_block_puzzle:'g_block_puzzle','block-puzzle':'g_block_puzzle',g_zumbla:'g_zumbla',zumbla:'g_zumbla'};
export async function startStandardGame(db:any,user:UserDB|null,game:string,body:any,key?:string){
 player(user);const gameId=standardGames[game];if(!gameId)throw failure('Jogo não encontrado.',404);
 const config=await db.getGameConfig(gameId),amount=Number(body.betAmount);
 if(!Number.isFinite(amount)||amount<=0||amount<(config.minBet??1)||amount>(config.maxBet??500))throw failure('Entrada fora dos limites do jogo.');
 const id=betId(gameId,user.id,key);
 const balance=await db.startGameBetAtomic({id,userId:user.id,gameId,betAmount:amount,payoutAmount:0,multiplier:1,status:'active',difficulty:config.difficulty||'medium',createdAt:new Date().toISOString()} as GameBetDB,gameId);
 return {success:true,betId:id,balance};
}
export async function settleStandardGame(db:any,user:UserDB|null,game:string,body:any){
 player(user);const gameId=standardGames[game];if(!gameId)throw failure('Jogo não encontrado.',404);
 const bet=typeof body.betId==='string'?await db.getGameBetById(body.betId):null;
 if(!bet||bet.userId!==user.id||bet.gameId!==gameId)throw failure('Rodada não encontrada.',404);
 const payout=Number(body.payoutAmount??0),won=body.status==='won'||body.status==='cashed_out';
 if(!Number.isFinite(payout)||payout<0||payout>bet.betAmount*50||(!won&&payout!==0))throw failure('Prêmio fora dos limites da rodada.');
 const balance=await db.settleGameBetAtomic(bet.id,user.id,payout,won?'cashed_out':'lost',gameId,gameId);
 return {success:true,balance};
}
