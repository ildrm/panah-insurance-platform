import {randomUUID,createHash} from 'node:crypto';
import {Database,type SqlClient} from '@st/database';
import {DomainError,authorize,type Actor,type Channel,money,requireObject} from '@st/contracts';
import {BusinessService} from '@st/business';
import {FeatureService} from './flags';
import type {WalletPurchase} from '@st/finance';
import type {ControlsService,ControlContext} from '@st/controls';
interface OrderRow extends Record<string,unknown>{id:string;tenant_id:string;owner_id:string;product_id:string;carrier_id:string;state:string;payment_state:string;issuance_state:string;quote_snapshot:Record<string,unknown>;version:number;exception_code:string|null;commitment_kind:string|null;refunded_amount:string}
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):v!==null&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
export class CommerceService {
  constructor(private readonly db:Database,private readonly business:BusinessService,private readonly flags:FeatureService,private readonly controls?:ControlsService){}
  private controlContext(actor:Actor,row:Pick<OrderRow,'id'|'owner_id'|'tenant_id'|'product_id'|'carrier_id'|'quote_snapshot'>,reserved=false):ControlContext{
    const context:ControlContext={purpose:'new_sales',environment:'sandbox',channel:String(row.quote_snapshot.channel),productId:row.product_id,carrierId:row.carrier_id,customerId:row.owner_id,cohortKey:row.tenant_id+':'+row.owner_id,...(row.quote_snapshot.purchasingContextKind==='organization'||actor.contextKind==='organization'?{organizationId:row.tenant_id}:{})};
    if(reserved&&Number.isSafeInteger(row.quote_snapshot.scopedControlRevision))Object.assign(context,{purpose:'reservation_completion',reservationReference:row.id,reservationExpiresAt:String(row.quote_snapshot.reservationExpiresAt),acceptedRevision:row.quote_snapshot.scopedControlRevision});
    return context;
  }
  private allowed(actor:Actor,row:{tenant_id:string;owner_id:string}):void{
    if(actor.permissions.includes('*'))return;
    if(actor.contextKind==='platform'&&actor.permissions.includes('orders.read')&&actor.roles.some(r=>['admin','operator','checker'].includes(r)))return;
    if(actor.contextKind==='carrier'&&'carrier_id' in row&&actor.permissions.includes('carrier.'+String(row.carrier_id)))return;
    if(row.tenant_id!==actor.contextId||(actor.contextKind==='personal'&&row.owner_id!==actor.userId))throw new DomainError('resource_not_found',404,'Resource not found.');
  }
  private async memo<T>(actor:Actor,operation:string,key:string,body:unknown,fn:(tx:SqlClient)=>Promise<T>):Promise<T>{
    if(!/^[A-Za-z0-9_.:-]{16,128}$/.test(key))throw new DomainError('idempotency_key_required',422,'A stable idempotency key is required.');
    const scope=actor.userId+':'+actor.contextId,hash=createHash('sha256').update(JSON.stringify(canonical(body))).digest('hex');
    return this.db.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[scope+operation+key]);
      const old=(await tx.query<{digest:string;response:T}>('SELECT digest,response FROM idempotency WHERE scope=$1 AND operation=$2 AND key=$3',[scope,operation,key])).rows[0];
      if(old){if(old.digest!==hash)throw new DomainError('idempotency_conflict',409,'This key was already used with different input.');return old.response;}
      const result=await fn(tx);await tx.query('INSERT INTO idempotency(scope,operation,key,digest,response) VALUES($1,$2,$3,$4,$5)',[scope,operation,key,hash,JSON.stringify(result)]);return result;
    });
  }
  private async journal(tx:SqlClient,tenant:string,key:string,amount:string,debit:string,credit:string):Promise<void>{
    const id=randomUUID();const created=await tx.query('INSERT INTO journals(id,source_key,currency,description) VALUES($1,$2,\'IRR\',$2) ON CONFLICT(source_key) DO NOTHING RETURNING id',[id,key]);
    if(!created.rowCount)return;
    await tx.query('INSERT INTO postings(id,journal_id,tenant_id,account,amount) VALUES($1,$2,$3,$4,$5),($6,$2,$3,$7,$8)',[randomUUID(),id,tenant,debit,amount,randomUUID(),credit,(-BigInt(amount)).toString()]);
  }
  private projection(row:OrderRow,policyId?:string):Record<string,unknown>{return {id:row.id,purchaseState:row.state,paymentState:row.payment_state,submissionState:row.issuance_state==='not_started'?'pending':row.issuance_state,issuanceState:row.issuance_state,policyId,productId:row.product_id,carrierId:row.carrier_id,total:row.quote_snapshot.premium,version:row.version,exceptionCode:row.exception_code,commitmentKind:row.commitment_kind,refundedAmount:row.refunded_amount,synthetic:true};}
  async create(actor:Actor,quoteId:string,key:string):Promise<unknown>{
    authorize(actor,'orders.create');const quote=await this.business.get(actor,'quotes',quoteId);
    return this.memo(actor,'order.create',key,{quoteId},async tx=>{
      const stored=(await tx.query<{state:string;data:Record<string,unknown>}>('SELECT state,data FROM business_records WHERE id=$1 FOR SHARE',[quote.id])).rows[0];
      if(!stored||stored.state!=='valid'||Date.parse(String(stored.data.expiresAt))<=Date.now())throw new DomainError('quote_expired',409,'Request a fresh quote.');
      const app=(await tx.query<{version:number;data:Record<string,unknown>}>('SELECT version,data FROM business_records WHERE id=$1 FOR SHARE',[stored.data.applicationId])).rows[0];
      if(!app||app.version!==stored.data.applicationVersion)throw new DomainError('version_conflict',409,'Risk changed after this quote.');
      await this.business.assertPurchaseReady(tx,{tenantId:actor.contextId,ownerId:actor.userId,applicationId:String(stored.data.applicationId),applicationVersion:Number(stored.data.applicationVersion),productId:String(stored.data.productId)},new Date());
      const channel=String(app.data.channel) as Channel;const revision=await this.flags.assertSales(tx,channel);
      const amount=requireObject(stored.data.premium);money(String(amount.amount));
      const id=randomUUID();const scoped=this.controls?await this.controls.assertCapability(tx,actor,'COM-01',{purpose:'new_sales',environment:'sandbox',channel,productId:String(stored.data.productId),carrierId:String(stored.data.carrierId),customerId:actor.userId,cohortKey:actor.contextId+':'+actor.userId,...(actor.contextKind==='organization'?{organizationId:actor.contextId}:{})}):undefined;
      const snapshot={...stored.data,channel,purchasingContextKind:actor.contextKind,...(scoped?{scopedControlRevision:scoped.revision}:{}),...(actor.contextKind==='seller'?{distributorId:actor.userId}:{}),configurationRevision:revision,acceptedAt:new Date().toISOString(),reservationExpiresAt:new Date(Math.min(Date.parse(String(stored.data.expiresAt)),Date.now()+300000)).toISOString()};
      const row=(await tx.query<OrderRow>(`INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot) VALUES($1,$2,$3,$4,$5,'awaiting_payment','pending','not_started',$6) RETURNING *`,[id,actor.contextId,actor.userId,stored.data.productId,stored.data.carrierId,JSON.stringify(snapshot)])).rows[0]!;
      await tx.query('INSERT INTO audit(id,actor_id,tenant_id,action,resource_id,data) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),actor.userId,actor.contextId,'order.reserved',id,JSON.stringify({quoteId,revision})]);return this.projection(row);
    });
  }
  async order(actor:Actor,id:string):Promise<unknown>{
    authorize(actor,'orders.read');const row=(await this.db.query<OrderRow>('SELECT * FROM orders WHERE id=$1',[id])).rows[0];if(!row)throw new DomainError('resource_not_found',404,'Order not found.');this.allowed(actor,row);
    const p=(await this.db.query<{id:string;document_key:string|null}>('SELECT id,document_key FROM policies WHERE order_id=$1',[id])).rows[0];
    const submission=(await this.db.query<{state:string}>('SELECT state FROM submissions WHERE order_id=$1',[id])).rows[0];
    return {...this.projection(row,p?.id),submissionState:submission?.state??'not_started',deliveryState:p?.document_key?'available':'pending'};
  }
  async pay(actor:Actor,id:string,key:string):Promise<unknown>{
    authorize(actor,'payments.create');return this.memo(actor,'payment.create',key,{id},async tx=>{
      const order=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!order)throw new DomainError('resource_not_found',404,'Order not found.');this.allowed(actor,order);
      if(order.state!=='awaiting_payment'||order.payment_state!=='pending')throw new DomainError('invalid_state',409,'The order cannot start another payment.');
      const existing=(await tx.query<{id:string}>('SELECT id FROM payment_attempts WHERE order_id=$1 AND state=\'pending\' ORDER BY created_at DESC LIMIT 1',[id])).rows[0];
      const attemptId=existing?.id??randomUUID();
      if(!existing)await tx.query('INSERT INTO payment_attempts(id,order_id,provider_ref,amount,state) VALUES($1,$2,$3,$4,\'pending\')',[attemptId,id,'sandbox-'+attemptId,requireObject(order.quote_snapshot.premium).amount]);
      return {id:attemptId,paymentId:attemptId,orderId:id,sandboxPaymentUrl:'/sandbox/payments/'+attemptId,synthetic:true};
    });
  }
  private async commit(tx:SqlClient,order:OrderRow,kind:'verified_payment'|'approved_credit'):Promise<void>{
    if(order.state==='committed')return;
    if(order.state!=='awaiting_payment')throw new DomainError('invalid_state',409,'A cancelled order cannot be recommitted.');
    await tx.query("UPDATE orders SET state='committed',payment_state=$2,issuance_state='pending',committed_at=now(),version=version+1,exception_code=NULL,commitment_kind=$3 WHERE id=$1",[order.id,kind==='verified_payment'?'verified':'credit',kind]);
    const payload={orderId:order.id,productId:order.product_id,carrierId:order.carrier_id,tenantId:order.tenant_id,ownerId:order.owner_id,quoteSnapshot:order.quote_snapshot,commitmentKind:kind};
    await tx.query('INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,\'purchase.committed.v1\',$2,$3,$4)',[randomUUID(),order.id,order.tenant_id,JSON.stringify(payload)]);
    await tx.query('INSERT INTO submissions(id,order_id,carrier_id,state) VALUES($1,$2,$3,\'pending\') ON CONFLICT(order_id) DO NOTHING',[randomUUID(),order.id,order.carrier_id]);
  }
  async confirmSandbox(actor:Actor,attemptId:string):Promise<unknown>{
    authorize(actor,'payments.create');await this.db.transaction(async tx=>{
      const a=(await tx.query<{order_id:string}>('SELECT order_id FROM payment_attempts WHERE id=$1 FOR UPDATE',[attemptId])).rows[0];if(!a)throw new DomainError('resource_not_found',404,'Payment attempt not found.');
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1',[a.order_id])).rows[0]!;this.allowed(actor,o);
      await tx.query('UPDATE payment_attempts SET provider_confirmed=true WHERE id=$1',[attemptId]);
    });
    return this.verifyPayment(attemptId,actor);
  }
  async verifyPayment(attemptId:string,actor?:Actor):Promise<unknown>{
    const orderId=await this.db.transaction(async tx=>{
      const a=(await tx.query<{id:string;order_id:string;amount:string;provider_ref:string;provider_confirmed:boolean;state:string}>('SELECT * FROM payment_attempts WHERE id=$1 FOR UPDATE',[attemptId])).rows[0];
      if(!a)throw new DomainError('resource_not_found',404,'Payment attempt not found.');if(!a.provider_confirmed)throw new DomainError('payment_not_verified',409,'The sandbox provider has not confirmed funds.');
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[a.order_id])).rows[0]!;
      if(a.state==='verified')return o.id;
      if(a.amount!==String(requireObject(o.quote_snapshot.premium).amount))throw new DomainError('payment_amount_mismatch',409,'Verified amount differs from accepted terms.');
      const receipt=await tx.query('INSERT INTO payment_receipts(id,attempt_id,provider_ref,amount) VALUES($1,$2,$3,$4) ON CONFLICT(attempt_id) DO NOTHING',[randomUUID(),attemptId,a.provider_ref,a.amount]);
      if(receipt.rowCount)await tx.query('INSERT INTO audit(id,tenant_id,action,resource_id,data) VALUES($1,$2,\'payment.verified\',$3,$4)',[randomUUID(),o.tenant_id,o.id,JSON.stringify({attemptId,providerReference:a.provider_ref,amount:a.amount})]);
      await this.journal(tx,o.tenant_id,'receipt:'+attemptId,a.amount,'payment_clearing','customer_allocation');
      await tx.query("UPDATE payment_attempts SET state='verified',verified_at=COALESCE(verified_at,now()) WHERE id=$1",[attemptId]);
      if(o.state==='cancelled'||o.commitment_kind==='approved_credit'||o.commitment_kind==='verified_wallet_allocation'){
        await tx.query('UPDATE orders SET exception_code=$2 WHERE id=$1',[o.id,o.state==='cancelled'?'payment_after_cancellation':o.commitment_kind==='approved_credit'?'payment_after_credit_commitment':'payment_after_wallet_commitment']);return o.id;
      }
      await tx.query("UPDATE orders SET payment_state='verified' WHERE id=$1",[o.id]);
      if(o.state!=='committed'){
        const controls=(await tx.query<{key:string;enabled:boolean}>('SELECT key,enabled FROM feature_controls ORDER BY key FOR SHARE')).rows;const control=Object.fromEntries(controls.map(v=>[v.key,v.enabled]));
        if(control['security.quarantine']||Date.parse(String(o.quote_snapshot.reservationExpiresAt))<=Date.now()){
          await tx.query('UPDATE orders SET exception_code=$2 WHERE id=$1',[o.id,control['security.quarantine']?'security_quarantine':'paid_reservation_expired']);return o.id;
        }
        try{await this.business.assertPurchaseReady(tx,{tenantId:o.tenant_id,ownerId:o.owner_id,applicationId:String(o.quote_snapshot.applicationId),applicationVersion:Number(o.quote_snapshot.applicationVersion),productId:o.product_id},new Date());if(this.controls){if(!actor||actor.userId!==o.owner_id||actor.contextId!==o.tenant_id)throw new DomainError('order_actor_required',409,'Current authorized order processing context is required.');await this.controls.assertCapability(tx,actor,'COM-01',this.controlContext(actor,o,true));}}
        catch(error){if(!(error instanceof DomainError))throw error;await tx.query('UPDATE orders SET exception_code=$2 WHERE id=$1',[o.id,error.code]);return o.id;}
        await this.journal(tx,o.tenant_id,'allocation:'+o.id,a.amount,'customer_allocation','insurer_payable');await this.commit(tx,o,'verified_payment');
      }
      return o.id;
    });return {orderId,verified:true};
  }
  async requestCredit(actor:Actor,id:string,reason:string,key:string):Promise<unknown>{
    authorize(actor,'credit.request');if(actor.contextKind!=='organization')throw new DomainError('organization_required',403,'Credit is available only in an organization context.');
    return this.memo(actor,'credit.request',key,{id,reason},async tx=>{
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!o)throw new DomainError('resource_not_found',404,'Order not found.');this.allowed(actor,o);if(o.state!=='awaiting_payment')throw new DomainError('invalid_state',409,'The order is already committed.');
      const approvalId=randomUUID();await tx.query('INSERT INTO credit_approvals(id,order_id,maker_id,amount,reason) VALUES($1,$2,$3,$4,$5)',[approvalId,id,actor.userId,requireObject(o.quote_snapshot.premium).amount,reason]);return {id:approvalId,state:'requested'};
    });
  }
  async approveCredit(actor:Actor,id:string):Promise<unknown>{
    authorize(actor,'credit.approve');return this.db.transaction(async tx=>{
      const a=(await tx.query<{order_id:string;maker_id:string;amount:string;state:string}>('SELECT * FROM credit_approvals WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!a)throw new DomainError('resource_not_found',404,'Approval not found.');if(a.maker_id===actor.userId)throw new DomainError('maker_checker_required',403,'A different checker must approve.');
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[a.order_id])).rows[0]!;this.allowed(actor,o);if(a.state==='approved')return this.projection(o);
      if(o.state!=='awaiting_payment'||o.payment_state!=='pending')throw new DomainError('invalid_state',409,'The order already has a commercial commitment or verified funds.');
      if(Date.parse(String(o.quote_snapshot.expiresAt))<=Date.now())throw new DomainError('quote_expired',409,'Approval needs a current accepted offer.');
      await this.business.assertPurchaseReady(tx,{tenantId:o.tenant_id,ownerId:o.owner_id,applicationId:String(o.quote_snapshot.applicationId),applicationVersion:Number(o.quote_snapshot.applicationVersion),productId:o.product_id},new Date());
      await this.flags.assertSales(tx,String(o.quote_snapshot.channel) as Channel);
      if(this.controls)await this.controls.assertCapability(tx,actor,'ORG-03',this.controlContext(actor,o));
      const account=await tx.query('UPDATE credit_accounts SET reserved=reserved+$2 WHERE tenant_id=$1 AND reserved+$2<=credit_limit RETURNING tenant_id',[o.tenant_id,a.amount]);if(!account.rowCount)throw new DomainError('credit_limit_exceeded',409,'The organization has insufficient approved credit.');
      await tx.query("UPDATE credit_approvals SET state='approved',checker_id=$2 WHERE id=$1",[id,actor.userId]);
      await this.journal(tx,o.tenant_id,'credit:'+o.id,a.amount,'organization_receivable','insurer_payable');await this.commit(tx,o,'approved_credit');return {orderId:o.id,committed:true,paymentState:'credit'};
    });
  }
  async requestRefund(actor:Actor,id:string,amount:string,reason:string,key:string):Promise<unknown>{
    authorize(actor,'refund.request');money(amount);if(BigInt(amount)<=0n||reason.length<10)throw new DomainError('validation_failed',422,'A positive refund and reason are required.');
    return this.memo(actor,'refund.request',key,{id,amount,reason},async tx=>{
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!o)throw new DomainError('resource_not_found',404,'Order not found.');this.allowed(actor,o);
      await this.assertRefundableState(tx,o);
      const captured=(await tx.query<{total:string}>('SELECT COALESCE(sum(r.amount),0)::text AS total FROM payment_receipts r JOIN payment_attempts a ON r.attempt_id=a.id WHERE a.order_id=$1',[id])).rows[0]!;
      const reserved=(await tx.query<{total:string}>('SELECT COALESCE(sum(amount),0)::text AS total FROM refunds WHERE order_id=$1 AND state<>\'rejected\'',[id])).rows[0]!;
      if(BigInt(reserved.total)+BigInt(amount)>BigInt(captured.total))throw new DomainError('refund_exceeds_balance',409,'Requested refunds exceed verified funds.');
      const refundId=randomUUID();await tx.query("INSERT INTO refunds(id,order_id,amount,maker_id,state,reason) VALUES($1,$2,$3,$4,'requested',$5)",[refundId,id,amount,actor.userId,reason]);return {id:refundId,state:'requested'};
    });
  }
  async approveRefund(actor:Actor,id:string):Promise<void>{
    authorize(actor,'refund.approve');await this.db.transaction(async tx=>{
      const r=(await tx.query<{order_id:string;amount:string;maker_id:string;state:string}>('SELECT * FROM refunds WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!r)throw new DomainError('resource_not_found',404,'Refund not found.');if(r.maker_id===actor.userId)throw new DomainError('maker_checker_required',403,'Independent approval is required.');
      const o=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[r.order_id])).rows[0]!;this.allowed(actor,o);if(r.state==='paid')return;
      if(r.state==='external_outcome_unknown')throw new DomainError('reconciliation_required',409,'Verify the uncertain payout outcome before any further payout action.');
      if(r.state!=='requested'&&r.state!=='approved')throw new DomainError('invalid_state',409,'This refund is not eligible for execution.');
      await this.assertRefundableState(tx,o);
      await this.journal(tx,o.tenant_id,'refund:'+id,r.amount,o.state==='committed'?'insurer_payable':'customer_allocation','payment_clearing');await tx.query("UPDATE refunds SET state='paid',checker_id=$2 WHERE id=$1",[id,actor.userId]);
      const captured=(await tx.query<{total:string}>('SELECT COALESCE(sum(r.amount),0)::text AS total FROM payment_receipts r JOIN payment_attempts a ON r.attempt_id=a.id WHERE a.order_id=$1',[o.id])).rows[0]!;
      await tx.query("UPDATE orders SET refunded_amount=refunded_amount+$2,state=CASE WHEN refunded_amount+$2>=$3 THEN 'cancelled' ELSE state END,version=version+1 WHERE id=$1",[o.id,r.amount,captured.total]);
    });
  }
  private async assertRefundableState(tx:SqlClient,order:OrderRow):Promise<void>{
    if(order.payment_state!=='verified')throw new DomainError('verified_funds_required',409,'A verified receipt is required.');
    if(order.state==='awaiting_payment')return;
    const submission=(await tx.query<{state:string}>('SELECT state FROM submissions WHERE order_id=$1 FOR UPDATE',[order.id])).rows[0];
    if(order.state!=='committed'||order.issuance_state!=='failed'||submission?.state!=='rejected')throw new DomainError('carrier_resolution_required',409,'A definitive carrier rejection or confirmed cancellation is required before refund.');
  }
  async authorizeWalletPurchase(tx:SqlClient,actor:Actor,id:string):Promise<WalletPurchase>{
    authorize(actor,'orders.create');
    const row=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!row||row.tenant_id!==actor.contextId||row.owner_id!==actor.userId)throw new DomainError('resource_not_found',404,'Purchase not found.');
    if(row.state!=='awaiting_payment'||row.payment_state!=='pending')throw new DomainError('invalid_state',409,'Purchase already has funds or a commitment.');
    const quarantine=(await tx.query<{enabled:boolean}>("SELECT enabled FROM feature_controls WHERE key='security.quarantine' FOR SHARE")).rows[0];
    if(quarantine?.enabled)throw new DomainError('security_quarantine',409,'Purchase processing is suspended.');
    const expiresAt=String(row.quote_snapshot.reservationExpiresAt);
    if(Date.parse(expiresAt)<=Date.now())throw new DomainError('reservation_expired',409,'Accept a current offer before reserving wallet funds.');
    await this.business.assertPurchaseReady(tx,{tenantId:row.tenant_id,ownerId:row.owner_id,applicationId:String(row.quote_snapshot.applicationId),applicationVersion:Number(row.quote_snapshot.applicationVersion),productId:row.product_id},new Date());
    if(this.controls)await this.controls.assertCapability(tx,actor,'COM-01',this.controlContext(actor,row,true));
    const premium=requireObject(row.quote_snapshot.premium);
    return{reference:row.id,tenantId:row.tenant_id,ownerId:row.owner_id,amount:money(String(premium.amount)),version:row.version,eligibleBuckets:['promo','refund','cash','commission'],expiresAt,settlementAccount:'insurer_payable'};
  }
  async commitWalletPurchase(tx:SqlClient,actor:Actor,purchase:WalletPurchase,walletSpendId:string):Promise<void>{
    const current=await this.authorizeWalletPurchase(tx,actor,purchase.reference);
    if(current.version!==purchase.version||current.amount.amount!==purchase.amount.amount)throw new DomainError('version_conflict',409,'Purchase terms changed.');
    const row=(await tx.query<OrderRow>("UPDATE orders SET state='committed',payment_state='wallet',commitment_kind='verified_wallet_allocation',issuance_state='pending',committed_at=now(),version=version+1,exception_code=NULL WHERE id=$1 RETURNING *",[purchase.reference])).rows[0]!;
    const payload={orderId:row.id,productId:row.product_id,carrierId:row.carrier_id,tenantId:row.tenant_id,ownerId:row.owner_id,quoteSnapshot:row.quote_snapshot,commitmentKind:'verified_wallet_allocation',walletSpendId};
    await tx.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'purchase.committed.v2',$2,$3,$4)",[randomUUID(),row.id,row.tenant_id,payload]);
    await tx.query("INSERT INTO submissions(id,order_id,carrier_id,state) VALUES($1,$2,$3,'pending') ON CONFLICT(order_id) DO NOTHING",[randomUUID(),row.id,row.carrier_id]);
  }
  async authorizeWalletRefund(tx:SqlClient,actor:Actor,id:string,refundId:string,amount:import('@st/contracts').Money):Promise<void>{
    const row=(await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!row||row.tenant_id!==actor.contextId||row.owner_id!==actor.userId)throw new DomainError('resource_not_found',404,'Purchase not found.');
    if(row.payment_state!=='wallet'||row.commitment_kind!=='verified_wallet_allocation')throw new DomainError('wallet_funds_required',409,'This purchase was not funded from a wallet.');
    const submission=(await tx.query<{state:string}>('SELECT state FROM submissions WHERE order_id=$1 FOR UPDATE',[id])).rows[0];
    if(row.state!=='committed'||row.issuance_state!=='failed'||submission?.state!=='rejected')throw new DomainError('carrier_resolution_required',409,'Resolve the carrier obligation before returning wallet funds.');
    const total=BigInt(String(requireObject(row.quote_snapshot.premium).amount));
    if(BigInt(row.refunded_amount)+BigInt(amount.amount)>total)throw new DomainError('refund_exceeds_balance',409,'Refund exceeds the purchase allocation.');
    await tx.query("UPDATE orders SET refunded_amount=refunded_amount+$2,state=CASE WHEN refunded_amount+$2=$3 THEN 'cancelled' ELSE state END,version=version+1 WHERE id=$1",[id,amount.amount,total.toString()]);
    await tx.query("INSERT INTO audit(id,actor_id,tenant_id,action,resource_id,data) VALUES($1,$2,$3,'wallet.refund.authorized',$4,$5)",[randomUUID(),actor.userId,actor.contextId,id,{refundId,amount}]);
  }
  async policy(actor:Actor,id:string):Promise<Record<string,unknown>>{
    authorize(actor,'policies.read');const p=(await this.db.query<{id:string;tenant_id:string;owner_id:string;carrier_id:string;reference:string;effective_from:string;effective_until:string;state:string;data:Record<string,unknown>;order_id:string;document_key:string|null}>("SELECT *,effective_from::text AS effective_from,effective_until::text AS effective_until FROM policies WHERE id=$1",[id])).rows[0];if(!p)throw new DomainError('resource_not_found',404,'Policy not found.');this.allowed(actor,p);
    const o=(await this.db.query<{product_id:string}>('SELECT product_id FROM orders WHERE id=$1',[p.order_id])).rows[0];
    const today=new Date().toISOString().slice(0,10);const coverageState=['active','future','expired','issued'].includes(p.state)?p.effective_from>today?'future':p.effective_until<=today?'expired':'active':p.state;
    return {id:p.id,reference:p.reference,productId:o?.product_id,carrierId:p.carrier_id,state:coverageState,effectiveFrom:p.effective_from,effectiveUntil:p.effective_until,dateSemantics:'synthetic UTC date interval [from,until)',documentUrl:'/v1/policies/'+p.id+'/document',documentKey:p.document_key,synthetic:true};
  }
}
