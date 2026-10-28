import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {verifyRecoveryState} from './backup-restore.mjs';

async function main():Promise<void>{
  const artifact=process.argv[2];const databaseUrl=process.env['RECOVERY_DATABASE_URL'];
  if(!artifact||!databaseUrl)throw new Error('Provide a backup directory and RECOVERY_DATABASE_URL for a generated st_restore database.');
  const manifest:unknown=JSON.parse(await readFile(resolve(artifact,'manifest.json'),'utf8'));
  const result=await verifyRecoveryState({databaseUrl,manifest,objectDirectory:resolve(artifact,'restored-objects')});
  console.log(JSON.stringify(result,null,2));
  if(!result.verified)process.exitCode=1;
}
void main().catch((error:unknown)=>{console.error(error instanceof Error?error.message:'Verification failed');process.exitCode=1;});
