export const notificationTargets = ['all_users','players','all_affiliates','active_affiliates','influencers','single_affiliate'] as const;
export function validateNotification(input: any) {
  const fail=(message:string)=>{throw Object.assign(new Error(message),{status:400});};
  if(!input || typeof input!=='object') fail('Dados inválidos.');
  const title=typeof input.title==='string'?input.title.trim():'';
  const body=typeof input.body==='string'?input.body.trim():'';
  if(!title || title.length>80) fail('O título deve ter de 1 a 80 caracteres.');
  if(!body || body.length>300) fail('A mensagem deve ter de 1 a 300 caracteres.');
  const target=input.target || 'all_affiliates';
  if(!notificationTargets.includes(target)) fail('Público inválido.');
  const targetUserId=typeof input.targetUserId==='string'?input.targetUserId:'';
  if(target==='single_affiliate' && !targetUserId) fail('Selecione um usuário.');
  if(target!=='single_affiliate' && targetUserId) fail('Seleção individual incompatível com o público.');
  const url=typeof input.url==='string'?input.url.trim():'/';
  if(!url.startsWith('/') || url.startsWith('//') || /[\\\s\x00-\x1f]/.test(url) || url.length>500 || /%0[ad]|%5c/i.test(url)) fail('Use um caminho interno, como /?tab=affiliates.');
  const ttl=Number(input.ttl ?? 86400);
  if(![3600,21600,86400].includes(ttl)) fail('Validade inválida.');
  const urgency=input.urgency ?? 'normal';
  if(!['low','normal','high'].includes(urgency)) fail('Prioridade inválida.');
  if(input.silent!==undefined && typeof input.silent!=='boolean') fail('Opção de som inválida.');
  if(input.scheduledFor) fail('Agendamento automático não está habilitado neste servidor.');
  return {title,body,target,targetUserId,url,ttl,urgency,silent:input.silent===true};
}
export function selectNotificationAudience(users:any[], affiliates:any[], referrals:any[], config:ReturnType<typeof validateNotification>) {
  const affiliatesByUser=new Map(affiliates.filter(a=>a.userId).map(a=>[a.userId,a]));
  const affiliate=(u:any)=> affiliatesByUser.has(u.id)||u.role==='affiliate'||u.isAffiliate||u.isInfluencer;
  const base=users.filter(u=>!u.isBlocked && !['admin','superadmin'].includes(u.role));
  if(config.target==='single_affiliate'&&!base.some(u=>u.id===config.targetUserId)) throw Object.assign(new Error('Usuário indisponível ou bloqueado.'),{status:400});
  return base.filter(u=>{
    switch(config.target){
      case 'all_users': return true;
      case 'players': return !affiliate(u);
      case 'all_affiliates': return affiliate(u);
      case 'influencers': return !!u.isInfluencer;
      case 'single_affiliate': return u.id===config.targetUserId;
      case 'active_affiliates': { const a=affiliatesByUser.get(u.id); return affiliate(u)&&!!a&&((a.commissionTotal||0)>0||referrals.some(r=>r.affiliateId===a.id)); }
      default:return false;
    }
  });
}
export const notificationTargetLabels:Record<string,string>={all_users:'Todos os usuários',players:'Jogadores',all_affiliates:'Afiliados',active_affiliates:'Afiliados com indicações ou comissões',influencers:'Influenciadores',single_affiliate:'Usuário específico'};

export function isTrustedPushEndpoint(value:unknown):boolean {
 if(typeof value!=='string'||value.length>2048)return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)||u.hostname.endsWith('.notify.windows.com')||u.hostname.endsWith('.push.apple.com'));}catch{return false;}
}
