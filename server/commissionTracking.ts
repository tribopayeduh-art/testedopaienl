/** Read-only audit projection. A commission row alone is not proof of a bank payout. */
export type TrackingRow={id:string;affiliateId:string;affiliateName:string;buyerUserId:string;buyerName:string;transactionId:string;amount:number|null;baseAmount:number|null;effectivePercent:number|null;kind:string;state:string;createdAt:string;transactionStatus:string;issues:string[];trackingVersion:number};
export const COMMISSION_STATES=['recorded','retained','review'] as const;
export function commissionKind(id:string){return id.startsWith('comm_inf_')?'Influenciador':id.startsWith('comm_part_')?'Parceiro':id.startsWith('comm_pdiv_')||id.startsWith('comm_gdiv_')||id.startsWith('comm_k_')?'Retenção':id.startsWith('comm_m_')?'Rede indireta':'Afiliado';}
export function projectCommissions(commissions:any[],transactions:any[],users:any[],affiliates:any[]):TrackingRow[]{
 const txs=new Map(transactions.map(t=>[t.id,t])),people=new Map(users.map(u=>[u.id,u])),affs=new Map(affiliates.map(a=>[a.id,a]));
 const counts=new Map<string,number>();const key=(c:any)=>JSON.stringify([c.affiliateId,c.transactionId,commissionKind(String(c.id))]);
 for(const c of commissions)counts.set(key(c),(counts.get(key(c))||0)+1);
 return commissions.map(c=>{const tx=txs.get(c.transactionId),aff=affs.get(c.affiliateId),who=people.get(aff?.userId||c.referrerUserId),buyer=people.get(c.buyerUserId);
  const amount=typeof c.amount==='number'&&Number.isFinite(c.amount)?c.amount:null;
  const base=tx&&Number.isFinite(Number(tx.amount))&&Number(tx.amount)>0?Number(tx.amount):null;
  const issues:string[]=[];
  if(!tx)issues.push('Transação de origem ausente');
  if(!aff)issues.push('Cadastro de afiliado ausente');
  if(!buyer)issues.push('Conta de origem ausente');
  if(amount===null||amount<0)issues.push('Valor inválido');
  if(tx&&tx.status!=='approved')issues.push('Origem não aprovada');
  if(tx&&tx.userId!==c.buyerUserId)issues.push('Titular da origem divergente');
  if((counts.get(key(c))||0)>1)issues.push('Possível duplicidade: revisar registros');
  if(!Number.isFinite(Date.parse(c.createdAt)))issues.push('Data inválida');
  return{id:String(c.id),affiliateId:String(c.affiliateId||''),affiliateName:who?.name||'Afiliado não localizado',buyerUserId:String(c.buyerUserId||''),buyerName:buyer?.name||'Conta não localizada',transactionId:String(c.transactionId||''),amount,baseAmount:base,effectivePercent:base&&amount!==null?Math.round(amount/base*10000)/100:null,kind:c.trackingKind||commissionKind(String(c.id)),state:issues.length?'review':c.isKilled?'retained':'recorded',createdAt:c.createdAt||'',transactionStatus:tx?.status||'ausente',issues,trackingVersion:c.trackingVersion||0};
 }).sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||a.id.localeCompare(b.id));
}
export function queryCommissionTracking(rows:TrackingRow[],query:Record<string,unknown>){
 const text=(v:unknown)=>typeof v==='string'?v:'';
 const status=text(query.state)||'all';if(status!=='all'&&!COMMISSION_STATES.includes(status as any))throw Error('Estado inválido.');
 const q=text(query.q).trim().slice(0,120).toLocaleLowerCase('pt-BR'),affiliate=text(query.affiliateId);
 const from=text(query.from),to=text(query.to);
 if((from&&!Number.isFinite(Date.parse(from)))||(to&&!Number.isFinite(Date.parse(to)))||(from&&to&&Date.parse(from)>Date.parse(to)))throw Error('Período inválido.');
 const page=Math.max(1,Math.floor(Number(query.page)||1)),size=25;
 const filtered=rows.filter(r=>(status==='all'||r.state===status)&&(!affiliate||r.affiliateId===affiliate)&&(!from||(Date.parse(r.createdAt)||0)>=Date.parse(from))&&(!to||(Date.parse(r.createdAt)||0)<=Date.parse(to))&&(!q||[r.id,r.affiliateName,r.buyerName,r.transactionId,r.affiliateId,r.buyerUserId].join(' ').toLocaleLowerCase('pt-BR').includes(q)));
 const count=(state:string)=>filtered.filter(r=>r.state===state).length;
 const sum=(state:string)=>Math.round(filtered.filter(r=>r.state===state).reduce((n,r)=>n+Math.round((r.amount||0)*100),0))/100;
 const currentPage=Math.min(page,Math.max(1,Math.ceil(filtered.length/size)));
 return{rows:filtered.slice((currentPage-1)*size,currentPage*size),total:filtered.length,page:currentPage,pageSize:size,summary:{recordedCount:count('recorded'),recordedAmount:sum('recorded'),retainedCount:count('retained'),reviewCount:count('review'),reviewAmount:sum('review')},observedAt:new Date().toISOString()};
}
