import {api,json,HttpError} from '../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
 json(res,200,{sent:false,message:'Email login is disabled. Wishfully is running in shared mode.'});
});
