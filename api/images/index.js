import {randomUUID} from 'node:crypto';
import {api,config,json,body,HttpError} from '../../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
 if(req.headers['content-type']!=='image/webp')throw new HttpError(415,'Please upload a WebP image.');
 const bytes=await body(req,2097152);
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw new HttpError(400,'This is not a valid image.');
 const name=`${randomUUID()}.webp`,{url,key}=config();
 const response=await fetch(`${url}/storage/v1/object/wishfully-images/shared/${name}`,{
  method:'POST',
  headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'image/webp','x-upsert':'false'},
  body:bytes,
  signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new HttpError(503,'Could not save the image. Check that the storage bucket is ready.');
 json(res,201,{url:`/api/images/${name}`});
});
