import type {Actor,Money} from '@st/contracts';
import type {SqlClient} from '@st/database';
export type Bucket='cash'|'refund'|'commission'|'promo';
export interface CommandOptions {idempotencyKey:string;expectedVersion?:number}
export interface FinanceResource {id:string;kind:string;state:string;version:number;data:Record<string,unknown>;createdAt:string;updatedAt:string}
export interface Reference {id:string;label:string}
export interface ExternalPort {environment:'sandbox'|'live';listReferences?(actor:Actor):Promise<Reference[]>}
export interface VerifiedReceipt {provider:string;reference:string;tenantId:string;ownerId:string;amount:Money;purpose:'wallet_funding'|'installment_payment'|'invoice_payment';targetReference?:string;verifiedAt:string;synthetic:true}
export interface FundingPort extends ExternalPort {verify(actor:Actor,reference:string):Promise<VerifiedReceipt>}
export interface PromotionGrant {reference:string;tenantId:string;ownerId:string;amount:Money;expiresAt:string;ruleVersion:string;synthetic:true}
export interface PromotionPort extends ExternalPort {resolve(actor:Actor,reference:string):Promise<PromotionGrant>}
export interface WalletPurchase {reference:string;tenantId:string;ownerId:string;amount:Money;version:number;eligibleBuckets:Bucket[];expiresAt:string;settlementAccount:string}
export interface PurchasePort {
  listReferences?(actor:Actor):Promise<Reference[]>;
  authorize(tx:SqlClient,actor:Actor,reference:string):Promise<WalletPurchase>;
  commit(tx:SqlClient,actor:Actor,purchase:WalletPurchase,walletSpendId:string):Promise<void>;
  authorizeRefund(tx:SqlClient,actor:Actor,purchaseReference:string,refundId:string,amount:Money):Promise<void>;
}
export interface InstallmentLine {id:string;dueDate:string;principal:Money;financingCost:Money;fee:Money;total:Money}
export interface VerifiedAgreement {reference:string;tenantId:string;ownerId:string;total:Money;downPayment:Money;termsVersion:string;acceptedAt:string;lines:InstallmentLine[];obligationSource:'new_financing'|'existing_receivable';sourceReference:string;synthetic:true}
export interface FinancingPort extends ExternalPort {
  resolve(actor:Actor,reference:string):Promise<VerifiedAgreement>;
  activate?(tx:SqlClient,actor:Actor,agreement:VerifiedAgreement,planId:string):Promise<{sourceAccount:'organization_receivable'}>;
  applyPayment?(tx:SqlClient,actor:Actor,agreementReference:string,planId:string,receipt:VerifiedReceipt,allocated:Money):Promise<void>;
}
export interface QualifyingSale {reference:string;tenantId:string;beneficiaryId:string;state:'issued'|'settled'|'cancelled'|'refunded';commission:Money;ruleVersion:string;vestAt:string;synthetic:true}
export interface QualifyingSalePort extends ExternalPort {resolve(actor:Actor,reference:string):Promise<QualifyingSale>}
export interface VerifiedRecipient {reference:string;tenantId:string;ownerId:string;verifiedAt:string;synthetic:true}
export interface PayoutRequest {id:string;businessKey:string;tenantId:string;ownerId:string;recipientReference:string;amount:Money}
export type PayoutOutcome={state:'paid';providerReference:string;amount:Money}|{state:'pending'|'external_outcome_unknown';providerReference?:string}|{state:'rejected';providerReference?:string;reasonCode:string};
export interface PayoutPort extends ExternalPort {
  capabilities:{idempotency:boolean;statusLookup:boolean};
  recipient(actor:Actor,reference:string):Promise<VerifiedRecipient>;
  pay(request:PayoutRequest):Promise<PayoutOutcome>;
  status?(request:PayoutRequest,providerReference?:string):Promise<PayoutOutcome>;
}
export interface VerifiedInvoice {reference:string;tenantId:string;ownerId:string;total:Money;version:number;creditReference:string}
export interface InvoicePort {
  listReferences?(actor:Actor):Promise<Reference[]>;
  authorize(tx:SqlClient,actor:Actor,reference:string):Promise<VerifiedInvoice>;
  apply(tx:SqlClient,actor:Actor,invoice:VerifiedInvoice,receipt:VerifiedReceipt,amount:Money):Promise<void>;
}
export interface FinanceOptions {
  mode?:'sandbox';clock?:()=>Date;id?:()=>string;cursorSecret?:string;
  funding?:FundingPort;promotions?:PromotionPort;purchases?:PurchasePort;financing?:FinancingPort;sales?:QualifyingSalePort;payouts?:PayoutPort;invoices?:InvoicePort;
}
export interface BalanceView {currency:'IRR';unit:'rial';buckets:{bucket:Bucket;balance:string;reserved:string;available:string}[];asOf:string}
export interface FinancePage {items:FinanceResource[];nextCursor:string|null;asOf:string}
