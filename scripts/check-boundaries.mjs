import {readdir,readFile} from 'node:fs/promises';
const files=[];async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){if(['node_modules','dist','.next'].includes(entry.name))continue;const name=path+'/'+entry.name;if(entry.isDirectory())await walk(name);else if(/\.(tsx?|mjs)$/.test(name))files.push(name);}}
await walk('apps');await walk('packages');let errors=0;
for(const file of files){const source=await readFile(file,'utf8');if(file.startsWith('apps/web/')&&/from\s+['"](?:@st\/(?:business|database|integrations)|pg|@nestjs\/)/.test(source)){console.error(file+': presentation imports backend runtime');errors++;}if(/\b(?:as any|:\s*any)\b/.test(source)){console.error(file+': unexplained any');errors++;}if(/(?:sk_test_|sk_live_|AKIA)[A-Za-z0-9]{16}/.test(source)){console.error(file+': possible embedded credential');errors++;}}
console.log(`Checked ${files.length} source files for enforced import/type/secret boundaries.`);if(errors)process.exitCode=1;
