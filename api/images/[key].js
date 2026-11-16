import {api,supabase,HttpError} from '../../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method!=='GET')throw new HttpError(405,'Method not allowed.');
 const key=req.query?.key||new URL(req.url,'https://localhost').pathname.split('/').pop();
 if(typeof key!=='string'||!/^[a-f0-9-]+\.webp$/.test(key))throw new HttpError(404,'Image not found.');
 let response=await supabase(`/storage/v1/object/public/wishfully-images/shared/${key}`);
 if(!response.ok){
  response=await supabase(`/storage/v1/object/authenticated/wishfully-images/shared/${key}`);
 }
 if(!response.ok)throw new HttpError(response.status===404?404:503,'Image could not be opened.');
 res.setHeader('Content-Type','image/webp');
 res.setHeader('Cache-Control','public, max-age=86400');
 res.statusCode=200;
 res.end(Buffer.from(await response.arrayBuffer()));
});
