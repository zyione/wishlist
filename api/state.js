import {api,json,jsonBody,supabase,readSharedState,HttpError} from '../lib/supabase.mjs';
import {initialState,validateState} from '../public/model.js';
export default api(async(req,res)=>{
 if(!['GET','PUT'].includes(req.method))throw new HttpError(405,'Method not allowed.');
 if(req.method==='GET'){
  let current=await readSharedState();
  if(!current){
   const response=await supabase('/rest/v1/wishfully_state?on_conflict=id',{
    method:'POST',
    data:{id:1,payload:initialState(),revision:0},
    headers:{Prefer:'resolution=ignore-duplicates'}
   });
   if(!response.ok)throw new HttpError(503,'Could not initialize your wishlist. Please check the database migration.');
   current=await readSharedState();
  }
  return json(res,200,current);
 }
 const data=await jsonBody(req);
 try{validateState(data.state);}catch(e){throw new HttpError(400,e.message);}
 if(!Number.isSafeInteger(data.revision)||data.revision<0)throw new HttpError(400,'Invalid save version.');
 const response=await supabase(`/rest/v1/wishfully_state?id=eq.1&revision=eq.${data.revision}`,{
  method:'PATCH',
  data:{payload:data.state,revision:data.revision+1},
  headers:{Prefer:'return=representation'}
 });
 if(!response.ok)throw new HttpError(503,'Could not save your wishes. Please try again.');
 const rows=await response.json();
 if(!rows.length)return json(res,409,{...await readSharedState(),error:'Another tab changed your wishes. The latest version is loaded; please try again.'});
 json(res,200,{state:rows[0].payload,revision:Number(rows[0].revision)});
});
