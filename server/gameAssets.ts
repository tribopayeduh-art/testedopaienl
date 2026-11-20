import fs from 'node:fs';
import path from 'node:path';
import type {Request,Response,NextFunction} from 'express';
export function compressedGameAssets(publicRoot=path.resolve('public')){
 return (req:Request,res:Response,next:NextFunction)=>{
  if(req.method!=='GET'&&req.method!=='HEAD')return next();
  const ext=path.extname(req.path).toLowerCase();
  if(!['.js','.mjs','.css','.svg','.png'].includes(ext))return next();
  const rel=req.path.replace(/^\/bubbleblast\/?/,'').replace(/^\/+/, '');
  const candidates=[path.resolve(publicRoot,'bubbleblast',rel),path.resolve(publicRoot,req.path.replace(/^\/+/,''))].filter(candidate=>candidate.startsWith(publicRoot+path.sep));
  if(ext==='.png'){
    if(!String(req.headers?.accept||'').includes('image/webp'))return next();
    const file=candidates.find(candidate=>fs.existsSync(candidate+'.webp'));if(!file)return next();
    res.vary('Accept');res.type('image/webp');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');return res.sendFile(file+'.webp');
  }
  const encoding=req.acceptsEncodings('br','gzip','identity');
  if(encoding!=='br'&&encoding!=='gzip')return next();
  const suffix=encoding==='br'?'.br':'.gz';
  const file=candidates.find(candidate=>fs.existsSync(candidate+suffix));
  if(!file)return next();
  res.vary('Accept-Encoding');res.setHeader('Content-Encoding',encoding);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.type(ext==='.mjs'?'.js':ext);res.sendFile(file+suffix);
 };
}
