export type CarrierId = 'rest' | 'soap' | 'signed';
export type CarrierScenario = 'normal' | 'timeout_after_acceptance' | 'malformed_response' | 'throttled' | 'expired_token' | 'partial_outage' | 'document_outage' | 'callback_before_ack' | 'mapping_version_change' | 'definitive_reject' | 'duplicate_callback' | 'out_of_order_callback' | 'idempotency_not_supported';
export interface Money { amount: string; currency: 'IRR'; unit: 'rial' }
export interface QuoteInput {
  applicationId: string;
  productId: string;
  risk: Record<string, unknown>;
  channel: string;
  tenantId: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
}
export interface CarrierQuote {
  id: string;
  carrierId: CarrierId;
  productId: string;
  premium: Money;
  coverages: string[];
  expiresAt: string;
  effectiveFrom: string;
  effectiveUntil: string;
  mappingVersion: 'v1';
  synthetic: true;
  connectionId?: string;
  connectionVersion?: number;
}
export interface CarrierPurchase {
  orderId: string;
  productId: string;
  carrierId: CarrierId;
  tenantId: string;
  ownerId: string;
  quoteSnapshot: CarrierQuote;
  insuredScheduleRef?: string;
}
export interface SubmissionResult { reference: string; status: 'acknowledged'; }
export type StatusResult =
  | { status: 'not_found'; authoritative: boolean }
  | { status: 'pending'; reference: string; authoritative: true }
  | { status: 'issued'; reference: string; policyReference: string; effectiveFrom: string; effectiveUntil: string; documentReference: string; authoritative: true }
  | { status: 'rejected'; code: string; authoritative: true };
export interface PolicyDocument { contentType: 'application/pdf'; bytes: Buffer; sha256: string; }
export interface CarrierCapabilities {
  quote: boolean; submit: boolean; status: boolean; retrieveDocument: boolean;
  reserve: boolean; issue: boolean; endorse: boolean; cancel: boolean; claim: boolean; claimPayout: boolean;
  idempotency: boolean; callbacks: boolean; schemaVersion: 'v1'; supportedProducts: readonly string[];
}
export interface CarrierAdapter {
  readonly id: CarrierId;
  readonly capabilities: CarrierCapabilities;
  quote(input: QuoteInput): Promise<CarrierQuote>;
  submit(purchase: CarrierPurchase, businessKey: string): Promise<SubmissionResult>;
  status(orderId: string, externalReference?: string): Promise<StatusResult>;
  document(policyReference: string): Promise<PolicyDocument>;
}
export type FailureKind = 'business_rejection' | 'mapping_error' | 'transient' | 'authentication' | 'external_outcome_unknown' | 'capability_unsupported';
export class IntegrationError extends Error {
  constructor(readonly code: string, readonly kind: FailureKind, readonly retriable: boolean, message: string) { super(message); this.name = 'IntegrationError'; }
}
export interface VerifiedCallback {
  eventId: string; orderId: string; reference: string; sequence: number;
  status: 'pending' | 'issued'; policyReference?: string; effectiveFrom?: string; effectiveUntil?: string; documentReference?: string;
}
export interface GatewayOptions {
  baseUrl: string;
  mode: 'sandbox' | 'live';
  signingSecret?: string;
  restKey?: string;
  soapCertificateId?: string;
  clock?: () => Date;
  timeoutMs?: number;
  perProviderConcurrency?: number;
}
