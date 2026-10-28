import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,readdir,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {Database} from '@st/database';
import {createLocalBackup,localRecoveryUrl,restoreAndVerify,runRecoveryDrill} from '../scripts/backup-restore.mjs';

async function fixture(){
  const source=new URL(process.env['TEST_DATABASE_URL']??process.env['DATABASE_URL']??'postgresql://st@127.0.0.1:55432/st_local');
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(source.hostname));source.search='';source.pathname='/postgres';const admin=new Database(source.toString());
  const name='st_recovery_fixture_'+randomUUID().replaceAll('-','');await admin.query('CREATE DATABASE "'+name+'" TEMPLATE template0');source.pathname='/'+name;const db=new Database(source.toString());
  for(const file of(await readdir('packages/database/migrations')).filter(file=>file.endsWith('.sql')).sort())await db.query(await readFile(resolve('packages/database/migrations',file),'utf8'));
  const directory=await mkdtemp(join(tmpdir(),'st-recovery-'));const objects=join(directory,'objects');await mkdir(objects,{mode:0o700});
  const tenant=randomUUID(),owner=randomUUID();const orders=[randomUUID(),randomUUID(),randomUUID(),randomUUID()];
  await db.transaction(async tx=>{
    for(let n=0;n<orders.length;n++){
      const wallet=n===3,carrier=n===1?'signed':'rest',kind=wallet?'verified_wallet_allocation':'verified_payment';
      const snapshot={synthetic:true,premium:{amount:'1000',currency:'IRR',unit:'rial'}};
      await tx.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot,committed_at,commitment_kind) VALUES($1,$2,$3,'PRD-01',$4,'committed',$5,$6,$7,now(),$8)",[orders[n],tenant,owner,carrier,wallet?'wallet':'verified',['pending','external_outcome_unknown','issued','pending'][n],snapshot,kind]);
      if(!wallet){const attempt=randomUUID(),ref='REC-'+randomUUID();await tx.query("INSERT INTO payment_attempts(id,order_id,provider_ref,amount,state,provider_confirmed,verified_at) VALUES($1,$2,$3,'1000','verified',true,now())",[attempt,orders[n],ref]);await tx.query("INSERT INTO payment_receipts(id,attempt_id,provider_ref,amount) VALUES($1,$2,$3,'1000')",[randomUUID(),attempt,ref]);}
      const payload={orderId:orders[n],tenantId:tenant,ownerId:owner,productId:'PRD-01',carrierId:carrier,quoteSnapshot:snapshot,commitmentKind:kind,...(wallet?{walletSpendId:randomUUID()}:{})};
      await tx.query('INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload,state) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),wallet?'purchase.committed.v2':'purchase.committed.v1',orders[n],tenant,payload,['pending','unknown','delivered','pending'][n]]);
      await tx.query('INSERT INTO submissions(id,order_id,carrier_id,state,data) VALUES($1,$2,$3,$4,$5)',[randomUUID(),orders[n],carrier,['pending','external_outcome_unknown','issued','pending'][n],n===1?{businessKey:'synthetic-stable-submit-key'}:{}]);
    }
    const journal=randomUUID();await tx.query("INSERT INTO journals(id,source_key,currency,description) VALUES($1,$2,'IRR','Synthetic precise recovery fixture')",[journal,'recovery:'+journal]);
    await tx.query('INSERT INTO postings(id,journal_id,tenant_id,account,amount) VALUES($1,$3,$4,$5,$6),($2,$3,$4,$7,$8)',[randomUUID(),randomUUID(),journal,tenant,'clearing','9007199254740993','liability','-9007199254740993']);
    await tx.query("INSERT INTO inbox(id,source,external_event_id,payload_digest) VALUES($1,'signed','REC-E1',$2)",[randomUUID(),'a'.repeat(64)]);
  });
  const policy=randomUUID(),key=policy+'.pdf';const bytes=await readFile('apps/simulators/fixtures/policy.pdf');const hash=createHash('sha256').update(bytes).digest('hex');await writeFile(join(objects,key),bytes,{mode:0o600});
  await db.query("INSERT INTO policies(id,order_id,tenant_id,owner_id,carrier_id,reference,effective_from,effective_until,state,document_key,data) VALUES($1,$2,$3,$4,'rest','REC-P1','2026-11-01','2027-11-01','future',$5,$6)",[policy,orders[2],tenant,owner,key,{synthetic:true,documentSha256:hash}]);
  return {sourceUrl:source.toString(),db,admin,directory,objects,key,orders,tenant,owner,close:async()=>{await db.close();await admin.query('DROP DATABASE "'+name+'"');await admin.close();await rm(directory,{recursive:true,force:true});}};
}

