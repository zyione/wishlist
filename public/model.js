export function safeUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function lowestPrice(wish){const prices=wish.links.filter(l=>l.price!==null&&l.price!==undefined).map(l=>l.price);return prices.length?Math.min(...prices):null;}
export function validateState(s){
 if(!s||s.version!==1||!Array.isArray(s.lists)||s.lists.length!==2||!Array.isArray(s.sections)||!Array.isArray(s.wishes))throw Error('Invalid wishlist data.');
 if(s.wishes.length>1500||s.sections.length>100)throw Error('This space supports up to 1,500 wishes and 100 sections.');
 const ids=new Set();const id=v=>{if(typeof v!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(v)||ids.has(v))throw Error('Invalid or duplicate identifier.');ids.add(v);};
 const text=(v,max,required=false)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Please check required text fields and their length.');};
 s.lists.forEach(l=>{id(l.id);text(l.name,50,true);text(l.description,500);if(!['blue','rose'].includes(l.theme))throw Error('Invalid theme.');});
 const listIds=new Set(s.lists.map(l=>l.id));
 s.sections.forEach(a=>{id(a.id);text(a.name,60,true);if(!listIds.has(a.listId)||!Number.isFinite(a.order))throw Error('Invalid section.');});
 s.wishes.forEach(w=>{id(w.id);text(w.name,120,true);text(w.description,4000);text(w.image,3000);if(w.image&&!w.image.startsWith('/assets/')&&!/^\/api\/images\/[a-f0-9-]+\.webp$/.test(w.image)&&!safeUrl(w.image))throw Error('Use a valid http or https image URL.');if(!listIds.has(w.listId)||!Number.isFinite(w.createdAt)||typeof w.favorite!=='boolean'||typeof w.obtained!=='boolean')throw Error('Invalid wish.');if(w.sectionId!==null&&!s.sections.some(a=>a.id===w.sectionId&&a.listId===w.listId))throw Error('Section must belong to the same wishlist.');if(!Array.isArray(w.links)||w.links.length>30)throw Error('A wish can have up to 30 shop links.');w.links.forEach(l=>{id(l.id);text(l.label,80,true);text(l.url,2500,true);text(l.note,200);if(!safeUrl(l.url))throw Error('Shop links must start with http:// or https://.');if(l.price!==null&&(typeof l.price!=='number'||!Number.isFinite(l.price)||l.price<0||l.price>1e9))throw Error('Enter a valid price of zero or more.');});});
 if(JSON.stringify(s).length>900000)throw Error('This wishlist is too large to save. Please export a backup and shorten long descriptions.');return true;
}
export function initialState(){const now=Date.now();const shop=(id,label,url,price,note='Demo shop link — replace with the exact product')=>({id,label,url,price,note});
 const wish=(id,listId,sectionId,name,description,image,price,favorite=false)=>({id,listId,sectionId,name,description,image:`/assets/${image}.svg`,favorite,obtained:false,createdAt:now-Number(id.replace(/\D/g,''))*86400000,links:[shop(`${id}-shop`,'Official store','https://www.apple.com/ph/',price)]});
 const wishes=[
 wish('w1','his','his-main','Everyday headphones','Silver preferred. A little quiet for work, music, and everything in between.','headphones',8990,true),
 wish('w2','his','his-main','The everyday sneaker','Clean white, easy to wear. Something that goes with almost anything.','sneaker',5490),
 wish('w3','his','his-main','A classic timepiece','A simple dial, a dark strap, and a little less checking my phone.','watch',12990),
 wish('w4','his','his-main','Pocket-sized memories','A compact digital camera for the ordinary days worth remembering.','camera',24990),
 wish('w5','his','his-fun','One more game','A wireless controller for a quiet evening and a very competitive weekend.','controller',3990),
 wish('w6','his','his-fun','A tiny dream car','A little piece of the dream, until the real one has a place in the garage.','car',2490),
 wish('w7','her','her-main','Everyday headphones','Silver, please. For favorite playlists and a moment to myself.','headphones',8990,true),
 wish('w8','her','her-main','The little shoulder bag','Soft neutrals, just the right size for the everyday essentials.','bag',7990),
 wish('w9','her','her-main','Keep the little moments','A small digital camera to take everywhere. Silver is my favorite.','camera',24990),
 wish('w10','her','her-main','Weekend whites','A comfortable pair for coffee runs, long walks, and unplanned adventures.','sneaker',5490),
 wish('w11','her','her-cute','Coffee, but cuter','A little ceramic cup for slow mornings. Warm white or soft pink.','cup',650),
 wish('w12','her','her-cute','A softer kind of day','Something cozy for evenings with a book and nowhere else to be.','candle',490)
 ];
 const urls={w2:'https://www.nike.com/ph/',w3:'https://www.casio.com/',w4:'https://www.sony.com.ph/',w5:'https://www.playstation.com/',w6:'https://www.tamiya.com/',w8:'https://www.uniqlo.com/ph/',w9:'https://www.sony.com.ph/',w10:'https://www.nike.com/ph/',w11:'https://www.ikea.com/ph/en/',w12:'https://www.ikea.com/ph/en/'};for(const w of wishes){if(urls[w.id])w.links[0].url=urls[w.id];if(['w1','w7'].includes(w.id)){w.links.push(shop(`${w.id}-shopee`,'Shopee','https://shopee.ph/',9250));w.links.push(shop(`${w.id}-lazada`,'Lazada','https://www.lazada.com.ph/',9490));}}
 return {version:1,lists:[{id:'his',name:'His wishlist',description:'Good things, saved for someday.',theme:'blue'},{id:'her',name:'Her wishlist',description:'Little things to love. Big things to look forward to.',theme:'rose'}],sections:[{id:'his-main',listId:'his',name:'Main',order:0},{id:'his-fun',listId:'his',name:'Fun',order:1},{id:'her-main',listId:'her',name:'Main',order:0},{id:'her-cute',listId:'her',name:'Cute',order:1}],wishes};
}
