import { initialState, validateState } from '../public/model.js';

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const json=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  try{
   if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==url.origin)return json(403,{error:'This request must come from Wishfully.'});
   const load=async()=>{const row=await env.DB.prepare('SELECT payload,revision FROM wishfully_state WHERE id=1').first();return row?{state:JSON.parse(row.payload),revision:row.revision}:{state:initialState(),revision:0};};
   if(url.pathname==='/api/state'){
    if(request.method==='GET'){
     await env.DB.prepare('INSERT OR IGNORE INTO wishfully_state(id,payload,revision) VALUES(1,?,0)').bind(JSON.stringify(initialState())).run();
     return json(200,await load());
    }
    if(request.method==='PUT'){
     const text=await request.text();if(text.length>1100000)return json(413,{error:'Wishlist is too large.'});
     const data=JSON.parse(text);validateState(data.state);if(!Number.isInteger(data.revision))return json(400,{error:'Invalid save version.'});
     const result=await env.DB.prepare('UPDATE wishfully_state SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data.state),data.revision).run();
     if(!result.meta.changes)return json(409,{...await load(),error:'Another tab changed your wishes. Please try again.'});
     return json(200,await load());
    }
    return json(405,{error:'Method not allowed.'});
   }
   if(url.pathname==='/api/images'&&request.method==='POST'){
    if(request.headers.get('Content-Type')!=='image/webp')return json(415,{error:'Please upload a WebP image.'});
    const bytes=await request.arrayBuffer();if(bytes.byteLength>2097152)return json(413,{error:'Image must be smaller than 2 MB.'});
    const b=new Uint8Array(bytes);if(new TextDecoder().decode(b.slice(0,4))!=='RIFF'||new TextDecoder().decode(b.slice(8,12))!=='WEBP')return json(400,{error:'Invalid image.'});
    const key=`${crypto.randomUUID()}.webp`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/webp'}});return json(201,{url:`/api/images/${key}`});
   }
   if(/^\/api\/images\/[a-f0-9-]+\.webp$/.test(url.pathname)){
    const image=await env.BUCKET.get(url.pathname.split('/').pop());if(!image)return json(404,{error:'Image not found.'});return new Response(image.body,{headers:{'Content-Type':'image/webp','X-Content-Type-Options':'nosniff'}});
   }
   if(url.pathname.startsWith('/api/'))return json(404,{error:'Not found.'});
   const key=url.pathname==='/'?'/index.html':url.pathname;const asset=ASSETS[key];
   if(!asset)return json(404,{error:'Not found.'});
   return new Response(request.method==='HEAD'?null:(asset.binary?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body),{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
  }catch(e){return json(400,{error:e.message||'Could not complete this request.'});}
 }
};
