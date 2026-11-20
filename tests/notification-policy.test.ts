import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateNotification,selectNotificationAudience,isTrustedPushEndpoint} from '../server/notificationPolicy.ts';
const input={title:'Aviso',body:'Uma mensagem.',target:'all_affiliates'};
const users=[{id:'a',role:'affiliate'},{id:'p',role:'user'},{id:'blocked',role:'affiliate',isBlocked:true},{id:'admin',role:'superadmin'},{id:'i',role:'user',isInfluencer:true}];
test('vazio nunca amplia os filtros e exclui bloqueados e admins',()=>{
 assert.deepEqual(selectNotificationAudience(users,[],[],validateNotification({...input,target:'active_affiliates'})),[]);
 assert.deepEqual(selectNotificationAudience(users,[],[],validateNotification({...input,target:'players'})).map(u=>u.id),['p']);
 assert.deepEqual(selectNotificationAudience(users,[],[],validateNotification({...input,target:'all_users'})).map(u=>u.id),['a','p','i']);
 assert.deepEqual(selectNotificationAudience(users,[],[],validateNotification({...input,target:'influencers'})).map(u=>u.id),['i']);
});
test('seleção individual inválida não vira envio geral',()=>{
 assert.throws(()=>validateNotification({...input,target:'single_affiliate'}));
 assert.throws(()=>validateNotification({...input,targetUserId:'p'}));
 assert.throws(()=>selectNotificationAudience(users,[],[],validateNotification({...input,target:'single_affiliate',targetUserId:'blocked'})));
 assert.deepEqual(selectNotificationAudience(users,[],[],validateNotification({...input,target:'single_affiliate',targetUserId:'p'})).map(u=>u.id),['p']);
});
test('links externos e campos inválidos são rejeitados',()=>{
 for(const url of ['https://evil.test','//evil.test','/\\evil.test','/x%0aLocation:x'])assert.throws(()=>validateNotification({...input,url}));
 for(const fields of [{title:'x'.repeat(81)},{body:''},{target:'wrong'},{ttl:12},{urgency:'bad'},{silent:'true'},{scheduledFor:'2099-01-01'}])assert.throws(()=>validateNotification({...input,...fields}));
 assert.equal(validateNotification({...input,url:'/?tab=affiliates'}).url,'/?tab=affiliates');
});
test('apenas provedores push conhecidos recebem requisições',()=>{
 for(const u of ['http://127.0.0.1','https://fcm.googleapis.com.evil.test/x','https://fcm.googleapis.com:8443/x','https://evil.test'])assert.equal(isTrustedPushEndpoint(u),false);
 for(const u of ['https://fcm.googleapis.com/fcm/send/a','https://web.push.apple.com/a','https://updates.push.services.mozilla.com/wpush/v2/a'])assert.equal(isTrustedPushEndpoint(u),true);
});

import {deriveServerVapidKeys} from '../server/pushVapid.ts';
import crypto from 'node:crypto';
test('identidade VAPID estável por segredo e utilizável como P-256',()=>{
 const a=deriveServerVapidKeys('test-secret-'.repeat(5));
 assert.deepEqual(a,deriveServerVapidKeys('test-secret-'.repeat(5)));
 assert.notDeepEqual(a,deriveServerVapidKeys('different-secret-'.repeat(5)));
 assert.equal(Buffer.from(a.publicKey,'base64url').length,65);
 const ec=crypto.createECDH('prime256v1');ec.setPrivateKey(Buffer.from(a.privateKey,'base64url'));
 assert.equal(ec.getPublicKey().toString('base64url'),a.publicKey);
 assert.equal(deriveServerVapidKeys('short').publicKey,'');
});
