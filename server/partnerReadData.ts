import type {UserDB,AffiliateDB,TransactionDB,GameBetDB} from './db.ts';
export async function loadPartnerReadData(db:{getAllUsers:()=>Promise<UserDB[]>;getAllAffiliates:()=>Promise<AffiliateDB[]>;getAllTransactions:()=>Promise<TransactionDB[]>;getAllGameBets:(limit:number)=>Promise<GameBetDB[]>}){
 const [users,affiliates,transactions,bets]=await Promise.all([db.getAllUsers(),db.getAllAffiliates(),db.getAllTransactions(),db.getAllGameBets(1000)]);
 return{users,affiliates,transactions,bets};
}
export function groupByUser<T extends {userId:string}>(rows:T[]){const map=new Map<string,T[]>();for(const row of rows){const list=map.get(row.userId);if(list)list.push(row);else map.set(row.userId,[row]);}return map;}
export function rowsForUsers<T>(index:Map<string,T[]>,ids:Iterable<string>){const rows:T[]=[];for(const id of new Set(ids))rows.push(...(index.get(id)||[]));return rows;}
