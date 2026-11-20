import {build} from 'esbuild';
import fs from 'node:fs';
const result=await build({
  entryPoints:['server.ts'],outfile:'build/backend.mjs',bundle:true,
  platform:'node',target:'node22',format:'esm',packages:'external',
  sourcemap:false,metafile:true,
  // This bundle is a function handler. The local development listener stays in server.ts.
  define:{'process.env.NODE_ENV':'"production"','process.env.VERCEL':'"1"'}
});
const output=result.metafile.outputs['build/backend.mjs'];
if(output.imports.some(item=>item.path.startsWith('.') || /\.tsx?$/.test(item.path))) {
  throw new Error('Backend bundle still depends on an internal source module.');
}
fs.writeFileSync('build/backend-meta.json',JSON.stringify(result.metafile,null,2));
console.log('Backend JavaScript empacotado, sem imports internos .ts.');
