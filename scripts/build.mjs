import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const assets={};
async function scan(dir){for(const file of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,file.name);if(file.isDirectory())await scan(full);else{const key='/'+path.relative(path.join(root,'public'),full).replaceAll('\\','/');const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(full)]||'application/octet-stream';const binary=path.extname(full)==='.woff2';assets[key]={body:binary?(await readFile(full)).toString('base64'):await readFile(full,'utf8'),type,binary};}}}
await scan(path.join(root,'public'));
const model=(await readFile(path.join(root,'public/model.js'),'utf8')).replaceAll('export function','function');
const worker=(await readFile(path.join(root,'worker/index.js'),'utf8')).replace("import { initialState, validateState } from '../public/model.js';",'');
await mkdir(path.join(root,'dist/server'),{recursive:true});
await writeFile(path.join(root,'dist/server/index.js'),`const ASSETS=${JSON.stringify(assets)};\n${model}\n${worker}`);
console.log(`Built Worker with ${Object.keys(assets).length} bundled assets.`);
