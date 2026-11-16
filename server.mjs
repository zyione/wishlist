import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { initialState, validateState } from './public/model.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const dataDir=process.env.WISHFULLY_DATA_DIR||path.join(root,'data');
await mkdir(path.join(dataDir,'images'),{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'wishfully.sqlite'));
db.exec('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS wishfully_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)');
db.prepare('INSERT OR IGNORE INTO wishfully_state (id,payload,revision) VALUES (1,?,0)').run(JSON.stringify(initialState()));
const readState=()=>{const row=db.prepare('SELECT payload,revision FROM wishfully_state WHERE id=1').get();return {state:JSON.parse(row.payload),revision:row.revision};};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req,max){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(Error('Upload is too large.'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
export async function handler(req,res){
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'&&req.method!=='HEAD'){
   const origin=req.headers.origin;
   if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(res,403,{error:'This request must come from Wishfully.'});
   if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Cross-site requests are not allowed.'});
  }
  if(url.pathname==='/api/session'&&req.method==='GET')return json(res,200,{mode:'local',authenticated:true});
  if(url.pathname==='/api/state'){
   if(req.method==='GET')return json(res,200,readState());
   if(req.method==='PUT'){
    if(!req.headers['content-type']?.includes('application/json'))return json(res,415,{error:'Expected JSON.'});
    const data=JSON.parse((await body(req,1100000)).toString());validateState(data.state);
    if(!Number.isInteger(data.revision))return json(res,400,{error:'Invalid save version.'});
    const update=db.prepare('UPDATE wishfully_state SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(data.state),data.revision);
    if(update.changes===0)return json(res,409,{...readState(),error:'Another tab changed your wishes. The latest version is loaded; please try your change again.'});
    return json(res,200,readState());
   }
   return json(res,405,{error:'Method not allowed.'});
  }
  if(url.pathname==='/api/images'&&req.method==='POST'){
   if(req.headers['content-type']!=='image/webp')return json(res,415,{error:'Please upload a WebP image.'});
   const bytes=await body(req,2*1024*1024);
   if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')return json(res,400,{error:'This is not a valid image.'});
   const key=`${randomUUID()}.webp`;await writeFile(path.join(dataDir,'images',key),bytes,{flag:'wx'});return json(res,201,{url:`/api/images/${key}`});
  }
  let file;
  if(/^\/api\/images\/[a-f0-9-]+\.webp$/.test(url.pathname))file=path.join(dataDir,'images',path.basename(url.pathname));
  else if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found.'});
  else{const decoded=decodeURIComponent(url.pathname);file=path.resolve(root,'public',`.${decoded==='/'?'/index.html':decoded}`);if(!file.startsWith(path.join(root,'public')+path.sep))return json(res,403,{error:'Not allowed.'});}
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; img-src 'self' https: http: data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){if(e.code==='ENOENT')return json(res,404,{error:'Not found.'});json(res,e.status||400,{error:e.message||'Something went wrong.'});}
}
export function closeDatabase(){db.close();}
const server=http.createServer(handler);
const port=Number(process.env.PORT||4173);const host=process.env.HOST||'127.0.0.1';
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(port,host,()=>console.log(`Wishfully is ready at http://${host}:${port}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
