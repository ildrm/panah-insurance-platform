import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Database} from '@st/database';
async function main():Promise<void>{
const db=new Database();
try {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
  for(const [folder,prefix] of [['packages/database/migrations','platform/'],['packages/business/migrations','business/'],['packages/integrations/migrations','integrations/'],['packages/finance/migrations','finance/'],['packages/controls/migrations','controls/']] as const)for(const file of (await readdir(folder)).filter(n=>n.endsWith('.sql')).sort()){
    const name=prefix+file,sql=await readFile(folder+'/'+file,'utf8'),hash=createHash('sha256').update(sql).digest('hex');
    const legacy=prefix==='platform/'?(await db.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE version=$1',[file])).rows[0]:undefined;
    if(legacy){if(legacy.checksum!==hash)throw new Error('Migration drift: '+file);await db.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2) ON CONFLICT DO NOTHING',[name,hash]);continue;}
    await db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock(8172351)');const old=(await tx.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE version=$1',[name])).rows[0];if(old){if(old.checksum!==hash)throw new Error('Migration drift: '+name);return;}await tx.query(sql);await tx.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)',[name,hash]);});
  }
  console.log('Platform, business, integration, finance and scoped-control migrations applied with immutable checksums.');
} finally {await db.close();}

}
void main();
