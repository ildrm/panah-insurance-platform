import {spawnSync} from 'node:child_process';import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {randomBytes} from 'node:crypto';
const mode=process.env.APP_MODE??'sandbox';if(mode!=='sandbox')throw new Error('This setup command is restricted to local sandbox data.');
mkdirSync('.local',{recursive:true});
if(!existsSync('.env.local'))writeFileSync('.env.local',`APP_MODE=sandbox\nDATABASE_URL=postgresql://st@127.0.0.1:55432/st_local\nST_CURSOR_SECRET=${randomBytes(32).toString('hex')}\n`,{mode:0o600});
process.loadEnvFile('.env.local');
const run=(command,args)=>{const r=spawnSync(command,args,{stdio:'inherit',env:process.env});if(r.status!==0)throw new Error(`${command} failed; check the preceding output.`);};
console.log('Ensure PostgreSQL is running at the configured isolated DATABASE_URL (native or infra/compose.yaml).');
run('npm',['run','build:packages']);run('npm',['run','db:migrate']);run('npm',['run','db:seed']);run('npm',['run','sandbox:controls']);console.log('Local migrations and synthetic seeds complete. Run npm run dev.');
