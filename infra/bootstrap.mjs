import {spawnSync} from 'node:child_process';
const database=new URL(process.env.DATABASE_URL??'postgresql://invalid');
if(process.env.APP_MODE!=='sandbox'||database.hostname!=='db'||database.pathname!=='/st_local')throw new Error('Container bootstrap only writes the declared local sandbox service database.');
for(const task of ['db:migrate','db:seed','sandbox:controls','sandbox:publish']){
  const result=spawnSync('npm',['run',task],{stdio:'inherit',env:process.env});
  if(result.status!==0)throw new Error('Local bootstrap failed at '+task+'; application services remain gated.');
}
