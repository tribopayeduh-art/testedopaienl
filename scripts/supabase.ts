import '../server/environment.ts';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {supabaseStore,getSupabaseTransport} from '../server/supabaseStore.ts';
import {diagnoseSupabase} from '../server/supabaseDiagnostics.ts';
const [command,...args]=process.argv.slice(2);
function flag(name:string){const index=args.indexOf(name);return index>=0?args[index+1]:undefined;}
function canonical(value:any):any{if(value&&typeof value.toDate==='function')return value.toDate().toISOString();if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])]));return value;}
function digest(value:any){return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
async function run(){
 if(command==='check'){
  const result=await diagnoseSupabase(getSupabaseTransport());console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;return;
 }
 if(command==='import'){
  const input=flag('--input');if(!input)throw new Error('Informe --input exportacao.json.');
  const backup=JSON.parse(fs.readFileSync(input,'utf8'));
  if(backup.format!=='inex-supabase-1'||digest(backup.collections)!==backup.sha256)throw new Error('Formato ou checksum inválido. Use a exportação deste pacote.');
  if(!backup.collections||typeof backup.collections!=='object')throw new Error('Exportação inválida.');
  await supabaseStore.health();let imported=0,verified=0;
  for(const [name,records] of Object.entries(backup.collections) as [string,any[]][]){
   if(!Array.isArray(records))throw new Error(`Coleção inválida: ${name}`);
   for(let offset=0;offset<records.length;offset+=100){const batch=records.slice(offset,offset+100);await supabaseStore.runTransaction(async tx=>{
    const missing=[];
    for(const record of batch){if(!record.id||!record.data||typeof record.data!=='object')throw new Error('Documento inválido.');const ref=supabaseStore.collection(name).doc(record.id);const current=await tx.get(ref);if(current.exists){if(!isDeepStrictEqual(current.data(),record.data))throw new Error(`Conflito em ${name}/${record.id}; nenhum dado existente será sobrescrito.`);}else missing.push({ref,data:record.data});}
    for(const record of missing)tx.create(record.ref,record.data);
   });imported+=batch.length;}
   // Check every imported document, not merely collection counts.
   const actual=await supabaseStore.collection(name).get();const byId=new Map(actual.docs.map((doc:any)=>[doc.id,doc.data()]));
   for(const record of records){if(!isDeepStrictEqual(byId.get(record.id),record.data))throw new Error(`Verificação falhou: ${name}/${record.id}.`);verified++;}
   console.log(`${name}: ${records.length} documentos verificados.`);
  }
  console.log(`${imported} documentos processados; ${verified} verificados. Mantenha o banco antigo intacto até os testes finais.`);return;
 }
 if(command==='promote-admin'){
  const email=flag('--email')?.trim().toLowerCase();if(!email)throw new Error('Informe --email da conta já cadastrada.');
  const rows=await supabaseStore.collection('users').where('email','==',email).get();if(rows.size!==1)throw new Error('A conta deve existir uma única vez no banco antes da promoção.');
  const ref=rows.docs[0].ref;await supabaseStore.runTransaction(async tx=>{const user=(await tx.get(ref)).data();if(!user||user.isBlocked)throw new Error('Conta indisponível.');tx.update(ref,{role:'superadmin'});tx.create(supabaseStore.collection('security_events').doc(crypto.randomUUID()),{event:'ADMIN_PROMOTED_BY_SERVER_CLI',actorId:user.id,timestamp:new Date().toISOString()});});console.log('Conta existente promovida. Faça login novamente.');return;
 }
 throw new Error('Use check, import --input arquivo.json ou promote-admin --email conta.');
}
run().catch(error=>{console.error(error instanceof Error?error.message:'Operação não concluída.');process.exitCode=1;});
