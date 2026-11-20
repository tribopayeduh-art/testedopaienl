import fs from 'node:fs';
import path from 'node:path';
if(process.env.VERCEL === '1') {
 // Vercel serves public/ directly; Express static middleware is not used there.
 for(const entry of fs.readdirSync('dist')) fs.cpSync(path.join('dist',entry),path.join('public',entry),{recursive:true});
 console.log('Frontend compilado preparado em public/ para Vercel.');
}
