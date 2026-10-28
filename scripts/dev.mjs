import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const services=[['simulators',['apps/simulators/dist/main.js']],['api',['apps/api/dist/main.js']],['worker',['apps/worker/dist/main.js']],['web',['node_modules/next/dist/bin/next','dev','apps/web','--hostname','127.0.0.1','--port','3000']]];
const children=services.map(([name,args])=>{const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,APP_MODE:'sandbox'}});for(const stream of [child.stdout,child.stderr])stream.on('data',data=>process.stdout.write(`[${name}] ${data}`));child.on('exit',code=>{if(code&&code!==0){console.error(`${name} stopped with ${code}`);stop();}});return child;});
function stop(){for(const child of children)child.kill('SIGTERM');}
process.once('SIGINT',stop);process.once('SIGTERM',stop);
console.log('Local sandbox: http://127.0.0.1:3000. No real partner or money operations are enabled.');
void (async()=>{for(let attempt=0;attempt<40;attempt++){try{await fetch('http://127.0.0.1:3100/health');const seeded=spawn(process.execPath,['--import','tsx','scripts/seed-carriers.ts'],{stdio:'inherit',env:process.env});seeded.on('exit',code=>{if(code)console.error('Sandbox connections need verification; run npm run sandbox:publish.');});return;}catch{await new Promise(resolve=>setTimeout(resolve,250));}}console.error('Local simulators did not become reachable; sandbox connection publication remains pending.');})();
