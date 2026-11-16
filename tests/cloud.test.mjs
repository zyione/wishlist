import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import stateApi from '../api/state.js';
import sessionApi from '../api/session.js';
import uploadApi from '../api/images/index.js';
import imageApi from '../api/images/[key].js';
import {initialState} from '../public/model.js';

const userId='9d09913e-9228-4c4d-bf4b-10e320b774df';
async function call(handler,{method='GET',url='/api/state',body,headers={},query={}}={}){
 const req=Readable.from(body?[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]:[]);
 Object.assign(req,{method,url,query,headers:{host:'wishfully.example',origin:'https://wishfully.example','content-type':'application/json',cookie:'wishfully-access=test-token',...headers}});
 let output;const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},end(v){output=v;}};
 await handler(req,res);return {status:res.statusCode,headers:res.headers,bytes:output,json:()=>JSON.parse(output.toString())};
}
test('cloud endpoints require sign-in and reject cross-site writes',async()=>{
 assert.equal((await call(stateApi,{headers:{cookie:''}})).status,401);
 assert.equal((await call(stateApi,{method:'PUT',headers:{origin:'https://unrelated.example'}})).status,403);
 const session=await call(sessionApi,{headers:{cookie:''}});assert.equal(session.status,200);assert.equal(session.json().authenticated,false);
});
test('cloud persistence uses the signed-in user and preserves concurrent edits',async()=>{
 const originalFetch=globalThis.fetch;const savedUrl=process.env.SUPABASE_URL,savedKey=process.env.SUPABASE_PUBLISHABLE_KEY;
 process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='test-publishable';
 let row={payload:initialState(),revision:0};const requests=[];
 globalThis.fetch=async(input,options={})=>{const url=new URL(input);requests.push({url,options});if(url.pathname==='/auth/v1/user')return Response.json({id:userId,email:'owner@example.com'});if(url.pathname==='/rest/v1/wishfully_accounts'){
  assert.equal(url.searchParams.get('user_id'),'eq.'+userId);assert.equal(options.headers.Authorization,'Bearer test-token');
  if(options.method==='PATCH'){if(url.searchParams.get('revision')!=='eq.'+row.revision)return Response.json([]);row=JSON.parse(options.body);return Response.json([row]);}return Response.json([row]);
 }throw Error('Unexpected remote call.');};
 try{
  const first=(await call(stateApi)).json();const next=structuredClone(first.state);next.sections[0].name='Cute things';
  const put=await call(stateApi,{method:'PUT',body:{state:next,revision:0}});assert.equal(put.status,200);assert.equal(put.json().revision,1);
  const stale=await call(stateApi,{method:'PUT',body:{state:first.state,revision:0}});assert.equal(stale.status,409);assert.equal(stale.json().state.sections[0].name,'Cute things');
  const invalid=structuredClone(next);invalid.wishes[0].links[0].url='javascript:alert(1)';assert.equal((await call(stateApi,{method:'PUT',body:{state:invalid,revision:1}})).status,400);
 }finally{globalThis.fetch=originalFetch;savedUrl===undefined?delete process.env.SUPABASE_URL:process.env.SUPABASE_URL=savedUrl;savedKey===undefined?delete process.env.SUPABASE_PUBLISHABLE_KEY:process.env.SUPABASE_PUBLISHABLE_KEY=savedKey;}
});
test('cloud images are stored and read inside the signed-in user folder',async()=>{
 const originalFetch=globalThis.fetch;const savedUrl=process.env.SUPABASE_URL,savedKey=process.env.SUPABASE_PUBLISHABLE_KEY;
 process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='test-publishable';let image;
 globalThis.fetch=async(input,options={})=>{const url=new URL(input);if(url.pathname==='/auth/v1/user')return Response.json({id:userId});assert.ok(url.pathname.includes('/wishfully-images/'+userId+'/'));assert.equal(options.headers.Authorization,'Bearer test-token');if(options.method==='POST'){image=options.body;return Response.json({Key:'saved'});}return new Response(image,{headers:{'Content-Type':'image/webp'}});};
 try{
  const bytes=Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA','base64');
  const upload=await call(uploadApi,{url:'/api/images',method:'POST',body:bytes,headers:{'content-type':'image/webp'}});assert.equal(upload.status,201);
  const key=upload.json().url.split('/').pop();const read=await call(imageApi,{url:upload.json().url,query:{key}});assert.equal(read.status,200);assert.deepEqual(read.bytes,bytes);
  assert.equal((await call(imageApi,{query:{key:'../someone-else/image.webp'}})).status,404);
 }finally{globalThis.fetch=originalFetch;savedUrl===undefined?delete process.env.SUPABASE_URL:process.env.SUPABASE_URL=savedUrl;savedKey===undefined?delete process.env.SUPABASE_PUBLISHABLE_KEY:process.env.SUPABASE_PUBLISHABLE_KEY=savedKey;}
});
