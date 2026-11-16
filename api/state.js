import {api,requireUser,json,jsonBody,supabase,readState,HttpError} from '../lib/supabase.mjs';
import {initialState,validateState} from '../public/model.js';
export default api(async(req,res)=>{
 if(!['GET','PUT'].includes(req.method))throw new HttpError(405,'Method not allowed.');
 const {user,token}=await requireUser(req,res);
 if(req.method==='GET'){
  let current=await readState(user,token);
  if(!current){const response=await supabase('/rest/v1/wishfully_accounts?on_conflict=user_id',{method:'POST',token,data:{user_id:user.id,payload:initialState(),revision:0},headers:{Prefer:'resolution=ignore-duplicates'}});if(!response.ok)throw new HttpError(503,'Could not create your wishlist. Please check the database migration.');current=await readState(user,token);}
  return json(res,200,current);
 }
 const data=await jsonBody(req);try{validateState(data.state);}catch(e){throw new HttpError(400,e.message);}if(!Number.isSafeInteger(data.revision)||data.revision<0)throw new HttpError(400,'Invalid save version.');
 const response=await supabase(`/rest/v1/wishfully_accounts?user_id=eq.${encodeURIComponent(user.id)}&revision=eq.${data.revision}`,{method:'PATCH',token,data:{payload:data.state,revision:data.revision+1},headers:{Prefer:'return=representation'}});
 if(!response.ok)throw new HttpError(503,'Could not save your wishes. Please try again.');const rows=await response.json();
 if(!rows.length)return json(res,409,{...await readState(user,token),error:'Another tab changed your wishes. The latest version is loaded; please try again.'});
 json(res,200,{state:rows[0].payload,revision:Number(rows[0].revision)});
});
