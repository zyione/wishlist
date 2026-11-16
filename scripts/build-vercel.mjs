import {cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
await mkdir(new URL('vercel-public/',root),{recursive:true});
await cp(new URL('public/',root),new URL('vercel-public/',root),{recursive:true});
console.log(`Vercel frontend ready: ${fileURLToPath(new URL('vercel-public/',root))}`);