test('actual pg_dump/pg_restore preserves money above JS integer precision, pending/unknown work, inbox and private documents',async t=>{
  const f=await fixture();t.after(f.close);
  const report=await runRecoveryDrill({sourceUrl:f.sourceUrl,objectDirectory:f.objects,archiveRoot:join(f.directory,'backups')});
  assert.equal(report.verified,true);assert.equal(report.snapshotMatched,true);assert.equal(report.businessIntegrityPassed,true);assert.equal(report.sourceConsistency.valid,true);assert.equal(report.sourceConsistency.committed_orders,4);assert.equal(report.productionRpoRtoQualified,false);assert.equal(report.documentCount,1);assert.equal(report.invariants.balancedJournals,true);assert.equal(report.invariants.paid_unissued,2);assert.equal(report.invariants.wallet_unissued,1);assert.equal(report.invariants.unknown_orders,1);assert.equal(report.restoredDatabaseRetained,false);
  assert.equal((await f.admin.query('SELECT count(*)::int AS count FROM pg_database WHERE datname=$1',[report.restoredDatabase])).rows[0]?.['count'],0);
  const journal=(await f.db.query('SELECT amount::text AS amount FROM postings WHERE amount>0')).rows[0];assert.equal(journal?.['amount'],'9007199254740993');
  assert.equal((await f.db.query('SELECT count(*)::int AS count FROM payment_receipts r JOIN payment_attempts a ON a.id=r.attempt_id WHERE a.order_id=$1',[f.orders[3]])).rows[0]?.['count'],0);
});

test('an orphaned committed source is captured exactly but restore cannot claim business integrity',async t=>{
  const f=await fixture();t.after(f.close);const orphan=randomUUID();
  await f.db.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot,committed_at,commitment_kind) VALUES($1,$2,$3,'PRD-01','rest','committed','credit','pending',$4,now(),'approved_credit')",[orphan,f.tenant,f.owner,{synthetic:true,premium:{amount:'1000',currency:'IRR',unit:'rial'}}]);
  const backup=await createLocalBackup({sourceUrl:f.sourceUrl,objectDirectory:f.objects,archiveRoot:join(f.directory,'backups')});
  assert.equal(backup.manifest.fingerprint.sourceConsistency.valid,false);assert.equal(backup.manifest.fingerprint.sourceConsistency.missing_commitment_events,1);assert.equal(backup.manifest.fingerprint.sourceConsistency.missing_submissions,1);
  const report=await restoreAndVerify({sourceUrl:f.sourceUrl,artifactDirectory:backup.artifactDirectory,keepRestoredDatabase:true});
  assert.equal(report.status,'restored_with_source_inconsistencies');assert.equal(report.snapshotMatched,true);assert.equal(report.verified,false);assert.equal(report.businessIntegrityPassed,false);assert.equal(report.sourceConsistency.valid,false);assert.equal(report.restoredDatabaseRetained,false);
  assert.equal((await f.admin.query('SELECT count(*)::int AS count FROM pg_database WHERE datname=$1',[report.restoredDatabase])).rows[0]?.['count'],0);
  assert.equal((await f.db.query('SELECT id FROM orders WHERE id=$1',[orphan])).rowCount,1,'Recovery must not repair or delete the inconsistent source.');
  assert.ok((await readdir(backup.artifactDirectory)).includes('database.dump'));
  const saved=JSON.parse(await readFile(join(backup.artifactDirectory,'recovery-report.json'),'utf8'));assert.equal(saved.verified,false);assert.equal(saved.snapshotMatched,true);
});

