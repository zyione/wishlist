import {api,json,jsonBody,supabase,origin,HttpError} from '../lib/supabase.mjs';
export default api(async(req,res)=>{
 if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
 const {email}=await jsonBody(req,2000);if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw new HttpError(400,'Enter a valid email address.');
 const response=await supabase(`/auth/v1/otp?redirect_to=${encodeURIComponent(origin(req)+'/')}`,{method:'POST',data:{email:email.trim(),create_user:true}});
 if(response.status===429)throw new HttpError(429,'Please wait a little before requesting another sign-in email.');
 if(!response.ok)throw new HttpError(400,'Could not send the sign-in email. Please try again.');
 json(res,200,{sent:true});
});
