import {api,json,jsonBody,supabase,requireUser,setSession,HttpError} from '../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method==='GET'){try{const {user}=await requireUser(req,res);json(res,200,{mode:'cloud',authenticated:true,email:user.email});}catch(e){if(e.status!==401)throw e;json(res,200,{mode:'cloud',authenticated:false});}return;}
 if(req.method==='DELETE'){setSession(req,res,null);return json(res,200,{signedOut:true});}
 if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
 const data=await jsonBody(req,20000);if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||data.access_token.length>16000||data.refresh_token.length>3000)throw new HttpError(400,'Invalid sign-in link.');
 const response=await supabase('/auth/v1/user',{token:data.access_token});if(!response.ok)throw new HttpError(401,'This sign-in link has expired. Please request a new one.');
 setSession(req,res,data);const user=await response.json();json(res,200,{mode:'cloud',authenticated:true,email:user.email});
});
