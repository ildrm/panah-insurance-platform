import type { Money, RequestOptions } from './index.js';

export type WalletBucket = 'cash' | 'refund' | 'commission' | 'promo';
export type WithdrawableBucket = Exclude<WalletBucket, 'promo'>;
export type WalletBalance = { bucket: WalletBucket; balance: string; reserved: string; available: string };
export type WalletBalances = { currency: 'IRR'; unit: 'rial'; buckets: WalletBalance[]; asOf: string };
export type FinanceEntry = { id: string; bucket: WalletBucket; amount: Money; direction: 'credit' | 'debit'; source: string; reference: string; journalId: string; createdAt: string };
export type Installment = { id: string; planId: string; state: string; amount: Money; principal: Money; financingCost: Money; fee: Money; paid: Money; outstanding: Money; dueDate: string };
export type InstallmentPlan = { id: string; state: string; version: number; reference: string; total: Money; downPayment: Money; downPaymentState: string; paid: Money; termsVersion: string; rows: Installment[]; createdAt: string };
export type Commission = { id: string; state: string; version: number; amount: Money; saleReference: string; createdAt: string; vestAt: string; ruleVersion: string; qualifyingState: string };
export type Payout = { id: string; state: string; version: number; bucket: WithdrawableBucket; amount: Money; recipientLabel: string; recipientReference: string; makerId: string; reason: string; createdAt: string; providerReference: string; providerState: string; statusLookup: boolean };
export type FinanceReservation = { id: string; state: string; version: number; reference: string; amount: Money; expiresAt: string; allocations: {bucket: WalletBucket; amount: string}[] };
export type FinanceReference = { id: string; label: string; amount?: Money; state: string; bucket?: WalletBucket; metadata: Record<string, unknown> };
export type FinanceReferences = { funding: FinanceReference[]; promotions: FinanceReference[]; purchases: FinanceReference[]; agreements: FinanceReference[]; sales: FinanceReference[]; recipients: FinanceReference[]; invoices: FinanceReference[]; mode: string };
export type FinancePage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean; asOf: string };
export type FinanceTransport = { request(path: string, options?: RequestOptions): Promise<unknown> };
export type FinanceOperationBodies = {
  fundWallet: { providerReference: string };
  grantPromotion: { grantReference: string };
  reserveWalletSpend: { purchaseReference: string };
  commitWalletSpend: { reservationId: string };
  releaseWalletSpend: { reservationId: string };
  refundWalletSpend: { spendId: string; amount: Money; reason: string };
  createInstallments: { agreementReference: string };
  allocateInstallmentPayment: { planId: string; providerReference: string };
  accrueCommission: { saleReference: string };
  vestCommission: { id: string };
  reverseCommission: { id: string; reason: string };
  requestPayout: { bucket: WithdrawableBucket; amount: Money; recipientReference: string; reason: string };
  approvePayout: { id: string; reason: string };
  reconcilePayout: { id: string; reason: string };
  dispatchPayout: { id: string };
  allocateInvoicePayment: { invoiceReference: string; providerReference: string };
};
export type FinanceOperation = keyof FinanceOperationBodies;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function record(value: unknown): Record<string, unknown> { return isRecord(value) ? value : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function integer(value: unknown, fallback = 1): number { return typeof value === 'number' && Number.isSafeInteger(value) ? value : fallback; }
function amount(value: unknown): string { const result = text(value); if (!/^-?(0|[1-9][0-9]{0,23})$/.test(result)) throw new Error('مبلغ معتبر از سرویس مالی دریافت نشد.'); return result; }
function bucket(value: unknown): WalletBucket { if (value !== 'cash' && value !== 'refund' && value !== 'commission' && value !== 'promo') throw new Error('نوع حساب مالی معتبر نیست.'); return value; }
function moneyValue(value: unknown): Money { const object = record(value); if (object.currency !== 'IRR' || object.unit !== 'rial') throw new Error('واحد مبلغ مالی مشخص یا پشتیبانی‌شده نیست.'); return { amount: amount(object.amount), currency: 'IRR', unit: 'rial' }; }
function canonicalMoney(value: unknown): Money { return typeof value === 'string' ? { amount: amount(value), currency: 'IRR', unit: 'rial' } : moneyValue(value); }
function id(value: unknown): string { const result = text(value); if (!result) throw new Error('مرجع پاسخ مالی کامل نیست.'); return result; }
function page<T>(value: unknown, parse: (item: unknown) => T): FinancePage<T> { const data = record(value); const pageInfo = record(data.pageInfo); const next = text(data.nextCursor ?? pageInfo.nextCursor); return { items: list(data.items ?? data.rows).map(parse), nextCursor: next || null, hasMore: data.hasMore === true || pageInfo.hasMore === true || Boolean(next), asOf: text(data.asOf) }; }
function resource(value: unknown): { row: Record<string, unknown>; data: Record<string, unknown> } { const row=record(value); id(row.id); if (!isRecord(row.data) || typeof row.version !== 'number' || !Number.isSafeInteger(row.version) || row.version<1) throw new Error('نسخه یا جزئیات پاسخ مالی کامل نیست.');return {row,data:row.data}; }
function entries(value: unknown): FinanceEntry[] { const {row,data}=resource(value); const changes=list(data.changes); if(!changes.length)throw new Error('ثبت دفترکل فاقد آثار مالی است.');return changes.map((value,index)=>{const change=record(value); if(change.direction!=='credit'&&change.direction!=='debit')throw new Error('جهت ثبت دفترکل مشخص نیست.');return{id:`${id(row.id)}:${index}`,bucket:bucket(change.bucket),amount:moneyValue(change.amount),direction:change.direction,source:text(row.kind),reference:text(data.sourceReference),journalId:id(row.id),createdAt:text(row.createdAt)};}); }
function installment(value: unknown,planId:string): Installment { const data=record(value);return{id:id(data.id),planId,state:text(data.status),amount:moneyValue(data.total),principal:moneyValue(data.principal),financingCost:moneyValue(data.financingCost),fee:moneyValue(data.fee),paid:canonicalMoney(data.paidAmount),outstanding:moneyValue(data.outstanding),dueDate:text(data.dueDate)}; }
function plan(value: unknown): InstallmentPlan { const {row,data}=resource(value);return{id:id(row.id),state:text(row.state),version:integer(row.version),reference:text(data.agreementReference),total:moneyValue(data.total),downPayment:moneyValue(data.downPayment),downPaymentState:text(data.downPaymentState),paid:canonicalMoney(data.paidAmount),termsVersion:text(data.termsVersion),rows:list(data.lines).map(value=>installment(value,id(row.id))),createdAt:text(row.createdAt)}; }
function commission(value: unknown): Commission { const {row,data}=resource(value);return{id:id(row.id),state:text(row.state),version:integer(row.version),amount:moneyValue(data.amount),saleReference:text(data.saleReference),createdAt:text(row.createdAt),vestAt:text(data.vestAt),ruleVersion:text(data.ruleVersion),qualifyingState:text(data.qualifyingState)}; }
function payout(value: unknown): Payout { const {row,data}=resource(value);const account=bucket(data.bucket);if(account==='promo')throw new Error('اعتبار تبلیغاتی قابل برداشت نقدی نیست.');return{id:id(row.id),state:text(row.state),version:integer(row.version),bucket:account,amount:moneyValue(data.amount),recipientLabel:text(data.recipientLabel),recipientReference:text(data.recipientReference),makerId:text(data.makerId),reason:text(data.reason),createdAt:text(row.createdAt),providerReference:text(data.providerReference),providerState:text(data.providerState),statusLookup:record(data.providerCapabilities).statusLookup===true}; }
function reservation(value: unknown): FinanceReservation { const {row,data}=resource(value);return{id:id(row.id),state:text(row.state),version:integer(row.version),reference:text(data.purchaseReference),amount:moneyValue(data.amount),expiresAt:text(data.expiresAt),allocations:list(data.allocations).map(value=>{const allocation=record(value);return{bucket:bucket(allocation.bucket),amount:amount(allocation.amount)};})}; }
function reference(value: unknown): FinanceReference { const data = record(value); return { id: id(data.id ?? data.reference), label: text(data.label ?? data.title), ...(data.amount !== undefined ? { amount: canonicalMoney(data.amount) } : {}), state: text(data.state), ...(['cash','refund','commission','promo'].includes(text(data.bucket)) ? { bucket: bucket(data.bucket) } : {}), metadata: record(data.metadata) }; }

export class FinanceClient {
  constructor(private readonly transport: FinanceTransport) {}
  async balances(): Promise<WalletBalances> { const data = record(await this.transport.request('/v1/finance/balances')); if (data.currency !== 'IRR' || data.unit !== 'rial') throw new Error('واحد حساب مالی مشخص نیست.'); const buckets = list(data.buckets).map(value => { const row = record(value); return { bucket: bucket(row.bucket), balance: amount(row.balance), reserved: amount(row.reserved), available: amount(row.available) }; }); if (buckets.length !== 4 || new Set(buckets.map(row => row.bucket)).size !== 4) throw new Error('تفکیک حساب‌ها از سرویس مالی کامل دریافت نشد.'); return { currency: 'IRR', unit: 'rial', buckets, asOf: text(data.asOf) }; }
  async entries(cursor = ''): Promise<FinancePage<FinanceEntry>> { const result=page(await this.transport.request(`/v1/finance/entries?limit=25&cursor=${encodeURIComponent(cursor)}`), entries);return{...result,items:result.items.flat()}; }
  async installments(cursor = ''): Promise<FinancePage<InstallmentPlan>> { return page(await this.transport.request(`/v1/finance/installments?limit=25&cursor=${encodeURIComponent(cursor)}`), plan); }
  async commissions(cursor = ''): Promise<FinancePage<Commission>> { return page(await this.transport.request(`/v1/finance/commissions?limit=25&cursor=${encodeURIComponent(cursor)}`), commission); }
  async payouts(cursor = ''): Promise<FinancePage<Payout>> { return page(await this.transport.request(`/v1/finance/payouts?limit=25&cursor=${encodeURIComponent(cursor)}`), payout); }
  async payoutReview(purpose:string,cursor=''): Promise<FinancePage<Payout>> { return page(await this.transport.request(`/v1/finance/payout-review?purpose=${encodeURIComponent(purpose)}&cursor=${encodeURIComponent(cursor)}`),payout); }
  async payout(id:string): Promise<Payout> { return payout(await this.transport.request(`/v1/finance/resources/payout/${encodeURIComponent(id)}`)); }
  async references(): Promise<FinanceReferences> { const data = record(await this.transport.request('/v1/finance/references')); return { funding: list(data.funding ?? data.fundingReferences).map(reference), promotions: list(data.promotions ?? data.promotionGrants).map(reference), purchases: list(data.purchases ?? data.purchaseReferences).map(reference), agreements: list(data.agreements ?? data.agreementReferences).map(reference), sales: list(data.sales ?? data.saleReferences).map(reference), recipients: list(data.recipients ?? data.recipientReferences).map(reference), invoices: list(data.invoices).map(reference), mode: text(data.mode) }; }
  async reservations(cursor = ''): Promise<FinancePage<FinanceReservation>> { return page(await this.transport.request(`/v1/finance/resources/wallet_reservation?limit=25&cursor=${encodeURIComponent(cursor)}`),reservation); }
  async reconciliation(): Promise<Record<string, unknown>> { return record(await this.transport.request('/v1/finance/reconciliation')); }
}
