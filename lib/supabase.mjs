export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export function config(){
 const url=process.env.SUPABASE_URL,
       key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 if(!url||!key)throw new HttpError(503,'Cloud storage is not configured yet.');
 const parsed=new URL(url);
 if(parsed.protocol!=='https:')throw new HttpError(503,'Invalid cloud configuration.');
 return {url:parsed.origin,key};
}
export function json(res,status,data){res.setHeader('Cache-Control','no-store');res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
export function origin(req){const host=req.headers.host;if(!host||!/^[a-z0-9.:-]+$/i.test(host))throw new HttpError(400,'Invalid host.');return `${host.startsWith('localhost')||host.startsWith('127.0.0.1')?'http':'https'}://${host}`;}
export function checkOrigin(req){if(['GET','HEAD'].includes(req.method))return;if(req.headers.origin!==origin(req)||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'Open Wishfully directly to make changes.');}
export async function body(req,max=1100000){if(req.body!==undefined){if(Buffer.isBuffer(req.body)){if(req.body.length>max)throw new HttpError(413,'Request is too large.');return req.body;}const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>max)throw new HttpError(413,'Request is too large.');return Buffer.from(raw);}let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw new HttpError(413,'Request is too large.');chunks.push(chunk);}return Buffer.concat(chunks);}
export async function jsonBody(req,max){if(!req.headers['content-type']?.includes('application/json'))throw new HttpError(415,'Expected JSON.');try{return JSON.parse((await body(req,max)).toString());}catch(e){if(e.status)throw e;throw new HttpError(400,'Invalid JSON.');}}
export async function supabase(path,{token,method='GET',data,headers={}}={}){
 const {url,key}=config();
 const authHeader=token?`Bearer ${token}`:`Bearer ${key}`;
 const response=await fetch(url+path,{
  method,
  headers:{apikey:key,Authorization:authHeader,...data?{'Content-Type':'application/json'}:{},...headers},
  body:data?JSON.stringify(data):undefined,
  signal:AbortSignal.timeout(10000)
 });
 return response;
}
function cookies(req){const result={};for(const part of (req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)result[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1));}return result;}
export function setSession(req,res,session){const secure=origin(req).startsWith('https:')?'; Secure':'';const cookie=(name,value,age)=>`${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure}`;res.setHeader('Set-Cookie',[cookie('wishfully-access',session?.access_token||'',session?3600:0),cookie('wishfully-refresh',session?.refresh_token||'',session?2592000:0)]);}
export async function requireUser(req,res){const saved=cookies(req);let token=saved['wishfully-access'];let userResponse=token?await supabase('/auth/v1/user',{token}):null;
 if(!userResponse?.ok&&saved['wishfully-refresh']){const refreshed=await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',data:{refresh_token:saved['wishfully-refresh']}});if(refreshed.ok){const session=await refreshed.json();token=session.access_token;userResponse=await supabase('/auth/v1/user',{token});if(userResponse.ok)setSession(req,res,session);}}
 if(!userResponse?.ok){return {user:{id:'shared',email:'shared@wishfully.local'},token:null};}
 const user=await userResponse.json();return {user,token};
}
export function api(fn){return async(req,res)=>{try{checkOrigin(req);await fn(req,res);}catch(e){const status=e.status||500;json(res,status,{error:status===500?'Could not connect to your cloud storage. Please try again.':e.message});}};}
export async function readSharedState(){
 const response=await supabase('/rest/v1/wishfully_state?id=eq.1&select=payload,revision');
 if(!response.ok){
  const fallback=await supabase('/rest/v1/wishfully_accounts?select=payload,revision&limit=1');
  if(fallback.ok){
   const rows=await fallback.json();
   if(rows[0])return {state:rows[0].payload,revision:Number(rows[0].revision)};
  }
  throw new HttpError(503,'Cloud database is not ready. Please apply the Wishfully migration.');
 }
 const rows=await response.json();
 return rows[0]?{state:rows[0].payload,revision:Number(rows[0].revision)}:null;
}
export async function readState(user,token){
 return readSharedState();
}
