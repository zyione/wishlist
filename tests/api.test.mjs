import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';

const temp=await mkdtemp(path.join(os.tmpdir(),'wishfully-api-'));
process.env.WISHFULLY_DATA_DIR=temp;
const {handler,closeDatabase}=await import('../server.mjs');
after(async()=>{closeDatabase();await rm(temp,{recursive:true,force:true});});
async function request(url,{method='GET',body,headers={}}={}){
 const req=Readable.from(body?[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]:[]);
 Object.assign(req,{url,method,headers:{host:'localhost:4173',origin:'http://localhost:4173','content-type':'application/json',...headers}});
 let status,output,responseHeaders;
 const res={writeHead(s,h){status=s;responseHeaders=h;},end(bytes){output=bytes;}};
 await handler(req,res);
 return {status,headers:responseHeaders,bytes:output,json:()=>JSON.parse(output.toString())};
}
test('server saves renamed sections and multiple links; rejects stale saves without losing data',async()=>{
 const first=(await request('/api/state')).json();const next=structuredClone(first.state);
 next.sections[0].name='Cheap';next.wishes[0].description='Size M. Silver preferred.';
 next.wishes[0].links.push({id:'test-extra-link',label:'Another shop',url:'https://example.com/product',price:0,note:'Free gift'});
 const saved=await request('/api/state',{method:'PUT',body:{state:next,revision:first.revision}});
 assert.equal(saved.status,200);assert.equal(saved.json().revision,first.revision+1);
 const stale=await request('/api/state',{method:'PUT',body:{state:first.state,revision:first.revision}});
 assert.equal(stale.status,409);assert.equal(stale.json().state.sections[0].name,'Cheap');
 const reloaded=(await request('/api/state')).json();assert.equal(reloaded.state.wishes[0].links.length,4);assert.equal(reloaded.state.wishes[0].description,'Size M. Silver preferred.');
});
test('invalid links are rejected before updating stored data',async()=>{
 const current=(await request('/api/state')).json();const invalid=structuredClone(current.state);invalid.wishes[0].links[0].url='javascript:alert(1)';
 const res=await request('/api/state',{method:'PUT',body:{state:invalid,revision:current.revision}});assert.equal(res.status,400);assert.equal((await request('/api/state')).json().revision,current.revision);
});
test('uploaded images are persisted and retrieved; arbitrary files are rejected',async()=>{
 const image=Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA','base64');
 const res=await request('/api/images',{method:'POST',body:image,headers:{'content-type':'image/webp'}});assert.equal(res.status,201);
 const get=await request(res.json().url);assert.equal(get.status,200);assert.deepEqual(get.bytes,image);assert.equal(get.headers['Content-Type'],'image/webp');
 const bad=await request('/api/images',{method:'POST',body:Buffer.from('<script>bad</script>'),headers:{'content-type':'image/webp'}});assert.equal(bad.status,400);
});
test('cross-origin writes, missing assets, and wrong API methods are handled',async()=>{
 assert.equal((await request('/api/state',{method:'PUT',headers:{origin:'https://unrelated.example'}})).status,403);
 assert.equal((await request('/api/state',{method:'DELETE'})).status,405);
 assert.equal((await request('/missing.svg')).status,404);
 const page=await request('/');assert.equal(page.status,200);assert.match(page.bytes.toString(),/Wishfully/);
});
