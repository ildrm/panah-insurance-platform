import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,randomInt} from 'node:crypto';
import {Database} from '@st/database';
import {financeOperations} from '@st/finance';
const db=new Database(),base=process.env.API_URL??'http://127.0.0.1:3001';
type Data=Record<string,unknown>;
class Client {
  cookie='';csrf='';constructor(readonly userId:string,readonly contextId:string,readonly contact:string){}
  async call(path:string,body?:unknown,headers:Record<string,string>={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:this.cookie,...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf,'Idempotency-Key':randomUUID()}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const cookie=response.headers.get('set-cookie');if(cookie)this.cookie=cookie.split(';')[0]!;return{status:response.status,data:await response.json() as Data};}
  async login(){const challenge=await this.call('/v1/auth/challenge',{contact:this.contact});assert.equal(challenge.status,201);const verified=await this.call('/v1/auth/verify',{challengeId:challenge.data.challengeId,code:challenge.data.sandboxCode,...(challenge.data.mfaRequired?{mfaCode:challenge.data.sandboxMfaCode}:{})});assert.equal(verified.status,201);const session=await this.call('/v1/session');this.csrf=String(session.data.csrfToken);return this;}
}
const core=['business.read','business.saveProfile','business.createApplication','business.quoteApplication','orders.create','orders.read','payments.create','policies.read','documents.read','finance.read',...financeOperations.map(op=>'finance.'+op)];
let customer:Client,foreign:Client,buyer:Client,checker:Client;
async function actor(kind:'personal'|'organization',roles:string[],permissions:string[],contextId=randomUUID()){
  const id=randomUUID(),contact='+9897'+String(randomInt(0,1_000_000_000)).padStart(9,'0');
  await db.query('INSERT INTO users(id,contact,display_name,mfa_secret) VALUES($1,$2,$3,$4)',[id,contact,'Isolated synthetic finance integration actor',roles.includes('checker')?randomBytes(20).toString('hex'):null]);
  await db.query('INSERT INTO contexts(id,kind,label) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[contextId,kind,'Isolated synthetic finance test context']);
  await db.query('INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$2,$3,$4)',[id,contextId,roles,permissions]);
  return new Client(id,contextId,contact).login();
}
before(async()=>{customer=await actor('personal',['customer'],core);foreign=await actor('personal',['customer'],core);buyer=await actor('organization',['buyer'],[...core,'credit.request']);checker=await actor('organization',['checker'],['credit.approve','orders.read','policies.read'],buyer.contextId);await db.query('INSERT INTO credit_accounts(tenant_id,credit_limit) VALUES($1,1000000000)',[buyer.contextId]);});
after(()=>db.close());
async function order(client:Client,channel='b2c'){
  const profile=await client.call('/v1/business/saveProfile',{subjectKind:'vehicle',label:'Synthetic finance test vehicle',attributes:{}});assert.equal(profile.status,201);
  const form=await client.call('/v1/products/PRD-01/form'),application=await client.call('/v1/applications',{productId:'PRD-01',channel,answers:{...(form.data.syntheticExample as Data),vehicleRef:profile.data.id}});assert.equal(application.status,201,JSON.stringify(application.data));
  const quotes=await client.call('/v1/quotes',{applicationId:application.data.id,carrierIds:['rest']});assert.equal(quotes.status,201,JSON.stringify(quotes.data));
  const offer=(quotes.data.offers as Data[])[0];assert.ok(offer);const created=await client.call('/v1/orders',{quoteId:offer.id});assert.equal(created.status,201,JSON.stringify(created.data));return created.data;
}
async function intent(client:Client,amount:string,purpose='wallet_funding',targetReference?:string){const result=await client.call('/v1/sandbox/finance/intents',{amount:{amount,currency:'IRR',unit:'rial'},purpose,...(targetReference?{targetReference}:{})});assert.equal(result.status,201,JSON.stringify(result.data));return result.data;}
test('HTTP wallet commitment uses one allocation and v2 event, never invents cash; late cash remains a separate liability',{timeout:15000},async()=>{
  const purchase=await order(customer),premium=String((purchase.total as Data).amount);
  const funding=await intent(customer,premium);
  assert.equal((await customer.call('/v1/finance/fundWallet',{providerReference:funding.id})).status,409);
  assert.equal((await foreign.call('/v1/sandbox/finance/intents/'+funding.id+'/confirm',{})).status,404);
  assert.equal((await customer.call('/v1/sandbox/finance/intents/'+funding.id+'/confirm',{})).status,201);
  const fundKey=randomUUID(),fund=await customer.call('/v1/finance/fundWallet',{providerReference:funding.id},{'Idempotency-Key':fundKey});assert.equal(fund.status,201,JSON.stringify(fund.data));
  assert.equal((await customer.call('/v1/finance/fundWallet',{providerReference:funding.id},{'Idempotency-Key':fundKey})).data.id,fund.data.id);
  assert.equal((await customer.call('/v1/finance/fundWallet',{providerReference:funding.id})).status,409);
  const attempt=await customer.call('/v1/orders/'+purchase.id+'/pay',{});assert.equal(attempt.status,201);
  const reservation=await customer.call('/v1/finance/reserveWalletSpend',{purchaseReference:purchase.id});assert.equal(reservation.status,201,JSON.stringify(reservation.data));
  const commitKey=randomUUID(),committed=await customer.call('/v1/finance/commitWalletSpend',{reservationId:reservation.data.id},{'If-Match':String(reservation.data.version),'Idempotency-Key':commitKey});assert.equal(committed.status,201,JSON.stringify(committed.data));
  assert.equal((await customer.call('/v1/finance/commitWalletSpend',{reservationId:reservation.data.id},{'If-Match':String(reservation.data.version),'Idempotency-Key':commitKey})).data.id,committed.data.id);
  assert.equal((await foreign.call('/v1/finance/resources/wallet_spend/'+committed.data.id)).status,404);
  const event=(await db.query<{count:string}>("SELECT count(*) FROM outbox WHERE aggregate_id=$1 AND event_type='purchase.committed.v2'",[purchase.id])).rows[0]!;assert.equal(event.count,'1');
  assert.equal((await db.query<{count:string}>('SELECT count(*) FROM payment_receipts r JOIN payment_attempts a ON a.id=r.attempt_id WHERE a.order_id=$1',[purchase.id])).rows[0]!.count,'0');
  assert.equal((await customer.call('/v1/sandbox/payments/'+attempt.data.paymentId+'/confirm',{})).status,201);
  const latest=(await customer.call('/v1/orders/'+purchase.id)).data;assert.equal(latest.paymentState,'wallet');assert.equal(latest.commitmentKind,'verified_wallet_allocation');assert.equal(latest.exceptionCode,'payment_after_wallet_commitment');
  assert.equal((await db.query<{count:string}>("SELECT count(*) FROM outbox WHERE aggregate_id=$1 AND event_type LIKE 'purchase.committed.%'",[purchase.id])).rows[0]!.count,'1');
  const blockedRefund=await customer.call('/v1/finance/refundWalletSpend',{spendId:committed.data.id,amount:{amount:'1',currency:'IRR',unit:'rial'},reason:'Do not expose a refund without independent approval'},{'If-Match':String(committed.data.version)});assert.equal(blockedRefund.status,409);assert.equal(blockedRefund.data.code,'refund_approval_not_configured');
  let state:Data={};for(let n=0;n<80;n++){state=(await customer.call('/v1/orders/'+purchase.id)).data;if(state.issuanceState==='issued')break;await new Promise(resolve=>setTimeout(resolve,100));}assert.equal(state.issuanceState,'issued');
});
test('HTTP credit-to-installments reclassifies debt once and retains overpayments without releasing excess credit',{timeout:15000},async()=>{
  const purchase=await order(buyer,'commercial'),total=BigInt(String((purchase.total as Data).amount));
  const request=await buyer.call('/v1/orders/'+purchase.id+'/credit',{reason:'Synthetic credit agreement for exact servicing test'});assert.equal(request.status,201);
  const approved=await checker.call('/v1/credit/'+request.data.id+'/approve',{});assert.equal(approved.status,201,JSON.stringify(approved.data));
  const plan=await buyer.call('/v1/finance/createInstallments',{agreementReference:purchase.id});assert.equal(plan.status,201,JSON.stringify(plan.data));
  assert.equal((await buyer.call('/v1/finance/createInstallments',{agreementReference:purchase.id})).status,409);
  const duplicateInvoice=await intent(buyer,'10','invoice_payment',String(purchase.id));await buyer.call('/v1/sandbox/finance/intents/'+duplicateInvoice.id+'/confirm',{});
  const held=await buyer.call('/v1/finance/allocateInvoicePayment',{invoiceReference:purchase.id,providerReference:duplicateInvoice.id});assert.equal(held.status,201,JSON.stringify(held.data));assert.equal(held.data.state,'unallocated');
  const payment=await intent(buyer,(total+20n).toString(),'installment_payment',String(plan.data.id));await buyer.call('/v1/sandbox/finance/intents/'+payment.id+'/confirm',{});
  const paid=await buyer.call('/v1/finance/allocateInstallmentPayment',{planId:plan.data.id,providerReference:payment.id});assert.equal(paid.status,201,JSON.stringify(paid.data));assert.equal(paid.data.state,'paid');assert.equal((paid.data.data as Data).paidAmount,total.toString());
  assert.equal((await db.query<{reserved:string}>('SELECT reserved::text FROM credit_accounts WHERE tenant_id=$1',[buyer.contextId])).rows[0]!.reserved,'0');
  const amounts=(await db.query<{account:string;amount:string}>('SELECT account,sum(amount)::text AS amount FROM postings WHERE tenant_id=$1 GROUP BY account',[buyer.contextId])).rows;
  assert.equal(amounts.find(row=>row.account==='organization_receivable')?.amount,'0');assert.equal(amounts.find(row=>row.account==='insurer_payable')?.amount,(-total).toString());
  assert.equal(amounts.find(row=>row.account==='installment_receivable:'+plan.data.id)?.amount,'0');assert.equal(amounts.find(row=>row.account==='customer_unallocated_liability:'+buyer.userId)?.amount,'-30');
});
