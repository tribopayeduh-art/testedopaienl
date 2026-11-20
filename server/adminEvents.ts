import {EventEmitter} from 'node:events';
export const adminEvents=new EventEmitter();adminEvents.setMaxListeners(200);
export const ADMIN_COLLECTIONS=new Set(['affiliateCommissions','gameSessions','referrals','users','affiliates','transactions','charges','gameBets','gameConfigs','games','settings','systemSettings','pis_transfers','countRounds','gameReceipts','admin_operation_notes','admin_notification_logs','pushSubscriptions','push_subscriptions']);
export function notifyAdminCollections(collections:string[]){const safe=[...new Set(collections)].filter(c=>ADMIN_COLLECTIONS.has(c));if(safe.length)try{adminEvents.emit('change',safe);}catch{/* Delivery failures cannot undo a committed ledger operation. */}}
