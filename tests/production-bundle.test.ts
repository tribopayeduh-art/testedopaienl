import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

test('production entry boots without the server TypeScript sources or tsx',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inex-bundle-'));
 try {
  fs.copyFileSync('app.mjs',path.join(dir,'app.mjs'));
  fs.mkdirSync(path.join(dir,'build'));
  fs.copyFileSync('build/backend.mjs',path.join(dir,'build/backend.mjs'));
  fs.symlinkSync(fs.realpathSync('node_modules'),path.join(dir,'node_modules'),'junction');
  assert.equal(fs.existsSync(path.join(dir,'server/pixupDepositIntent.ts')),false);
  const code=`import {createServer} from 'node:http';
    const {default:app}=await import('./app.mjs');
    const server=createServer(app);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    const health=await fetch(base+'/api/health');
    if(health.status!==200||!health.headers.get('content-type')?.includes('json'))throw new Error('Health failed');
    await health.json();
    const auth=await fetch(base+'/api/auth/me');
    if(auth.status!==401)throw new Error('Authentication protection failed');
    await auth.json();
    for(const route of ['/api/admin/notifications','/api/admin/notifications/preview']){
      const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Test',body:'Test',target:'all_users'})});
      if(r.status!==401)throw new Error('Notification route not protected');await r.json();
    }
    server.closeAllConnections();server.close();process.exit(0);`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{
   cwd:dir,timeout:15000,encoding:'utf8',env:{...process.env,NODE_OPTIONS:'',VERCEL:'1',NODE_ENV:'production',DATABASE_PROVIDER:'supabase',SUPABASE_URL:'http://127.0.0.1:9',SUPABASE_SECRET_KEY:'isolated-test',JWT_SECRET:'isolated-test',SYSTEM_ENCRYPTION_KEY:'isolated-test'}
  });
  assert.equal(result.status,0,result.stderr||result.error?.message);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
