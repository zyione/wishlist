import {api,json,HttpError} from '../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method==='GET'){
  return json(res,200,{mode:'cloud',authenticated:true,shared:true});
 }
 if(req.method==='DELETE'){
  return json(res,200,{signedOut:true});
 }
 if(req.method==='POST'){
  return json(res,200,{mode:'cloud',authenticated:true,shared:true});
 }
 throw new HttpError(405,'Method not allowed.');
});
