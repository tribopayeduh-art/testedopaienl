import fs from 'node:fs';
import path from 'node:path';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
let original=0,compressed=0,files=0;
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else if(/\.(?:js|mjs|css|svg)$/.test(file)){const data=fs.readFileSync(file);if(data.length<1024)continue;const br=brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:9}});if(br.length>=data.length)continue;fs.writeFileSync(file+'.br',br);fs.writeFileSync(file+'.gz',gzipSync(data,{level:9}));original+=data.length;compressed+=br.length;files++;}}}
visit('public/bubbleblast');console.log(JSON.stringify({files,originalBytes:original,brotliBytes:compressed}));
