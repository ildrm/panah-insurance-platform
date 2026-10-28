import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {Database} from '@st/database';
import {BusinessService} from '@st/business';
import {DomainError,money,type Actor,type Money} from '@st/contracts';
import {FinanceService,type PayoutRequest} from '@st/finance';
import {SandboxFinancePorts} from '../apps/api/src/finance-ports';
import {CommerceService} from '../apps/api/src/commerce';
import {FeatureService} from '../apps/api/src/flags';

const target=new URL(process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local');
if(!['localhost','127.0.0.1'].includes(target.hostname)||target.pathname!=='/st_local'||target.search)throw new Error('Finance port tests require explicit local sandbox connection settings without options.');
const fixtureDatabase='st_finance_fixture_'+randomUUID().replaceAll('-','');
if(!/^st_finance_fixture_[a-f0-9]{32}$/u.test(fixtureDatabase))throw new Error('Invalid generated finance fixture name.');
const adminUrl=new URL(target);adminUrl.pathname='/postgres';const fixtureUrl=new URL(target);fixtureUrl.pathname='/'+fixtureDatabase;
const admin=new Database(adminUrl.toString()),db=new Database(fixtureUrl.toString());let ownsFixture=false;
const commerce=new CommerceService(db,new BusinessService(db),new FeatureService(db));
const ports=new SandboxFinancePorts(db,commerce),finance=new FinanceService(db,ports.options());
before(async()=>{
  await admin.query(`CREATE DATABASE "${fixtureDatabase}" TEMPLATE template0`);ownsFixture=true;
  for(const folder of ['packages/database/migrations','packages/finance/migrations'])for(const file of(await readdir(folder)).filter(name=>name.endsWith('.sql')).sort())await db.transaction(async tx=>{await tx.query(await readFile(folder+'/'+file,'utf8'));});
  assert.equal((await db.query<{database:string}>('SELECT current_database() AS database')).rows[0]?.database,fixtureDatabase);
  console.info(JSON.stringify({event:'finance.ports.fixture.ready',database:fixtureDatabase,scope:'new isolated test database; st_local unchanged'}));
});
after(async()=>{try{await db.close();if(ownsFixture){await admin.query(`DROP DATABASE "${fixtureDatabase}"`);ownsFixture=false;console.info(JSON.stringify({event:'finance.ports.fixture.removed',database:fixtureDatabase}));}}finally{await admin.close();}});
const command=()=>({idempotencyKey:randomUUID()});
const actor=():Actor=>({userId:randomUUID(),contextId:randomUUID(),contextKind:'organization',roles:['buyer'],permissions:['finance.*'],sessionId:randomUUID(),permissionRevision:1});
const code=(name:string)=>(error:unknown)=>error instanceof DomainError&&error.code===name;
async function creditOrder(owner:Actor,value:Money){
  const id=randomUUID();
  await db.transaction(async tx=>{
    await tx.query('INSERT INTO credit_accounts(tenant_id,credit_limit,reserved) VALUES($1,$2,$2)',[owner.contextId,value.amount]);
    await tx.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot,committed_at,commitment_kind) VALUES($1,$2,$3,'PRD-01','rest','committed','credit','pending',$4,now(),'approved_credit')",[id,owner.contextId,owner.userId,{premium:value}]);
    const journal=randomUUID();await tx.query("INSERT INTO journals(id,source_key,currency,description) VALUES($1,$2,'IRR','Synthetic approved credit source')",[journal,'finance-port-credit:'+id]);
    await tx.query("INSERT INTO postings(id,journal_id,tenant_id,account,amount) VALUES($1,$2,$3,'organization_receivable',$4),($5,$2,$3,'insurer_payable',$6)",[randomUUID(),journal,owner.contextId,value.amount,randomUUID(),(-BigInt(value.amount)).toString()]);
  });
  return id;
}
test('actual credit ports serialize invoice payment against installment activation without duplicate debt or lost verified cash',async()=>{
  for(let iteration=0;iteration<8;iteration++){
    const owner=actor(),orderId=await creditOrder(owner,money('100'));
    const intent=await ports.createIntent(owner,{amount:money('100'),purpose:'invoice_payment',targetReference:orderId},randomUUID());
    await ports.confirmIntent(owner,intent.id);
    const [invoice,installment]=await Promise.allSettled([
      finance.allocateInvoicePayment(owner,{invoiceReference:orderId,providerReference:intent.id},command()),
      finance.createInstallments(owner,{agreementReference:orderId},command())
    ]);
    assert.equal(invoice.status,'fulfilled','Verified invoice cash must remain recorded even if servicing changes.');
    if(invoice.status!=='fulfilled')throw invoice.reason;
    const state=(await db.query<{paid:string;installment_plan_id:string|null;reserved:string}>('SELECT c.paid::text,c.installment_plan_id,a.reserved::text FROM credit_servicing c JOIN credit_accounts a ON a.tenant_id=c.tenant_id WHERE c.order_id=$1',[orderId])).rows[0]!;
    const ledger=(await db.query<{account:string;value:string}>('SELECT account,sum(amount)::text AS value FROM postings WHERE tenant_id=$1 GROUP BY account',[owner.contextId])).rows;
    const balance=(account:string)=>BigInt(ledger.find(row=>row.account===account)?.value??'0');
    assert.equal(balance('insurer_payable'),-100n,'The original insurer obligation must exist exactly once.');
    assert.equal(balance('organization_receivable'),0n);
    assert.equal(balance('invoice_payment_clearing'),100n);
    if(installment.status==='fulfilled'){
      assert.equal(invoice.value.state,'unallocated');assert.equal(state.paid,'0');assert.equal(state.reserved,'100');assert.equal(state.installment_plan_id,installment.value.id);
      assert.equal(balance('installment_receivable:'+installment.value.id),100n);
      assert.equal(balance('customer_unallocated_liability:'+owner.userId),-100n);
    }else{
      assert.ok(code('credit_servicing_changed')(installment.reason));assert.equal(invoice.value.state,'allocated');assert.equal(state.paid,'100');assert.equal(state.reserved,'0');assert.equal(state.installment_plan_id,null);
      assert.equal(balance('customer_unallocated_liability:'+owner.userId),0n);
      assert.equal((await db.query("SELECT id FROM finance_resources WHERE tenant_id=$1 AND kind='installment'",[owner.contextId])).rowCount,0);
    }
    assert.equal(ledger.reduce((sum,row)=>sum+BigInt(row.value),0n),0n);
    assert.equal((await db.query('SELECT reference FROM finance_receipts WHERE provider=$1 AND reference=$2',['local-finance-simulator',intent.id])).rowCount,1);
  }
});
test('local payout port rechecks recipient revocation, deduplicates paid truth and rejects changed stable requests',async()=>{
  const owner=actor();
  await db.query('INSERT INTO users(id,contact,display_name) VALUES($1,$2,$3)',[owner.userId,'+9898'+String(BigInt('0x'+randomUUID().replaceAll('-','').slice(0,9))).padStart(11,'0'),'Synthetic finance provider port actor']);
  await db.query("INSERT INTO contexts(id,kind,label) VALUES($1,'organization','Synthetic finance port context')",[owner.contextId]);
  await db.query("INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$2,ARRAY['buyer'],ARRAY['finance.read'])",[owner.userId,owner.contextId]);
  const payout=ports.options().payouts!;
  const recipientReference='sandbox-recipient:'+owner.contextId+':'+owner.userId;
  await payout.recipient(owner,recipientReference);
  const id=randomUUID(),request:PayoutRequest={id,businessKey:'finance-port:'+id,tenantId:owner.contextId,ownerId:owner.userId,recipientReference,amount:money('9007199254740993')};
  await db.query('UPDATE memberships SET active=false WHERE user_id=$1 AND context_id=$2',[owner.userId,owner.contextId]);
  assert.deepEqual(await payout.pay(request),{state:'rejected',reasonCode:'synthetic_recipient_revoked'});
  assert.equal((await db.query('SELECT id FROM sandbox_finance_payouts WHERE business_key=$1',[request.businessKey])).rowCount,0);
  await db.query('UPDATE memberships SET active=true WHERE user_id=$1 AND context_id=$2',[owner.userId,owner.contextId]);
  const first=await payout.pay(request);assert.equal(first.state,'paid');
  assert.deepEqual(await payout.pay(request),first);
  await db.query('UPDATE memberships SET active=false WHERE user_id=$1 AND context_id=$2',[owner.userId,owner.contextId]);
  assert.deepEqual(await payout.status!(request),first,'Revocation cannot erase a previously confirmed payout.');
  await assert.rejects(payout.pay({...request,amount:money('9007199254740994')}),code('payout_observation_conflict'));
  assert.equal((await db.query('SELECT id FROM sandbox_finance_payouts WHERE business_key=$1',[request.businessKey])).rowCount,1);
});
