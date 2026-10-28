import test,{before,after} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {Database} from '@st/database';
const base=process.env.API_URL??'http://127.0.0.1:3001',db=new Database();
type ObjectData=Record<string,unknown>;
class Client {
  cookie='';csrf='';session:ObjectData={};
  async request(path:string,body?:unknown,custom?:Record<string,string>){const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(this.cookie?{Cookie:this.cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf,'Idempotency-Key':randomUUID()}),...custom},...(body===undefined?{}:{body:JSON.stringify(body)})});const c=res.headers.get('set-cookie');if(c)this.cookie=c.split(';')[0]!;const data:unknown=await res.json();return {status:res.status,data:data as ObjectData,headers:res.headers};}
  async login(n:number){const c=await this.request('/v1/auth/challenge',{contact:'+9890000000'+String(n).padStart(2,'0')});assert.equal(c.status,201);const v=await this.request('/v1/auth/verify',{challengeId:c.data.challengeId,code:c.data.sandboxCode,...(c.data.mfaRequired?{mfaCode:c.data.sandboxMfaCode}:{})});assert.equal(v.status,201,JSON.stringify(v.data));const s=await this.request('/v1/session');assert.equal(s.status,200);this.session=s.data;this.csrf=String(s.data.csrfToken);return this;}
  async stepUp(){const c=await this.request('/v1/sandbox/mfa');assert.equal(c.status,200);assert.equal((await this.request('/v1/auth/step-up',{mfaCode:c.data.sandboxMfaCode})).status,201);}
}
let customer:Client,foreign:Client,admin:Client,checker:Client;
before(async()=>{customer=await new Client().login(1);foreign=await new Client().login(9);admin=await new Client().login(6);checker=await new Client().login(8);const platform=(checker.session.contexts as ObjectData[]).find(c=>c.kind==='platform');assert.ok(platform);const switched=await checker.request('/v1/contexts',{contextId:platform.id});assert.equal(switched.status,201);checker.session=switched.data;checker.csrf=String(switched.data.csrfToken);await checker.stepUp();});
after(async()=>{await db.close();});
async function prepare(client:Client,carrier='rest',channel='b2c'){
  const profile=await client.request('/v1/business/saveProfile',{subjectKind:'vehicle',label:'Synthetic owned vehicle',attributes:{}});assert.equal(profile.status,201,JSON.stringify(profile.data));
  const form=await client.request('/v1/products/PRD-01/form');const answers={...(form.data.syntheticExample as ObjectData),vehicleRef:profile.data.id};
  const draft=await client.request('/v1/applications',{productId:'PRD-01',answers,channel});assert.equal(draft.status,201,JSON.stringify(draft.data));
  const quote=await client.request('/v1/quotes',{applicationId:draft.data.id,carrierIds:[carrier]});assert.equal(quote.status,201,JSON.stringify(quote.data));const offer=(quote.data.offers as ObjectData[])[0];assert.ok(offer,JSON.stringify(quote.data));
  return {draft,offer};
}
async function newOrder(client:Client,carrier='rest',channel='b2c'){const {offer}=await prepare(client,carrier,channel);const r=await client.request('/v1/orders',{quoteId:offer.id});assert.equal(r.status,201,JSON.stringify(r.data));return r.data;}
async function flag(key:string,enabled:boolean){const list=await admin.request('/v1/flags');const row=(list.data.items as ObjectData[]).find(r=>r.key===key)!;const p=await admin.request('/v1/flags/proposals',{key,enabled,revision:row.revision,reason:'Synthetic automated mode transition test'});assert.equal(p.status,201,JSON.stringify(p.data));const approval=await checker.request('/v1/flags/proposals/'+p.data.id+'/approve',{});assert.equal(approval.status,201,JSON.stringify(approval.data));}
test('real HTTP purchase commits payment/outbox once and issues a private document',{timeout:15000},async()=>{
  const order=await newOrder(customer);const attempt=await customer.request('/v1/orders/'+order.id+'/pay',{});assert.equal(attempt.status,201);
  const results=await Promise.all([customer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{}),customer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{})]);assert.ok(results.every(r=>r.status===201));
  let latest:ObjectData={};for(let n=0;n<60;n++){latest=(await customer.request('/v1/orders/'+order.id)).data;if(latest.issuanceState==='issued'&&latest.deliveryState==='available')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(latest.purchaseState,'committed');assert.equal(latest.paymentState,'verified');assert.equal(latest.issuanceState,'issued');assert.equal(latest.deliveryState,'available');
  assert.equal((await db.query<{count:string}>('SELECT count(*) FROM payment_receipts r JOIN payment_attempts a ON a.id=r.attempt_id WHERE a.order_id=$1',[order.id])).rows[0]?.count,'1');
  assert.equal((await db.query<{count:string}>('SELECT count(*) FROM outbox WHERE aggregate_id=$1 AND event_type=\'purchase.committed.v1\'',[order.id])).rows[0]?.count,'1');
  const leaked=await foreign.request('/v1/orders/'+order.id);assert.equal(leaked.status,404);
  const doc=await fetch(base+'/v1/policies/'+latest.policyId+'/document',{headers:{Cookie:customer.cookie}});assert.equal(doc.status,200);assert.ok((await doc.text()).startsWith('%PDF-'));
  const denial=await fetch(base+'/v1/policies/'+latest.policyId+'/document',{headers:{Cookie:foreign.cookie}});assert.equal(denial.status,404);
});
test('CSRF, maker/checker, mandatory foundations and canonical money enforced',async()=>{
  const invalid=await customer.request('/v1/business/saveProfile',{subjectKind:'person',label:'Denied',attributes:{}},{'X-CSRF-Token':'invalid'});assert.equal(invalid.status,403);
  const flagList=await admin.request('/v1/flags');const foundation=(flagList.data.items as ObjectData[]).find(r=>r.key==='foundation.authorization')!;
  const p=await admin.request('/v1/flags/proposals',{key:foundation.key,enabled:false,revision:foundation.revision,reason:'Attempt to disable mandatory authorization'});assert.equal(p.status,422);
  const sales=(flagList.data.items as ObjectData[]).find(r=>r.key==='sales.b2c')!;const proposal=await admin.request('/v1/flags/proposals',{key:'sales.b2c',enabled:true,revision:sales.revision,reason:'Test independent checker guard'});
  assert.equal((await admin.request('/v1/flags/proposals/'+proposal.data.id+'/approve',{})).status,403);
  await assert.rejects(db.transaction(async tx=>{const id=randomUUID();await tx.query('INSERT INTO journals(id,source_key,currency,description)VALUES($1,$2,\'IRR\',\'negative test\')',[id,'unbalanced:'+id]);await tx.query('INSERT INTO postings(id,journal_id,tenant_id,account,amount)VALUES($1,$2,$3,\'clearing\',100)',[randomUUID(),id,'00000000-0000-4000-8000-000000000001']);}),/unbalanced journal/);
});
test('sales disable blocks fresh commitments but preserves paid pre-disable reservation and servicing',{timeout:15000},async()=>{
  const pending=await newOrder(customer);const attempt=await customer.request('/v1/orders/'+pending.id+'/pay',{});const prepared=await prepare(customer);
  await flag('sales.b2c',false);
  try{assert.equal((await customer.request('/v1/orders',{quoteId:prepared.offer.id})).status,409);assert.equal((await customer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{})).status,201);const saved=await customer.request('/v1/orders/'+pending.id);assert.equal(saved.data.purchaseState,'committed');assert.equal((await customer.request('/v1/policies')).status,200);}finally{await flag('sales.b2c',true);}
});
test('session permissions are revoked at server boundary without stale grants',async()=>{
  const actor=foreign.session.actor as ObjectData;await db.query('UPDATE users SET permission_revision=permission_revision+1 WHERE id=$1',[actor.userId]);assert.equal((await foreign.request('/v1/session')).status,401);
});
test('operational metrics require platform authority and expose bounded route labels rather than private identifiers',async()=>{
  assert.equal((await customer.request('/v1/operations/metrics')).status,403);
  const metrics=await admin.request('/v1/operations/metrics');assert.equal(metrics.status,200,JSON.stringify(metrics.data));
  assert.equal((metrics.data.databasePool as ObjectData).max,20);assert.ok(Array.isArray(metrics.data.http));
  const encoded=JSON.stringify(metrics.data);assert.ok(!encoded.includes('+989'));assert.ok(!encoded.includes(customer.cookie));
  assert.ok((metrics.data.http as ObjectData[]).every(row=>typeof row.route==='string'&&!/[a-f0-9]{8}-[a-f0-9]{4}-/u.test(String(row.route))));
});
test('partial refunds conserve verified funds and a duplicate callback cannot reactivate cancellation',async()=>{
  const order=await newOrder(customer);const attempt=await customer.request('/v1/orders/'+order.id+'/pay',{});
  await db.query("UPDATE orders SET quote_snapshot=jsonb_set(quote_snapshot,'{reservationExpiresAt}',to_jsonb('2020-01-01T00:00:00Z'::text)) WHERE id=$1",[order.id]);
  await customer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{});
  const total=BigInt((order.total as ObjectData).amount as string),half=total/2n;
  const refunds=await Promise.all([customer.request('/v1/orders/'+order.id+'/refunds',{amount:half.toString(),reason:'Synthetic expired-reservation refund first part'}),customer.request('/v1/orders/'+order.id+'/refunds',{amount:(total-half).toString(),reason:'Synthetic expired-reservation refund remainder'})]);assert.ok(refunds.every(r=>r.status===201));
  assert.equal((await customer.request('/v1/orders/'+order.id+'/refunds',{amount:'1',reason:'Must not exceed verified refundable funds'})).status,409);
  assert.equal((await checker.request('/v1/refunds/'+refunds[0]!.data.id+'/approve',{})).status,201);
  assert.equal((await customer.request('/v1/orders/'+order.id)).data.purchaseState,'awaiting_payment');
  assert.equal((await checker.request('/v1/refunds/'+refunds[1]!.data.id+'/approve',{})).status,201);
  await customer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{});
  const after=(await customer.request('/v1/orders/'+order.id)).data;assert.equal(after.purchaseState,'cancelled');assert.equal(after.refundedAmount,total.toString());
  assert.equal((await db.query<{count:string}>('SELECT count(*) FROM outbox WHERE aggregate_id=$1 AND event_type=\'purchase.committed.v1\'',[order.id])).rows[0]?.count,'0');
});
test('pending credit approval cannot create a second obligation after cash commits',async()=>{
  const buyer=await new Client().login(2);const organization=(checker.session.contexts as ObjectData[]).find(c=>c.id==='00000000-0000-4000-8000-000000000100')!;
  const switched=await checker.request('/v1/contexts',{contextId:organization.id});checker.csrf=String(switched.data.csrfToken);await checker.stepUp();
  const before=(await db.query<{reserved:string}>('SELECT reserved::text FROM credit_accounts WHERE tenant_id=$1',[organization.id])).rows[0]!.reserved;
  const order=await newOrder(buyer,'rest','commercial');const approval=await buyer.request('/v1/orders/'+order.id+'/credit',{reason:'Synthetic competing cash and credit commitment'});assert.equal(approval.status,201);
  const attempt=await buyer.request('/v1/orders/'+order.id+'/pay',{});await buyer.request('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{});
  assert.equal((await checker.request('/v1/credit/'+approval.data.id+'/approve',{})).status,409);
  assert.equal((await db.query<{reserved:string}>('SELECT reserved::text FROM credit_accounts WHERE tenant_id=$1',[organization.id])).rows[0]!.reserved,before);
  assert.equal((await db.query<{count:string}>('SELECT count(*) FROM journals WHERE source_key=$1',['credit:'+order.id])).rows[0]!.count,'0');
  const platform=(checker.session.contexts as ObjectData[]).find(c=>c.kind==='platform')!;const restore=await checker.request('/v1/contexts',{contextId:platform.id});checker.csrf=String(restore.data.csrfToken);await checker.stepUp();
});
