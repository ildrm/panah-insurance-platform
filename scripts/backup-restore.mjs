import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile,readFile,copyFile,lstat,readdir,chmod} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Database} from '@st/database';

const REQUIRED=['journals','postings','orders','outbox','inbox','submissions','policies'];
const ownedRestoreDatabases=new Set();
function safeName(name){if(!/^[a-z][a-z0-9_]{0,62}$/.test(name))throw new Error('Unsupported database identifier.');return '"'+name+'"';}
export function localRecoveryUrl(input){const url=new URL(input);if(url.protocol!=='postgresql:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.search)throw new Error('Recovery is restricted to loopback PostgreSQL without arbitrary connection options.');const name=decodeURIComponent(url.pathname.slice(1));if(name!=='st_local'&&!/^st_(recovery_fixture|restore)_[a-f0-9]{32}$/.test(name))throw new Error('Source must be the task local database or a generated recovery fixture.');if(!url.username)throw new Error('Explicit local database role is required.');return url;}
function environment(url,database){return {...process.env,PGHOST:url.hostname.replace(/^\[|\]$/g,''),PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:database,PGCONNECT_TIMEOUT:'5'};}
async function command(binary,args,env){await new Promise((done,fail)=>{const child=spawn(binary,args,{env,stdio:['ignore','ignore','pipe']});let stderr='';const timeout=setTimeout(()=>{child.kill('SIGTERM');fail(new Error(binary+' exceeded the local drill deadline.'));},120000);child.stderr.on('data',b=>{if(stderr.length<2048)stderr+=b.toString();});child.once('error',error=>{clearTimeout(timeout);fail(new Error(binary+' could not start: '+error.code));});child.once('exit',code=>{clearTimeout(timeout);if(code===0)done();else fail(new Error(binary+' failed with exit '+code+'; the source was not modified. Diagnostic class: '+(stderr.includes('authentication')?'authentication':stderr.includes('permission')?'permission':'database-or-artifact')));});});}
async function hashFile(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}
function objectPath(directory,key){if(typeof key!=='string'||!key||key.includes('\\')||key.split('/').some(p=>p==='..'||p==='.'||p===''))throw new Error('Unsafe object key.');const base=resolve(directory),path=resolve(base,key);if(!path.startsWith(base+sep))throw new Error('Object key escapes private storage.');return path;}
async function* files(directory,base=directory){let entries;try{entries=await readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){const path=resolve(directory,entry.name);if(entry.isSymbolicLink())throw new Error('Recovery refuses symbolic links in private object storage.');if(entry.isDirectory())yield*files(path,base);else if(entry.isFile())yield{key:relative(base,path).split(sep).join('/'),path};}}
export async function fingerprintDatabase(client){
  const tableRows=(await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
  const names=tableRows.map(r=>r.tablename);for(const name of REQUIRED)if(!names.includes(name))throw new Error('Expected application schema is missing: '+name);
  const columns=(await client.query("SELECT table_name,column_name,ordinal_position,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows;
  const schemaSha256=createHash('sha256').update(JSON.stringify(columns)).digest('hex');const tables=[];
  for(let index=0;index<names.length;index++){
    const name=names[index];safeName(name);
    const pk=(await client.query("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid=$1::regclass AND i.indisprimary ORDER BY array_position(i.indkey,a.attnum)",['public.'+name])).rows.map(r=>r.attname);
    const order=pk.length?pk.map(safeName).join(','):'row_to_json(t)::text';const cursor='recovery_cursor_'+index;
    await client.query(`DECLARE ${cursor} NO SCROLL CURSOR FOR SELECT row_to_json(t)::text AS row_text FROM public.${safeName(name)} t ORDER BY ${order}`);
    const hash=createHash('sha256');let count=0n;
    for(;;){const batch=(await client.query(`FETCH FORWARD 500 FROM ${cursor}`)).rows;if(!batch.length)break;for(const row of batch){const bytes=Buffer.from(row.row_text);hash.update(String(bytes.length)+':');hash.update(bytes);hash.update('\n');count++;}}
    await client.query(`CLOSE ${cursor}`);tables.push({table:name,rows:count.toString(),sha256:hash.digest('hex')});
  }
  const unbalanced=Number((await client.query('SELECT count(*)::int AS count FROM (SELECT j.id FROM journals j LEFT JOIN postings p ON p.journal_id=j.id GROUP BY j.id HAVING COALESCE(sum(p.amount),0)<>0 OR count(p.id)<2) bad')).rows[0].count);
  const summary=(await client.query("SELECT count(*) FILTER(WHERE state='committed' AND payment_state='verified' AND issuance_state<>'issued')::int AS paid_unissued,count(*) FILTER(WHERE state='committed' AND payment_state='wallet' AND issuance_state<>'issued')::int AS wallet_unissued,count(*) FILTER(WHERE issuance_state='external_outcome_unknown')::int AS unknown_orders,count(*) FILTER(WHERE payment_state='credit')::int AS credit_orders FROM orders")).rows[0];
  const policyMismatch=Number((await client.query("SELECT count(*)::int AS count FROM policies p JOIN orders o ON o.id=p.order_id WHERE o.issuance_state<>'issued'")).rows[0].count);
  const issuedWithoutPolicy=Number((await client.query("SELECT count(*)::int AS count FROM orders o WHERE o.issuance_state='issued' AND NOT EXISTS(SELECT 1 FROM policies p WHERE p.order_id=o.id)")).rows[0].count);
  const commitmentCounts=(await client.query(`
    WITH commitment_state AS (
      SELECT o.id,o.commitment_kind,o.payment_state,
        (SELECT count(*) FROM outbox e WHERE e.aggregate_id=o.id AND e.event_type IN('purchase.committed.v1','purchase.committed.v2')) AS event_count,
        (SELECT count(*) FROM outbox e WHERE e.aggregate_id=o.id AND e.event_type IN('purchase.committed.v1','purchase.committed.v2')
          AND e.tenant_id=o.tenant_id AND e.payload->>'orderId'=o.id::text
          AND e.payload->>'tenantId'=o.tenant_id::text AND e.payload->>'ownerId'=o.owner_id::text
          AND e.payload->>'productId'=o.product_id AND e.payload->>'carrierId'=o.carrier_id
          AND e.payload->>'commitmentKind'=o.commitment_kind
          AND ((e.event_type='purchase.committed.v1' AND o.commitment_kind IN('verified_payment','approved_credit'))
            OR (e.event_type='purchase.committed.v2' AND o.commitment_kind='verified_wallet_allocation'
              AND e.payload->>'walletSpendId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              AND NOT(e.payload ?| ARRAY['paymentReceiptId','paymentReceiptIds','paymentProviderReference'])))) AS matching_event_count,
        (SELECT count(*) FROM submissions s WHERE s.order_id=o.id) AS submission_count,
        (SELECT count(*) FROM submissions s WHERE s.order_id=o.id AND s.carrier_id=o.carrier_id) AS matching_submission_count
      FROM orders o WHERE o.state='committed'
    )
    SELECT count(*)::int AS committed_orders,
      count(*) FILTER(WHERE event_count=0)::int AS missing_commitment_events,
      count(*) FILTER(WHERE event_count>1)::int AS duplicate_commitment_events,
      count(*) FILTER(WHERE event_count=1 AND matching_event_count<>1)::int AS mismatched_commitment_events,
      count(*) FILTER(WHERE submission_count=0)::int AS missing_submissions,
      count(*) FILTER(WHERE submission_count<>0 AND (submission_count<>1 OR matching_submission_count<>1))::int AS mismatched_submissions,
      count(*) FILTER(WHERE NOT(COALESCE(commitment_kind='verified_payment' AND payment_state='verified',false)
        OR COALESCE(commitment_kind='approved_credit' AND payment_state='credit',false)
        OR COALESCE(commitment_kind='verified_wallet_allocation' AND payment_state='wallet',false)))::int AS invalid_commitment_kinds
    FROM commitment_state`)).rows[0];
  const sourceConsistency={
    scope:'Ledger balance, policy/order states and canonical committed order/event/submission consistency; not a complete financial provenance or production audit',
    ...commitmentCounts,unbalanced_journals:unbalanced,policy_order_mismatches:policyMismatch,issued_orders_without_policy:issuedWithoutPolicy
  };
  sourceConsistency.valid=Object.entries(sourceConsistency).every(([key,value])=>key==='scope'||key==='committed_orders'||value===0);
  const queue=(await client.query('SELECT state,count(*)::text AS count FROM outbox GROUP BY state ORDER BY state')).rows;
  const submissionStates=(await client.query('SELECT state,count(*)::text AS count FROM submissions GROUP BY state ORDER BY state')).rows;
  const documents=(await client.query("SELECT document_key AS key,data->>'documentSha256' AS sha256 FROM policies WHERE document_key IS NOT NULL ORDER BY document_key")).rows;
  return {schemaSha256,tables,invariants:{balancedJournals:unbalanced===0,policyOrderStatesConsistent:policyMismatch===0&&issuedWithoutPolicy===0,...summary,outboxStates:queue,submissionStates},sourceConsistency,policyDocuments:documents};
}
async function copyObjects(source,archive,policyDocuments){const manifest=[];for await(const item of files(source)){const info=await lstat(item.path);if(!info.isFile())throw new Error('Private object is not a regular file.');const target=objectPath(archive,item.key);await mkdir(dirname(target),{recursive:true,mode:0o700});await copyFile(item.path,target);await chmod(target,0o600);const sha256=await hashFile(target);const sourceHash=await hashFile(item.path);if(sourceHash!==sha256)throw new Error('Private object changed while being copied.');manifest.push({key:item.key,sha256,sizeBytes:info.size});}
  for(const expected of policyDocuments){const file=manifest.find(f=>f.key===expected.key);if(!file||!expected.sha256||file.sha256!==expected.sha256)throw new Error('Confirmed policy document is missing or fails its recorded hash.');}return manifest;}
async function readSnapshot(url){const db=new Database(url.toString());const client=await db.pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await client.query("SET LOCAL TIME ZONE 'UTC'");return {db,client,close:async()=>{try{await client.query('ROLLBACK');}finally{client.release();await db.close();}}};}
export async function createLocalBackup({sourceUrl=process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local',objectDirectory=process.env.OBJECT_STORAGE_DIR??'.local/objects',archiveRoot='.local/backups',afterSnapshot}={}){
  const url=localRecoveryUrl(sourceUrl);const started=Date.now();const artifactDirectory=resolve(archiveRoot,new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID());await mkdir(artifactDirectory,{recursive:true,mode:0o700});
  const snapshot=await readSnapshot(url);
  try{
    const snapshotId=(await snapshot.client.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
    const fingerprint=await fingerprintDatabase(snapshot.client);
    if(afterSnapshot)await afterSnapshot({sourceUrl:url.toString(),fingerprint});
    const dump=resolve(artifactDirectory,'database.dump');await command('pg_dump',['--format=custom','--no-owner','--no-acl','--no-password','--snapshot='+snapshotId,'--file='+dump],environment(url,decodeURIComponent(url.pathname.slice(1))));await chmod(dump,0o600);
    const documents=await copyObjects(resolve(objectDirectory),resolve(artifactDirectory,'documents'),fingerprint.policyDocuments);
    const postgres=(await snapshot.client.query('SHOW server_version')).rows[0].server_version;
    const manifest={version:1,kind:'local-sandbox-consistent-backup',consistencyScope:'Transactionally consistent snapshot; source business integrity is evaluated separately',createdAt:new Date().toISOString(),runtime:{node:process.version,postgres},source:{host:url.hostname,port:Number(url.port||5432),database:decodeURIComponent(url.pathname.slice(1))},databaseArchive:{path:'database.dump',sha256:await hashFile(dump)},fingerprint,documents,observedBackupMs:Date.now()-started,productionRpoRtoQualified:false};
    await writeFile(resolve(artifactDirectory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});return {artifactDirectory,manifest};
  }finally{await snapshot.close();}
}
export async function verifyRecoveryState({databaseUrl,manifest,objectDirectory}){
  if(typeof manifest.fingerprint?.sourceConsistency?.valid!=='boolean')throw new Error('Backup predates canonical commitment consistency verification; create a fresh backup for this gate.');
  const url=localRecoveryUrl(databaseUrl);if(!/^st_restore_[a-f0-9]{32}$/.test(url.pathname.slice(1)))throw new Error('Verification target must be a generated task-owned restore database.');const snapshot=await readSnapshot(url);let actual;try{actual=await fingerprintDatabase(snapshot.client);}finally{await snapshot.close();}
  if(JSON.stringify(actual)!==JSON.stringify(manifest.fingerprint))throw new Error('Restored database state differs from the exported source snapshot.');
  for(const expected of manifest.documents){const path=objectPath(objectDirectory,expected.key);const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.size!==expected.sizeBytes||await hashFile(path)!==expected.sha256)throw new Error('Restored private object fails manifest integrity.');}
  return {snapshotMatched:true,verified:actual.sourceConsistency.valid,businessIntegrityPassed:actual.sourceConsistency.valid,sourceConsistency:actual.sourceConsistency,tableCount:actual.tables.length,documentCount:manifest.documents.length,invariants:actual.invariants};
}
export async function restoreAndVerify({sourceUrl=process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local',artifactDirectory,keepRestoredDatabase=false,afterRestore}){
  const source=localRecoveryUrl(sourceUrl);const directory=resolve(artifactDirectory);const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
  if(manifest.version!==1||manifest.kind!=='local-sandbox-consistent-backup'||manifest.databaseArchive?.path!=='database.dump')throw new Error('Unrecognized backup manifest.');
  if(typeof manifest.fingerprint?.sourceConsistency?.valid!=='boolean')throw new Error('Backup predates canonical commitment consistency verification; create a fresh backup for this gate.');
  const dump=resolve(directory,'database.dump');if(await hashFile(dump)!==manifest.databaseArchive.sha256)throw new Error('Database backup archive checksum mismatch.');
  const name='st_restore_'+randomUUID().replaceAll('-','');const adminUrl=new URL(source);adminUrl.pathname='/postgres';const admin=new Database(adminUrl.toString());const restored=new URL(source);restored.pathname='/'+name;
  const started=Date.now();let retained=false;
  try{
    await admin.query('CREATE DATABASE '+safeName(name)+' TEMPLATE template0');ownedRestoreDatabases.add(name);
    await command('pg_restore',['--exit-on-error','--no-owner','--no-acl','--no-password','--dbname='+name,dump],environment(source,name));
    const objectDirectory=resolve(directory,'restored-objects');await mkdir(objectDirectory,{recursive:true,mode:0o700});
    for(const document of manifest.documents){const input=objectPath(resolve(directory,'documents'),document.key);if(await hashFile(input)!==document.sha256)throw new Error('Archived private object checksum mismatch.');const output=objectPath(objectDirectory,document.key);await mkdir(dirname(output),{recursive:true,mode:0o700});await copyFile(input,output);await chmod(output,0o600);}
    if(afterRestore)await afterRestore({databaseUrl:restored.toString(),objectDirectory});
    const verified=await verifyRecoveryState({databaseUrl:restored.toString(),manifest,objectDirectory});retained=keepRestoredDatabase&&verified.verified;
    const report={version:1,status:verified.verified?'passed':'restored_with_source_inconsistencies',scope:'actual isolated local PostgreSQL/object restore; not production disaster recovery certification',sourceDatabase:manifest.source.database,restoredDatabase:name,restoredDatabaseRetained:retained,verifiedAt:new Date().toISOString(),observedRestoreAndVerifyMs:Date.now()-started,...verified};
    await writeFile(resolve(directory,'recovery-report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});return report;
  }finally{if(ownedRestoreDatabases.has(name)&&!retained){await admin.query('DROP DATABASE '+safeName(name));ownedRestoreDatabases.delete(name);}await admin.close();}
}
export async function runRecoveryDrill(options={}){const backup=await createLocalBackup(options);const report=await restoreAndVerify({...options,artifactDirectory:backup.artifactDirectory});return {artifactDirectory:backup.artifactDirectory,...report,observedBackupMs:backup.manifest.observedBackupMs,productionRpoRtoQualified:false};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){runRecoveryDrill().then(report=>{console.log(JSON.stringify(report,null,2));if(!report.verified)process.exitCode=1;}).catch(error=>{console.error(JSON.stringify({status:'failed',code:'local_recovery_failed',message:error instanceof Error?error.message:'Recovery failed'}));process.exitCode=1;});}
