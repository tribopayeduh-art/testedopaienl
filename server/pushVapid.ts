import crypto from 'node:crypto';
// Domain-separated stable push identity for serverless deployments without a local vault.
// Explicit VAPID environment keys remain the preferred override.
export function deriveServerVapidKeys(secret:string|undefined) {
 if(!secret||secret.trim().length<32)return {publicKey:'',privateKey:''};
 for(let attempt=0;attempt<16;attempt++){
  const candidate=Buffer.from(crypto.hkdfSync('sha256',secret,'inex-push-vapid-v1',`p256-key-${attempt}`,32));
  try{const ecdh=crypto.createECDH('prime256v1');ecdh.setPrivateKey(candidate);return {publicKey:ecdh.getPublicKey().toString('base64url'),privateKey:ecdh.getPrivateKey().toString('base64url')};}catch{/* An out-of-range scalar is retried with a separate HKDF context. */}
 }
 throw new Error('Não foi possível inicializar as chaves de notificação.');
}