test('canonical commitment duplicates, mismatched routing and invented wallet cash fields are reported',async t=>{
  const f=await fixture();t.after(f.close);
  await f.db.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) SELECT $1,event_type,aggregate_id,tenant_id,payload FROM outbox WHERE aggregate_id=$2",[randomUUID(),f.orders[0]]);
  await f.db.query("UPDATE outbox SET payload=jsonb_set(payload,'{tenantId}',to_jsonb($2::text)) WHERE aggregate_id=$1",[f.orders[1],randomUUID()]);
  await f.db.query("UPDATE submissions SET carrier_id='rest' WHERE order_id=$1",[f.orders[1]]);
  await f.db.query("UPDATE outbox SET payload=payload||$2::jsonb WHERE aggregate_id=$1",[f.orders[3],JSON.stringify({paymentReceiptIds:[randomUUID()]})]);
  const backup=await createLocalBackup({sourceUrl:f.sourceUrl,objectDirectory:f.objects,archiveRoot:join(f.directory,'backups')});
  const consistency=backup.manifest.fingerprint.sourceConsistency;assert.equal(consistency.valid,false);assert.equal(consistency.duplicate_commitment_events,1);assert.equal(consistency.mismatched_commitment_events,2);assert.equal(consistency.mismatched_submissions,1);
  const report=await restoreAndVerify({sourceUrl:f.sourceUrl,artifactDirectory:backup.artifactDirectory});assert.equal(report.snapshotMatched,true);assert.equal(report.verified,false);assert.deepEqual(report.sourceConsistency,consistency);
});

test('exported snapshot excludes concurrent source writes while restored-state tampering is detected and cleaned up',async t=>{
  const f=await fixture();t.after(f.close);
  const backup=await createLocalBackup({sourceUrl:f.sourceUrl,objectDirectory:f.objects,archiveRoot:join(f.directory,'backups'),afterSnapshot:async()=>{await f.db.query("INSERT INTO audit(id,tenant_id,action,reason,data) VALUES($1,$2,'synthetic.concurrent.write','After exported snapshot','{}')",[randomUUID(),randomUUID()]);}});
  assert.equal(backup.manifest.fingerprint.tables.find((r:{table:string})=>r.table==='audit')?.rows,'0');assert.equal((await f.db.query('SELECT count(*)::int AS count FROM audit')).rows[0]?.['count'],1);
  let targetName='';await assert.rejects(restoreAndVerify({sourceUrl:f.sourceUrl,artifactDirectory:backup.artifactDirectory,afterRestore:async({databaseUrl}:{databaseUrl:string})=>{const url=new URL(databaseUrl);targetName=url.pathname.slice(1);const target=new Database(databaseUrl);try{await target.query("UPDATE outbox SET state='delivered' WHERE state='unknown'");}finally{await target.close();}}}),/differs/);
  assert.equal((await f.admin.query('SELECT count(*)::int AS count FROM pg_database WHERE datname=$1',[targetName])).rows[0]?.['count'],0);assert.equal((await f.db.query("SELECT count(*)::int AS count FROM outbox WHERE state='unknown'")).rows[0]?.['count'],1);
});

test('document corruption fails restoration verification without changing source objects',async t=>{
  const f=await fixture();t.after(f.close);const original=await readFile(join(f.objects,f.key));const backup=await createLocalBackup({sourceUrl:f.sourceUrl,objectDirectory:f.objects,archiveRoot:join(f.directory,'backups')});
  await assert.rejects(restoreAndVerify({sourceUrl:f.sourceUrl,artifactDirectory:backup.artifactDirectory,afterRestore:async({objectDirectory}:{objectDirectory:string})=>{await writeFile(join(objectDirectory,f.key),'tampered');}}),/integrity/);assert.deepEqual(await readFile(join(f.objects,f.key)),original);
});

test('recovery rejects remote hosts, user databases, arbitrary options and unsafe source names before connecting',()=>{
  for(const url of ['postgresql://st@example.com/st_local','postgresql://st@127.0.0.1/production','postgresql://st@169.254.169.254/st_local','postgresql://st@127.0.0.1/st_local?options=-csearch_path=other'])assert.throws(()=>localRecoveryUrl(url));
});
