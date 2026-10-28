import {createHash,randomUUID} from 'node:crypto';
import {DomainError,authorize,assertUuid,money,requireObject,text,type Actor,type Money} from '@st/contracts';
import {Database,type SqlClient} from '@st/database';
import type {FinanceOptions,PayoutRequest,PayoutOutcome,VerifiedReceipt,VerifiedInvoice,VerifiedAgreement,Reference} from '@st/finance';
import type {CommerceService} from './commerce';

interface Intent extends Record<string,unknown>{id:string;tenant_id:string;owner_id:string;purpose:VerifiedReceipt['purpose'];target_reference:string|null;amount:string;state:string;digest:string;confirmed_at:Date|null}
const own=(actor:Actor,tenant:string,owner:string)=>{if(actor.contextId!==tenant||actor.userId!==owner)throw new DomainError('resource_not_found',404,'Financial source not found.');};
const manager=(actor:Actor)=>actor.contextKind==='platform'&&actor.permissions.includes('finance.manage')&&actor.permissions.includes('finance.manage.all');
export class SandboxFinancePorts {
  constructor(private readonly db:Database,private readonly commerce:CommerceService){}
  private async references(actor:Actor,sql:string):Promise<Reference[]>{return(await this.db.query<{id:string;label:string}>(sql,[actor.contextId,actor.userId])).rows;}
  private intentProjection(row:Intent){return{id:row.id,amount:money(row.amount),purpose:row.purpose,targetReference:row.target_reference,state:row.state,synthetic:true};}
  async intents(actor:Actor){authorize(actor,'finance.fundWallet');const rows=(await this.db.query<Intent>('SELECT * FROM sandbox_finance_intents WHERE tenant_id=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 50',[actor.contextId,actor.userId])).rows;return{items:rows.map(row=>this.intentProjection(row)),synthetic:true};}
  async createIntent(actor:Actor,value:unknown,key:string){
    authorize(actor,'finance.fundWallet');const input=requireObject(value),valueMoney=requireObject(input.amount);
    if(Object.keys(input).some(k=>!['amount','purpose','targetReference'].includes(k))||Object.keys(valueMoney).some(k=>!['amount','currency','unit'].includes(k))||typeof valueMoney.amount!=='string'||valueMoney.currency!=='IRR'||valueMoney.unit!=='rial')throw new DomainError('invalid_money',422,'Use an exact integer rial amount.');
    const amount=money(valueMoney.amount),purpose=text(input,'purpose');if(BigInt(amount.amount)<=0n)throw new DomainError('invalid_money',422,'A positive amount is required.');
    if(!['wallet_funding','installment_payment','invoice_payment'].includes(purpose))throw new DomainError('validation_failed',422,'Unknown funding purpose.');
    const target=purpose==='wallet_funding'?null:assertUuid(text(input,'targetReference'));
    if(purpose==='wallet_funding'&&input.targetReference!==undefined)throw new DomainError('validation_failed',422,'Wallet funding cannot target an obligation.');
    if(!/^[A-Za-z0-9_.:-]{16,128}$/u.test(key))throw new DomainError('idempotency_key_required',422,'A stable idempotency key is required.');
    const digest=createHash('sha256').update(JSON.stringify({amount,purpose,target})).digest('hex');
    return this.db.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`sandbox-intent:${actor.contextId}:${actor.userId}:${key}`]);
      const previous=(await tx.query<Intent>('SELECT * FROM sandbox_finance_intents WHERE tenant_id=$1 AND owner_id=$2 AND idempotency_key=$3',[actor.contextId,actor.userId,key])).rows[0];
      if(previous){if(previous.digest!==digest)throw new DomainError('idempotency_conflict',409,'Intent input changed.');return this.intentProjection(previous);}
      if(purpose==='installment_payment'){
        const plan=(await tx.query<{tenant_id:string;owner_id:string}>("SELECT tenant_id,owner_id FROM finance_resources WHERE id=$1 AND kind='installment'",[target])).rows[0];
        if(!plan)throw new DomainError('resource_not_found',404,'Installment plan not found.');own(actor,plan.tenant_id,plan.owner_id);
      }
      if(purpose==='invoice_payment')await this.authorizeInvoice(tx,actor,target!);
      const row=(await tx.query<Intent>('INSERT INTO sandbox_finance_intents(id,tenant_id,owner_id,purpose,target_reference,amount,idempotency_key,digest) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[randomUUID(),actor.contextId,actor.userId,purpose,target,amount.amount,key,digest])).rows[0]!;
      return this.intentProjection(row);
    });
  }
  async confirmIntent(actor:Actor,id:string){
    authorize(actor,'finance.fundWallet');return this.db.transaction(async tx=>{const row=(await tx.query<Intent>('SELECT * FROM sandbox_finance_intents WHERE id=$1 FOR UPDATE',[assertUuid(id)])).rows[0];if(!row)throw new DomainError('resource_not_found',404,'Intent not found.');own(actor,row.tenant_id,row.owner_id);const confirmed=(await tx.query<Intent>("UPDATE sandbox_finance_intents SET state='confirmed',confirmed_at=COALESCE(confirmed_at,now()) WHERE id=$1 RETURNING *",[id])).rows[0]!;return this.intentProjection(confirmed);});
  }
  private async receipt(actor:Actor,id:string):Promise<VerifiedReceipt>{const row=(await this.db.query<Intent>('SELECT * FROM sandbox_finance_intents WHERE id=$1',[assertUuid(id)])).rows[0];if(!row)throw new DomainError('resource_not_found',404,'Receipt not found.');own(actor,row.tenant_id,row.owner_id);if(row.state!=='confirmed'||!row.confirmed_at)throw new DomainError('payment_not_verified',409,'Confirm the synthetic provider payment first.');return{provider:'local-finance-simulator',reference:row.id,tenantId:row.tenant_id,ownerId:row.owner_id,amount:money(row.amount),purpose:row.purpose,...(row.target_reference?{targetReference:row.target_reference}:{}),verifiedAt:new Date(row.confirmed_at).toISOString(),synthetic:true};}
  private recipientReference(tenant:string,owner:string){return`sandbox-recipient:${tenant}:${owner}`;}
  private async recipient(actor:Actor,reference:string){const match=/^sandbox-recipient:([a-f0-9-]{36}):([a-f0-9-]{36})$/u.exec(reference);if(!match?.[1]||!match[2])throw new DomainError('resource_not_found',404,'Synthetic recipient not found.');const tenant=assertUuid(match[1]),owner=assertUuid(match[2]);if(!manager(actor))own(actor,tenant,owner);const member=(await this.db.query('SELECT 1 FROM memberships WHERE user_id=$1 AND context_id=$2 AND active=true',[owner,tenant])).rowCount;if(!member)throw new DomainError('recipient_revoked',409,'Synthetic recipient membership is no longer active.');return{reference,tenantId:tenant,ownerId:owner,verifiedAt:new Date().toISOString(),synthetic:true as const};}
  private async payout(request:PayoutRequest,lookup:boolean):Promise<PayoutOutcome>{
    return this.db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[request.businessKey]);
      let row=(await tx.query<{id:string;tenant_id:string;owner_id:string;recipient_reference:string;amount:string;provider_reference:string}>('SELECT * FROM sandbox_finance_payouts WHERE business_key=$1',[request.businessKey])).rows[0];
      if(!row&&!lookup){const recipient=this.recipientReference(request.tenantId,request.ownerId);if(request.recipientReference!==recipient)throw new DomainError('recipient_changed',409,'Recipient does not match the approved payout.');const active=await tx.query('SELECT 1 FROM memberships WHERE user_id=$1 AND context_id=$2 AND active FOR SHARE',[request.ownerId,request.tenantId]);if(!active.rowCount)return{state:'rejected',reasonCode:'synthetic_recipient_revoked'};row=(await tx.query<typeof row & Record<string,unknown>>('INSERT INTO sandbox_finance_payouts(business_key,id,tenant_id,owner_id,recipient_reference,amount,provider_reference) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[request.businessKey,request.id,request.tenantId,request.ownerId,request.recipientReference,request.amount.amount,'sandbox-payout-'+request.id])).rows[0] as typeof row;}
      if(!row)return{state:'external_outcome_unknown'};
      if(row.id!==request.id||row.tenant_id!==request.tenantId||row.owner_id!==request.ownerId||row.recipient_reference!==request.recipientReference||row.amount!==request.amount.amount)throw new DomainError('payout_observation_conflict',409,'Stable payout request differs from its stored provider result.');
      return{state:'paid',providerReference:row.provider_reference,amount:money(row.amount)};
    });
  }
  private async authorizeInvoice(tx:SqlClient,actor:Actor,id:string):Promise<VerifiedInvoice>{const row=(await tx.query<{id:string;tenant_id:string;owner_id:string;quote_snapshot:Record<string,unknown>;version:number;commitment_kind:string}>('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[assertUuid(id)])).rows[0];if(!row||row.commitment_kind!=='approved_credit')throw new DomainError('resource_not_found',404,'Credit invoice not found.');own(actor,row.tenant_id,row.owner_id);return{reference:row.id,tenantId:row.tenant_id,ownerId:row.owner_id,total:money(String(requireObject(row.quote_snapshot.premium).amount)),version:row.version,creditReference:row.id};}
  private async creditState(tx:SqlClient,actor:Actor,id:string){
    const invoice=await this.authorizeInvoice(tx,actor,id);
    await tx.query('INSERT INTO credit_servicing(order_id,tenant_id,owner_id,total) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[id,invoice.tenantId,invoice.ownerId,invoice.total.amount]);
    const state=(await tx.query<{total:string;paid:string;installment_plan_id:string|null}>('SELECT total::text,paid::text,installment_plan_id FROM credit_servicing WHERE order_id=$1 FOR UPDATE',[id])).rows[0]!;
    return{invoice,state};
  }
  private async applyCredit(tx:SqlClient,actor:Actor,id:string,amount:Money,planId?:string){
    const {invoice,state}=await this.creditState(tx,actor,id);
    if((state.installment_plan_id??undefined)!==planId)throw new DomainError('credit_servicing_changed',409,'Use the current invoice or installment plan for this credit obligation.');
    if(BigInt(state.paid)+BigInt(amount.amount)>BigInt(state.total))throw new DomainError('credit_allocation_exceeds_debt',409,'The verified receipt exceeds the remaining credit obligation.');
    const released=await tx.query('UPDATE credit_accounts SET reserved=reserved-$2 WHERE tenant_id=$1 AND reserved>=$2 RETURNING tenant_id',[invoice.tenantId,amount.amount]);
    if(!released.rowCount)throw new DomainError('credit_projection_conflict',409,'Verified funds remain unallocated until the credit balance is reconciled.');
    await tx.query('UPDATE credit_servicing SET paid=paid+$2,version=version+1 WHERE order_id=$1',[id,amount.amount]);
  }
  private async agreement(actor:Actor,id:string):Promise<VerifiedAgreement>{
    const invoice=await this.db.transaction(tx=>this.authorizeInvoice(tx,actor,id));
    const order=(await this.db.query<{committed_at:Date}>('SELECT committed_at FROM orders WHERE id=$1',[id])).rows[0]!;
    const total=BigInt(invoice.total.amount),part=total/3n,remainder=total%3n,at=new Date(order.committed_at);
    return{reference:id,sourceReference:id,obligationSource:'existing_receivable',tenantId:invoice.tenantId,ownerId:invoice.ownerId,total:invoice.total,downPayment:money('0'),termsVersion:'synthetic-credit-three-30-day-v1',acceptedAt:at.toISOString(),synthetic:true,lines:[0,1,2].map(index=>{const principal=money((part+(BigInt(index)<remainder?1n:0n)).toString());return{id:'part-'+(index+1),dueDate:new Date(at.getTime()+(index+1)*30*86400000).toISOString().slice(0,10),principal,financingCost:money('0'),fee:money('0'),total:principal};})};
  }
  options():FinanceOptions{return{
    mode:'sandbox',
    funding:{environment:'sandbox',verify:(a,r)=>this.receipt(a,r),listReferences:a=>this.references(a,"SELECT id::text,'رسید تأییدشده آزمایشی — '||amount::text||' ریال' AS label FROM sandbox_finance_intents WHERE tenant_id=$1 AND owner_id=$2 AND state='confirmed' ORDER BY created_at DESC LIMIT 100")},
    promotions:{environment:'sandbox',listReferences:async a=>[{id:`sandbox-welcome:${a.contextId}:${a.userId}`,label:'اعتبار تبلیغاتی آزمایشی ۲۵٬۰۰۰ ریال'}],resolve:async(a,r)=>{if(r!==`sandbox-welcome:${a.contextId}:${a.userId}`)throw new DomainError('resource_not_found',404,'Promotion not found.');return{reference:r,tenantId:a.contextId,ownerId:a.userId,amount:money('25000'),expiresAt:'2027-12-31T00:00:00Z',ruleVersion:'synthetic-welcome-v1',synthetic:true};}},
    purchases:{listReferences:a=>this.references(a,"SELECT id::text,product_id||' — '||id::text AS label FROM orders WHERE tenant_id=$1 AND owner_id=$2 AND state='awaiting_payment' AND payment_state='pending' AND (quote_snapshot->>'reservationExpiresAt')::timestamptz>now() ORDER BY created_at DESC LIMIT 100"),authorize:(tx,a,r)=>this.commerce.authorizeWalletPurchase(tx,a,r),commit:(tx,a,p,s)=>this.commerce.commitWalletPurchase(tx,a,p,s),authorizeRefund:(tx,a,p,r,n)=>this.commerce.authorizeWalletRefund(tx,a,p,r,n)},
    financing:{environment:'sandbox',listReferences:a=>this.references(a,"SELECT o.id::text,o.product_id||' — تبدیل اعتبار آزمایشی به ۳ قسط ۳۰ روزه بدون هزینه' AS label FROM orders o LEFT JOIN credit_servicing c ON c.order_id=o.id WHERE o.tenant_id=$1 AND o.owner_id=$2 AND o.commitment_kind='approved_credit' AND c.installment_plan_id IS NULL AND COALESCE(c.paid,0)=0 ORDER BY o.created_at DESC LIMIT 100"),resolve:(a,r)=>this.agreement(a,r),activate:async(tx,a,agreement,planId)=>{const {invoice,state}=await this.creditState(tx,a,agreement.sourceReference);if(invoice.total.amount!==agreement.total.amount||state.paid!=='0'||state.installment_plan_id)throw new DomainError('credit_servicing_changed',409,'Only a wholly unpaid unconverted credit invoice can become this schedule.');const legacy=(await tx.query("SELECT id FROM finance_resources WHERE kind='invoice_payment' AND data->>'invoiceReference'=$1 AND state IN('allocated','partially_unallocated') LIMIT 1",[invoice.reference])).rowCount;if(legacy)throw new DomainError('credit_servicing_changed',409,'This invoice already has allocated payments.');await tx.query('UPDATE credit_servicing SET installment_plan_id=$2,version=version+1 WHERE order_id=$1',[invoice.reference,planId]);return{sourceAccount:'organization_receivable'};},applyPayment:(tx,a,r,planId,_receipt,allocated)=>this.applyCredit(tx,a,r,allocated,planId)},
    payouts:{environment:'sandbox',capabilities:{idempotency:true,statusLookup:true},listReferences:async a=>[{id:this.recipientReference(a.contextId,a.userId),label:'گیرنده کاملاً آزمایشی — بدون حساب بانکی واقعی'}],recipient:(a,r)=>this.recipient(a,r),pay:r=>this.payout(r,false),status:r=>this.payout(r,true)},
    sales:{environment:'sandbox',listReferences:a=>this.references(a,"SELECT o.id::text,o.product_id||' — فروش آزمایشی صادرشده' AS label FROM orders o JOIN policies p ON p.order_id=o.id WHERE o.tenant_id=$1 AND o.owner_id=$2 AND o.quote_snapshot->>'distributorId'=$2::text ORDER BY o.created_at DESC LIMIT 100"),resolve:async(a,r)=>{const row=(await this.db.query<{tenant_id:string;owner_id:string;state:string;quote_snapshot:Record<string,unknown>;created_at:Date;policy_id:string|null}>('SELECT o.*,p.id AS policy_id FROM orders o LEFT JOIN policies p ON p.order_id=o.id WHERE o.id=$1',[assertUuid(r)])).rows[0];if(!row||typeof row.quote_snapshot.distributorId!=='string'||!manager(a)&&row.quote_snapshot.distributorId!==a.userId)throw new DomainError('resource_not_found',404,'Attributed sale not found.');if(!manager(a))own(a,row.tenant_id,row.owner_id);if(!row.policy_id)throw new DomainError('sale_not_qualified',409,'A confirmed issued policy is required.');return{reference:r,tenantId:row.tenant_id,beneficiaryId:row.quote_snapshot.distributorId,state:row.state==='cancelled'?'cancelled':'issued',commission:money((BigInt(String(requireObject(row.quote_snapshot.premium).amount))*2n/100n).toString()),ruleVersion:'synthetic-2-percent-v1',vestAt:new Date(row.created_at).toISOString(),synthetic:true};}},
    invoices:{listReferences:a=>this.references(a,"SELECT o.id::text,o.product_id||' — صورتحساب اعتبار سازمانی' AS label FROM orders o LEFT JOIN credit_servicing c ON c.order_id=o.id WHERE o.tenant_id=$1 AND o.owner_id=$2 AND o.commitment_kind='approved_credit' AND c.installment_plan_id IS NULL ORDER BY o.created_at DESC LIMIT 100"),authorize:(tx,a,r)=>this.authorizeInvoice(tx,a,r),apply:(tx,a,invoice,_receipt,amount)=>this.applyCredit(tx,a,invoice.reference,amount)}
  };}
}
