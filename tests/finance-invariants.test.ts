import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {before,after,test} from 'node:test';
import {Database} from '@st/database';
import {DomainError,requireObject,type Actor} from '@st/contracts';
import {BusinessService,customerBusinessOperations,product} from '@st/business';
import {CommerceService} from '../apps/api/src/commerce';
import {FeatureService} from '../apps/api/src/flags';

// Every table, ledger entry, flag and dispatch record belongs to a generated
// database. No search_path fallback can leak a write into the running demo.
const sourceUrl=new URL(process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local');
if(!['127.0.0.1','localhost'].includes(sourceUrl.hostname)||sourceUrl.pathname!=='/st_local'||sourceUrl.search)throw new Error('Finance tests require the explicit synthetic local database without connection options');
const fixtureDatabase='st_finance_fixture_'+randomUUID().replaceAll('-','');
if(!/^st_finance_fixture_[a-f0-9]{32}$/u.test(fixtureDatabase))throw new Error('Invalid generated finance fixture name.');
const adminUrl=new URL(sourceUrl);adminUrl.pathname='/postgres';
const fixtureUrl=new URL(sourceUrl);fixtureUrl.pathname='/'+fixtureDatabase;
const setup=new Database(adminUrl.toString()),db=new Database(fixtureUrl.toString());
let ownsFixture=false;
const permissions=['business.read',...customerBusinessOperations.map(operation=>'business.'+operation),'orders.create','orders.read','payments.create','credit.request','credit.approve','refund.request','refund.approve'];
function actor(tenant=randomUUID()):Actor{return{userId:randomUUID(),contextId:tenant,contextKind:'organization',roles:['buyer','checker'],permissions,sessionId:randomUUID(),permissionRevision:1};}
function errorCode(value:string){return(error:unknown)=>error instanceof DomainError&&error.code===value;}
function key(){return randomUUID();}
const business=new BusinessService(db,{quoteGateway:{quoteAll:async input=>({quotes:[{id:'synthetic-finance-'+randomUUID(),carrierId:'rest',productId:input.productId,premium:{amount:'80',currency:'IRR',unit:'rial'},coverages:['synthetic-coverage'],expiresAt:new Date(Date.now()+3600_000).toISOString(),effectiveFrom:new Date().toISOString().slice(0,10),effectiveUntil:'2027-12-31',mappingVersion:'v1',synthetic:true}],failures:[]})}});
const commerce=new CommerceService(db,business,new FeatureService(db));
before(async()=>{
  await setup.query(`CREATE DATABASE "${fixtureDatabase}" TEMPLATE template0`);ownsFixture=true;
  for(const folder of ['packages/database/migrations','packages/business/migrations']){
    for(const file of (await readdir(folder)).filter(name=>name.endsWith('.sql')).sort()){
      const sql=await readFile(folder+'/'+file,'utf8');
      await db.transaction(tx=>tx.query(sql));
    }
  }
  for(const[key,enabled,mandatory]of[
    ['sales.b2c',true,false],['sales.b2b',true,false],['sales.b2b.corporate',true,false],
    ['sales.b2b.commercial',true,false],['sales.b2b.reseller',true,false],['sales.b2b.b2b2c',true,false],
    ['servicing.enabled',true,true],['partner_delivery.enabled',true,false],['security.quarantine',false,false],
    ['foundation.authorization',true,true],['foundation.audit',true,true]
  ]as const)await db.query('INSERT INTO feature_controls(key,enabled,mandatory) VALUES($1,$2,$3)',[key,enabled,mandatory]);
  assert.equal((await db.query<{database:string}>('SELECT current_database() AS database')).rows[0]?.database,fixtureDatabase);
  console.info(JSON.stringify({event:'finance.fixture.ready',database:fixtureDatabase,scope:'new isolated test database; st_local unchanged'}));
});
after(async()=>{
  try{await db.close();if(ownsFixture){await setup.query(`DROP DATABASE "${fixtureDatabase}"`);ownsFixture=false;console.info(JSON.stringify({event:'finance.fixture.removed',database:fixtureDatabase}));}}
  finally{await setup.close();}
});
async function order(owner:Actor){
  const profile=await business.execute(owner,'saveProfile',{subjectKind:'vehicle',label:'Synthetic isolated finance vehicle',attributes:{}},{idempotencyKey:key()});
  const application=await business.execute(owner,'createApplication',{productId:'PRD-01',answers:{...product('PRD-01').example,vehicleRef:profile.id},channel:'commercial'},{idempotencyKey:key()});
  const session=await business.execute(owner,'quoteApplication',{id:application.id},{idempotencyKey:key()});
  assert.ok(Array.isArray(session.data.quotes));const first=session.data.quotes[0];assert.ok(first&&typeof first==='object'&&'id'in first);
  const created=requireObject(await commerce.create(owner,String(first.id),key()));return{created,application};
}
async function count(sql:string,params:unknown[]){return(await db.query<{n:string}>(sql,params)).rows[0]?.n;}

test('two independent credit approvals serialize against the actual remaining limit',async()=>{
  const buyer=actor(),checker=actor(buyer.contextId);await db.query('INSERT INTO credit_accounts(tenant_id,credit_limit,reserved) VALUES($1,100,0)',[buyer.contextId]);
  const first=await order(buyer),second=await order(buyer);
  const a=requireObject(await commerce.requestCredit(buyer,String(first.created.id),'Synthetic isolated credit request one',key()));
  const b=requireObject(await commerce.requestCredit(buyer,String(second.created.id),'Synthetic isolated credit request two',key()));
  const results=await Promise.allSettled([commerce.approveCredit(checker,String(a.id)),commerce.approveCredit(checker,String(b.id))]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  const rejected=results.find(result=>result.status==='rejected');assert.ok(rejected&&rejected.status==='rejected'&&errorCode('credit_limit_exceeded')(rejected.reason));
  const account=(await db.query<{reserved:string}>('SELECT reserved::text AS reserved FROM credit_accounts WHERE tenant_id=$1',[buyer.contextId])).rows[0];assert.equal(account?.reserved,'80');
  const orders=await db.query<{state:string;payment_state:string}>('SELECT state,payment_state FROM orders WHERE id=ANY($1::uuid[])',[[first.created.id,second.created.id]]);assert.equal(orders.rows.filter(row=>row.state==='committed'&&row.payment_state==='credit').length,1);
  assert.equal(await count('SELECT count(*)::text AS n FROM journals WHERE source_key=ANY($1::text[])',[[`credit:${first.created.id}`,`credit:${second.created.id}`]]),'1');
});

test('cash arriving after credit commitment is retained once as an explicit reconciliation exception',async()=>{
  const buyer=actor(),checker=actor(buyer.contextId);await db.query('INSERT INTO credit_accounts(tenant_id,credit_limit,reserved) VALUES($1,1000,0)',[buyer.contextId]);
  const {created}=await order(buyer);const id=String(created.id);const attempt=requireObject(await commerce.pay(buyer,id,key()));
  const approval=requireObject(await commerce.requestCredit(buyer,id,'Synthetic credit before late cash settlement',key()));await commerce.approveCredit(checker,String(approval.id));
  await commerce.confirmSandbox(buyer,String(attempt.paymentId));await commerce.verifyPayment(String(attempt.paymentId));
  const saved=(await db.query<{state:string;payment_state:string;commitment_kind:string;exception_code:string}>('SELECT state,payment_state,commitment_kind,exception_code FROM orders WHERE id=$1',[id])).rows[0];assert.deepEqual(saved,{state:'committed',payment_state:'credit',commitment_kind:'approved_credit',exception_code:'payment_after_credit_commitment'});
  assert.equal(await count('SELECT count(*)::text AS n FROM payment_receipts WHERE attempt_id=$1',[attempt.paymentId]),'1');
  assert.equal(await count('SELECT count(*)::text AS n FROM outbox WHERE aggregate_id=$1',[id]),'1');
  assert.equal(await count('SELECT count(*)::text AS n FROM journals WHERE source_key=$1',['allocation:'+id]),'0');
  const cash=(await db.query<{amount:string}>('SELECT sum(p.amount)::text AS amount FROM postings p JOIN journals j ON j.id=p.journal_id WHERE j.source_key=$1 AND p.account=\'customer_allocation\'',['receipt:'+attempt.paymentId])).rows[0];assert.equal(cash?.amount,'-80');
  const credit=(await db.query<{reserved:string}>('SELECT reserved::text AS reserved FROM credit_accounts WHERE tenant_id=$1',[buyer.contextId])).rows[0];assert.equal(credit?.reserved,'80');
});

test('a purchase guard failure retains verified funds, prevents dispatch and serializes refund reservations',async()=>{
  const buyer=actor(),checker=actor(buyer.contextId);const {created,application}=await order(buyer),id=String(created.id);const attempt=requireObject(await commerce.pay(buyer,id,key()));
  await business.execute(buyer,'saveApplicationAnswers',{id:application.id,answers:{...requireObject(application.data.answers),usageCode:'changed-after-reservation'}},{idempotencyKey:key(),expectedVersion:application.version});
  await commerce.confirmSandbox(buyer,String(attempt.paymentId));
  const saved=(await db.query<{state:string;payment_state:string;exception_code:string}>('SELECT state,payment_state,exception_code FROM orders WHERE id=$1',[id])).rows[0];assert.deepEqual(saved,{state:'awaiting_payment',payment_state:'verified',exception_code:'application_changed'});
  assert.equal(await count('SELECT count(*)::text AS n FROM payment_receipts WHERE attempt_id=$1',[attempt.paymentId]),'1');assert.equal(await count('SELECT count(*)::text AS n FROM outbox WHERE aggregate_id=$1',[id]),'0');
  const requests=await Promise.allSettled([commerce.requestRefund(buyer,id,'60','Synthetic concurrent refund reservation one',key()),commerce.requestRefund(buyer,id,'60','Synthetic concurrent refund reservation two',key())]);assert.equal(requests.filter(result=>result.status==='fulfilled').length,1);
  const reserved=(await db.query<{amount:string}>('SELECT sum(amount)::text AS amount FROM refunds WHERE order_id=$1',[id])).rows[0];assert.equal(reserved?.amount,'60');
  const winner=requests.find((result):result is PromiseFulfilledResult<unknown>=>result.status==='fulfilled');assert.ok(winner);const refund=requireObject(winner.value);
  // Fault injection models an ambiguous payout. Approval cannot substitute for
  // authoritative provider reconciliation, even though this platform is local.
  await db.query("UPDATE refunds SET state='external_outcome_unknown' WHERE id=$1",[refund.id]);
  await assert.rejects(commerce.approveRefund(checker,String(refund.id)),error=>error instanceof DomainError&&error.status===409);
  assert.equal(await count('SELECT count(*)::text AS n FROM journals WHERE source_key=$1',['refund:'+refund.id]),'0');
  await commerce.verifyPayment(String(attempt.paymentId));assert.equal(await count('SELECT count(*)::text AS n FROM outbox WHERE aggregate_id=$1',[id]),'0');
});

test('the database rejects mutation of posted money and every observed journal remains balanced',async()=>{
  const buyer=actor();const {created,application}=await order(buyer);const attempt=requireObject(await commerce.pay(buyer,String(created.id),key()));
  await business.execute(buyer,'saveApplicationAnswers',{id:application.id,answers:{...requireObject(application.data.answers),usageCode:'changed-for-retained-receipt'}},{idempotencyKey:key(),expectedVersion:application.version});await commerce.confirmSandbox(buyer,String(attempt.paymentId));
  const posting=(await db.query<{id:string;journal_id:string}>('SELECT p.id,p.journal_id FROM postings p JOIN journals j ON j.id=p.journal_id WHERE j.source_key=$1 LIMIT 1',['receipt:'+attempt.paymentId])).rows[0];assert.ok(posting);
  await assert.rejects(db.query('UPDATE postings SET amount=amount WHERE id=$1',[posting.id]),/append-only/u);
  await assert.rejects(db.query('DELETE FROM postings WHERE id=$1',[posting.id]),/append-only/u);
  await assert.rejects(db.query('DELETE FROM journals WHERE id=$1',[posting.journal_id]),/append-only/u);
  const sums=await db.query<{amount:string}>('SELECT sum(amount)::text AS amount FROM postings WHERE journal_id=$1 GROUP BY journal_id',[posting.journal_id]);assert.equal(sums.rows[0]?.amount,'0');
});
