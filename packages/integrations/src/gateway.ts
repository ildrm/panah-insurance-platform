import { CarrierAdapter, CarrierCapabilities, CarrierId, CarrierPurchase, CarrierQuote, GatewayOptions, IntegrationError, PolicyDocument, QuoteInput, StatusResult, SubmissionResult, VerifiedCallback } from './contracts.js';
import { gregorianDate, isoDate, persianDate, rialAmount, rialToToman, sha256, signedHeaders, SYNTHETIC_SIGNING_KEY, validateSandboxBaseUrl, verifySignedBytes } from './security.js';
import { parseSoap, soapEnvelope } from './xml.js';

const PRODUCTS = ['PRD-01', 'PRD-07', 'PRD-24'] as const;
const mappingError = (message: string): never => { throw new IntegrationError('mapping_invalid', 'mapping_error', false, message); };
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : mappingError('Expected an object');
const string = (value: unknown, name: string): string => typeof value === 'string' && value.length > 0 && value.length <= 256 ? value : mappingError(`Invalid ${name}`);
const utcInstant = (value: unknown): string => { const v = string(value, 'UTC timestamp'); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().replace('.000Z', 'Z') !== v.replace('.000Z', 'Z')) mappingError('Invalid UTC timestamp'); return v; };
const identifier = (value: unknown, name: string): string => { const v = string(value, name); return /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : mappingError(`Invalid ${name}`); };
const acknowledgementIdentifier = (value: unknown, name: string): string => { try { return identifier(value, name); } catch { throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Mutation acknowledgment has an invalid reference'); } };
const keys = (data: Record<string, unknown>, allowed: readonly string[], required: readonly string[] = allowed): void => {
  if (Object.keys(data).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(data, k))) mappingError('Unknown or missing wire fields');
};
function projection(input: QuoteInput): { subjectRef: string; manufactureYear?: number; memberCount?: number } {
  if (input.productId === 'PRD-01') {
    const year = Number(input.risk['manufactureYear'] ?? input.risk['vehicleYear'] ?? 2025);
    if (!Number.isInteger(year) || year < 2000 || year > 2030) mappingError('Synthetic vehicle year must be 2000..2030');
    return { subjectRef: identifier(input.applicationId, 'applicationId'), manufactureYear: year };
  }
  const census = input.risk['members'] ?? input.risk['census'];
  const count = Number(input.risk['memberCount'] ?? (Array.isArray(census) ? census.length : 1));
  if (!Number.isInteger(count) || count < 1 || count > 20_000) mappingError('Synthetic group member count must be 1..20000');
  return { subjectRef: identifier(input.applicationId, 'censusRef'), memberCount: count };
}
function dates(input: QuoteInput, clock: () => Date): { from: string; until: string } {
  const from = isoDate(input.effectiveFrom ?? new Date(clock().getTime() + 86_400_000).toISOString().slice(0, 10));
  const until = isoDate(input.effectiveUntil ?? new Date(Date.parse(from + 'T12:00:00Z') + 365 * 86_400_000).toISOString().slice(0, 10));
  if (until <= from) mappingError('Coverage end must follow start');
  return { from, until };
}
function productCheck(input: QuoteInput): void {
  if (!(PRODUCTS as readonly string[]).includes(input.productId)) throw new IntegrationError('product_capability_unsupported', 'capability_unsupported', false, 'This fictional carrier has no approved synthetic mapping for the product');
}
class Semaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];
  constructor(private readonly max: number) {}
  idle(): boolean { return this.active === 0 && this.waiters.length === 0; }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      if (this.waiters.length >= 64) throw new IntegrationError('provider_admission_limited', 'transient', true, 'Provider concurrency queue is full');
      await new Promise<void>(resolve => this.waiters.push(resolve));
    } else this.active++;
    try { return await fn(); } finally { const next = this.waiters.shift(); if (next) next(); else this.active--; }
  }
}
class Transport {
  private readonly origin: URL;
  constructor(private readonly options: GatewayOptions) {
    if (options.mode !== 'sandbox') throw new IntegrationError('live_connector_disabled', 'capability_unsupported', false, 'Live carrier contracts and certification are not configured');
    this.origin = validateSandboxBaseUrl(options.baseUrl);
    if (this.origin.hostname === 'localhost') this.origin.hostname = '127.0.0.1';
  }
  async request(path: string, method: 'GET' | 'POST', body: string | undefined, headers: Record<string, string>, mutation: boolean): Promise<{ status: number; text: string }> {
    if (!/^\/sim\/(rest|soap|signed)\/v1\/[A-Za-z0-9_/-]+$/.test(path) && path !== '/sim/soap/v1') mappingError('Unapproved carrier operation path');
    let response: Response;
    try {
      response = await fetch(new URL(path, this.origin), { method, body, headers, redirect: 'error', signal: AbortSignal.timeout(this.options.timeoutMs ?? 3_000) });
    } catch {
      throw new IntegrationError(mutation ? 'external_outcome_unknown' : 'provider_unavailable', mutation ? 'external_outcome_unknown' : 'transient', !mutation, mutation ? 'Carrier may have accepted the request; reconcile before replay' : 'Carrier request could not complete');
    }
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      if (reader) {
        for (;;) {
          const chunk = await reader.read(); if (chunk.done) break;
          length += chunk.value.length;
          if (length > 65_536) { await reader.cancel(); throw new IntegrationError('response_too_large', mutation ? 'external_outcome_unknown' : 'mapping_error', false, 'Carrier response exceeded the bounded contract'); }
          chunks.push(chunk.value);
        }
      }
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(mutation ? 'external_outcome_unknown' : 'provider_unavailable', mutation ? 'external_outcome_unknown' : 'transient', !mutation, 'Carrier response stream did not complete');
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (response.status === 401) throw new IntegrationError('provider_authentication', 'authentication', false, 'Carrier authentication failed');
    if (response.status === 429 || response.status === 503) {
      let accepted = true;
      try { accepted = record(JSON.parse(text))['accepted'] !== false; } catch { accepted = mutation; }
      if (mutation && accepted) throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Failure did not establish that carrier acceptance was absent');
      throw new IntegrationError('provider_throttled', 'transient', true, 'Carrier temporarily unavailable before acceptance');
    }
    if (response.status === 409) {
      try { const code = record(JSON.parse(text))['code']; if (code === 'idempotency_conflict' || code === 'duplicate_reference') throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'A prior external effect conflicts with this request identity'); }
      catch (error) { if (error instanceof IntegrationError) throw error; }
    }
    if (response.status >= 400 && response.status !== 404 && response.status !== 405) throw new IntegrationError('provider_rejected', 'business_rejection', false, 'Carrier rejected the operation');
    return { status: response.status, text };
  }
}
abstract class BaseAdapter implements CarrierAdapter {
  abstract readonly id: CarrierId;
  abstract readonly capabilities: CarrierCapabilities;
  readonly clock: () => Date;
  constructor(protected readonly transport: Transport, protected readonly options: GatewayOptions) { this.clock = options.clock ?? (() => new Date()); }
  abstract quote(input: QuoteInput): Promise<CarrierQuote>;
  abstract submit(purchase: CarrierPurchase, key: string): Promise<SubmissionResult>;
  abstract status(orderId: string, reference?: string): Promise<StatusResult>;
  abstract document(reference: string): Promise<PolicyDocument>;
  protected quoteValue(input: QuoteInput, id: string, amount: unknown, expiry: unknown): CarrierQuote {
    const effective = dates(input, this.clock); const expiresAt = utcInstant(expiry);
    if (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= this.clock().getTime()) mappingError('Carrier returned an expired quote');
    return { id: identifier(id, 'quote reference'), carrierId: this.id, productId: input.productId, premium: { amount: rialAmount(amount), currency: 'IRR', unit: 'rial' }, coverages: input.productId === 'PRD-01' ? ['synthetic-liability'] : ['synthetic-group-benefit'], expiresAt, effectiveFrom: effective.from, effectiveUntil: effective.until, mappingVersion: 'v1', synthetic: true };
  }
  protected parseJson(text: string, mutation = false): Record<string, unknown> {
    try { return record(JSON.parse(text)); } catch (error) {
      if (mutation) throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Carrier mutation response is malformed; acceptance may have occurred');
      if (error instanceof IntegrationError) throw error;
      return mappingError('Carrier returned malformed JSON');
    }
  }
  protected documentValue(data: Record<string, unknown>): PolicyDocument {
    keys(data, ['kind', 'documentRef', 'mediaType', 'sha256', 'sizeBytes', 'contentBase64']);
    if (data['kind'] !== 'document' || data['mediaType'] !== 'application/pdf' || typeof data['sizeBytes'] !== 'number' || !Number.isInteger(data['sizeBytes'])) mappingError('Invalid document metadata');
    const encoded = typeof data['contentBase64'] === 'string' && data['contentBase64'].length <= 44_000 ? data['contentBase64'] : mappingError('Invalid document encoding size');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) mappingError('Invalid base64 PDF');
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > 32_768 || bytes.length !== data['sizeBytes'] || sha256(bytes) !== data['sha256'] || !bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) mappingError('Document integrity mismatch');
    return { bytes, sha256: sha256(bytes), contentType: 'application/pdf' };
  }
}
const caps = (status: boolean, idempotency: boolean, callbacks: boolean): CarrierCapabilities => ({ quote: true, submit: true, status, retrieveDocument: true, reserve: false, issue: false, endorse: false, cancel: false, claim: false, claimPayout: false, idempotency, callbacks, schemaVersion: 'v1', supportedProducts: PRODUCTS });
class RestAdapter extends BaseAdapter {
  readonly id = 'rest' as const; readonly capabilities = caps(true, true, false);
  async quote(input: QuoteInput): Promise<CarrierQuote> {
    productCheck(input); const p = projection(input); const d = dates(input, this.clock);
    const body = JSON.stringify({ kind: 'quote_request', clientApplicationRef: input.applicationId, productCode: input.productId === 'PRD-01' ? 'SIM-MOTOR' : 'SIM-GROUP', risk: p, effectiveDate: d.from });
    const result = this.parseJson((await this.transport.request('/sim/rest/v1/quotes', 'POST', body, { 'content-type': 'application/json', 'X-Sim-Key': this.options.restKey ?? 'synthetic-rest-key-v1' }, false)).text);
    keys(result, ['kind', 'quoteRef', 'premium', 'expiresAt', 'mappingVersion']);
    if (result['kind'] !== 'quote' || result['mappingVersion'] !== 'map-v1') mappingError('Unsupported REST quote mapping');
    const money = record(result['premium']); keys(money, ['amount', 'currency', 'unit']);
    if (money['currency'] !== 'IRR' || money['unit'] !== 'rial') mappingError('Unexpected REST money unit');
    return this.quoteValue(input, string(result['quoteRef'], 'quoteRef'), money['amount'], result['expiresAt']);
  }
  async submit(purchase: CarrierPurchase, businessKey: string): Promise<SubmissionResult> {
    const body = JSON.stringify({ kind: 'submission_request', clientApplicationRef: purchase.orderId, quoteRef: purchase.quoteSnapshot.id, acceptedPremium: purchase.quoteSnapshot.premium, effectiveDate: purchase.quoteSnapshot.effectiveFrom, mappingVersion: 'map-v1' });
    const result = this.parseJson((await this.transport.request('/sim/rest/v1/submissions', 'POST', body, { 'content-type': 'application/json', 'X-Sim-Key': this.options.restKey ?? 'synthetic-rest-key-v1', 'Idempotency-Key': businessKey }, true)).text, true);
    if (result['kind'] !== 'submission_ack' || result['issuanceState'] !== 'pending' || typeof result['acknowledgedAt'] !== 'string') throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'REST acknowledgment lacks acceptance evidence');
    return { reference: acknowledgementIdentifier(result['externalRef'], 'external reference'), status: 'acknowledged' };
  }
  async status(orderId: string): Promise<StatusResult> {
    const response = await this.transport.request('/sim/rest/v1/submissions/by-client/' + encodeURIComponent(orderId), 'GET', undefined, { 'X-Sim-Key': this.options.restKey ?? 'synthetic-rest-key-v1' }, false);
    const data = this.parseJson(response.text);
    if (data['issuanceState'] === 'not_found') return { status: 'not_found', authoritative: data['authoritative'] === true };
    if (data['issuanceState'] === 'pending') { if (data['policy'] !== undefined) mappingError('Pending observation cannot contain policy evidence'); return { status: 'pending', reference: identifier(data['externalRef'], 'external reference'), authoritative: true }; }
    if (data['issuanceState'] !== 'issued') mappingError('Invalid REST issuance status');
    const policy = record(data['policy']);
    return { status: 'issued', reference: identifier(data['externalRef'], 'external reference'), policyReference: identifier(policy['policyRef'], 'policy reference'), effectiveFrom: isoDate(policy['effectiveFrom']), effectiveUntil: isoDate(policy['effectiveUntilExclusive']), documentReference: identifier(policy['documentRef'], 'document reference'), authoritative: true };
  }
  async document(reference: string): Promise<PolicyDocument> { return this.documentValue(this.parseJson((await this.transport.request('/sim/rest/v1/policies/' + encodeURIComponent(reference) + '/document', 'GET', undefined, { 'X-Sim-Key': this.options.restKey ?? 'synthetic-rest-key-v1' }, false)).text)); }
}
class SoapAdapter extends BaseAdapter {
  readonly id = 'soap' as const; readonly capabilities = caps(true, false, false);
  private async call(operation: string, fields: Record<string, string>, mutation: boolean): Promise<{ operation: string; fields: Record<string, string> }> {
    const result = await this.transport.request('/sim/soap/v1', 'POST', soapEnvelope(operation, fields), { 'content-type': 'text/xml; charset=utf-8', SOAPAction: `urn:fictional:carrier:soap:v1:${operation}`, 'X-Sim-Certificate': this.options.soapCertificateId ?? 'sim-soap-cert-v1' }, mutation);
    let data;
    try { data = parseSoap(result.text); } catch (error) { if (mutation) throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Malformed SOAP acknowledgment leaves acceptance unknown'); throw error; }
    if (data.operation === 'Reject') throw new IntegrationError(data.fields['Code'] ?? 'provider_rejected', data.fields['Accepted'] === 'false' ? 'business_rejection' : 'external_outcome_unknown', false, 'SOAP operation rejected');
    return data;
  }
  async quote(input: QuoteInput): Promise<CarrierQuote> {
    productCheck(input); const p = projection(input); const d = dates(input, this.clock);
    const request: Record<string, string> = { ClientApplicationRef: input.applicationId, SubjectRef: p.subjectRef, EffectiveGregorianDate: d.from };
    if (p.memberCount) { delete request['SubjectRef']; request['CensusRef'] = p.subjectRef; request['MemberCount'] = String(p.memberCount); }
    const data = await this.call(p.memberCount ? 'RequestGroupQuote' : 'RequestQuote', request, false);
    if (data.operation !== 'QuoteResponse') mappingError('Unexpected SOAP quote operation');
    keys(data.fields, ['QuoteRef', 'PremiumRial', 'ValidUntilUTC']);
    return this.quoteValue(input, data.fields['QuoteRef'] ?? '', data.fields['PremiumRial'], data.fields['ValidUntilUTC']);
  }
  async submit(purchase: CarrierPurchase): Promise<SubmissionResult> {
    const data = await this.call('SubmitApplication', { ClientApplicationRef: purchase.orderId, QuoteRef: purchase.quoteSnapshot.id, PremiumRial: purchase.quoteSnapshot.premium.amount, EffectiveGregorianDate: purchase.quoteSnapshot.effectiveFrom, MappingVersion: 'soap-map-v1' }, true);
    if (data.operation !== 'SubmissionAcknowledgment' || typeof data.fields['AcceptedAtUTC'] !== 'string') throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'SOAP acknowledgment does not prove acceptance');
    return { reference: acknowledgementIdentifier(data.fields['Ticket'], 'submission ticket'), status: 'acknowledged' };
  }
  async status(orderId: string): Promise<StatusResult> {
    const data = await this.call('GetSubmissionStatus', { ClientApplicationRef: orderId }, false);
    if (data.operation !== 'SubmissionStatus') mappingError('Unexpected SOAP status operation');
    const f = data.fields;
    keys(f, ['ClientApplicationRef', 'PollOrdinal', 'Status', 'Authoritative', 'Ticket', 'PolicyRef', 'EffectiveGregorianDate', 'UntilGregorianExclusive', 'DocumentRef'], ['Status', 'Authoritative']);
    if (f['Status'] === 'not_found') return { status: 'not_found', authoritative: f['Authoritative'] === 'true' };
    if (f['Status'] === 'pending') { if (['PolicyRef', 'EffectiveGregorianDate', 'DocumentRef'].some(k => f[k] !== undefined)) mappingError('Pending observation cannot contain policy evidence'); return { status: 'pending', reference: identifier(f['Ticket'], 'ticket'), authoritative: true }; }
    if (f['Status'] !== 'issued') mappingError('Unexpected SOAP issuance status');
    return { status: 'issued', reference: identifier(f['Ticket'], 'ticket'), policyReference: identifier(f['PolicyRef'], 'policy reference'), effectiveFrom: isoDate(f['EffectiveGregorianDate']), effectiveUntil: isoDate(f['UntilGregorianExclusive']), documentReference: identifier(f['DocumentRef'], 'document reference'), authoritative: true };
  }
  async document(reference: string): Promise<PolicyDocument> {
    const data = await this.call('GetPolicyDocument', { PolicyRef: reference }, false);
    if (data.operation !== 'PolicyDocument') mappingError('Unexpected SOAP document operation');
    return this.documentValue({ kind: 'document', documentRef: data.fields['DocumentRef'], mediaType: data.fields['MediaType'], sha256: data.fields['SHA256'], sizeBytes: Buffer.from(data.fields['ContentBase64'] ?? '', 'base64').length, contentBase64: data.fields['ContentBase64'] });
  }
}
class SignedAdapter extends BaseAdapter {
  readonly id = 'signed' as const; readonly capabilities = caps(false, false, true);
  private headers(method: string, path: string, body: string): Record<string, string> { return { 'content-type': 'application/json', ...signedHeaders(method, path, body, this.options.signingSecret ?? SYNTHETIC_SIGNING_KEY, this.clock) }; }
  async quote(input: QuoteInput): Promise<CarrierQuote> {
    productCheck(input); const p = projection(input); const d = dates(input, this.clock); const path = '/sim/signed/v1/quotes';
    const body = JSON.stringify({ client_ref: input.applicationId, product_code: input.productId === 'PRD-01' ? 'SIM-MOTOR' : 'SIM-GROUP', subject_ref: p.subjectRef, ...(p.memberCount ? { member_count: p.memberCount } : {}), effective_jalali: persianDate(d.from), calendar: 'persian' });
    const data = this.parseJson((await this.transport.request(path, 'POST', body, this.headers('POST', path, body), false)).text);
    keys(data, ['quote_ref', 'premium_toman', 'valid_until_utc', 'mapping_version']);
    if (data['mapping_version'] !== 'signed-map-v1') mappingError('Unsupported signed mapping version');
    return this.quoteValue(input, string(data['quote_ref'], 'quote reference'), (BigInt(rialAmount(data['premium_toman'])) * 10n).toString(), data['valid_until_utc']);
  }
  async submit(purchase: CarrierPurchase): Promise<SubmissionResult> {
    const path = '/sim/signed/v1/submissions';
    const body = JSON.stringify({ client_ref: purchase.orderId, quote_ref: purchase.quoteSnapshot.id, premium_toman: rialToToman(purchase.quoteSnapshot.premium.amount), effective_jalali: persianDate(purchase.quoteSnapshot.effectiveFrom), calendar: 'persian', mapping_version: 'signed-map-v1' });
    const data = this.parseJson((await this.transport.request(path, 'POST', body, this.headers('POST', path, body), true)).text, true);
    if (data['result'] !== 'accepted' || data['issuance'] !== 'pending' || data['receipt_ref'] === undefined) throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Signed acknowledgment does not prove acceptance');
    return { reference: acknowledgementIdentifier(data['receipt_ref'], 'receipt reference'), status: 'acknowledged' };
  }
  async status(): Promise<StatusResult> { throw new IntegrationError('capability_unsupported', 'capability_unsupported', false, 'Fictional signed carrier has no authoritative status lookup'); }
  async document(reference: string): Promise<PolicyDocument> {
    const path = '/sim/signed/v1/policies/' + encodeURIComponent(reference) + '/document';
    return this.documentValue(this.parseJson((await this.transport.request(path, 'GET', undefined, this.headers('GET', path, ''), false)).text));
  }
}
export class CarrierGateway {
  private readonly adapters: Record<CarrierId, CarrierAdapter>;
  private readonly permits: Record<CarrierId, Semaphore>;
  private readonly nonces = new Map<string, number>();
  private readonly tenantPermits = new Map<string, Semaphore>();
  constructor(private readonly options: GatewayOptions) {
    if (!Number.isInteger(options.perProviderConcurrency ?? 4) || (options.perProviderConcurrency ?? 4) < 1 || (options.perProviderConcurrency ?? 4) > 16) mappingError('Provider concurrency must be 1..16');
    if (!Number.isInteger(options.timeoutMs ?? 3_000) || (options.timeoutMs ?? 3_000) < 100 || (options.timeoutMs ?? 3_000) > 10_000) mappingError('Provider timeout must be 100..10000ms');
    const transport = new Transport(options);
    this.adapters = { rest: new RestAdapter(transport, options), soap: new SoapAdapter(transport, options), signed: new SignedAdapter(transport, options) };
    this.permits = { rest: new Semaphore(options.perProviderConcurrency ?? 4), soap: new Semaphore(options.perProviderConcurrency ?? 4), signed: new Semaphore(options.perProviderConcurrency ?? 4) };
  }
  getAdapter(id: CarrierId): CarrierAdapter { const adapter = this.adapters[id]; if (!adapter) throw new IntegrationError('carrier_unsupported', 'capability_unsupported', false, 'Unknown carrier'); return adapter; }
  capabilities(): Array<{ id: CarrierId; capabilities: CarrierCapabilities }> { return Object.values(this.adapters).map(a => ({ id: a.id, capabilities: a.capabilities })); }
  private async withinTenant<T>(id: CarrierId, tenantId: string, fn: () => Promise<T>): Promise<T> {
    this.getAdapter(id); const key = `${id}:${tenantId}`; let tenant = this.tenantPermits.get(key);
    if (!tenant) { tenant = new Semaphore(2); this.tenantPermits.set(key, tenant); }
    try { return await tenant.run(() => this.permits[id].run(fn)); }
    finally { if (tenant.idle()) this.tenantPermits.delete(key); }
  }
  quote(id: CarrierId, input: QuoteInput): Promise<CarrierQuote> { const adapter = this.getAdapter(id); return this.withinTenant(id, input.tenantId, () => adapter.quote(input)); }
  async quoteAll(input: QuoteInput, ids: CarrierId[] = ['rest', 'soap', 'signed']): Promise<{ quotes: CarrierQuote[]; failures: Array<{ carrierId: CarrierId; code: string; retriable: boolean }> }> {
    if (ids.length > 3 || new Set(ids).size !== ids.length) mappingError('Carrier fan-out is bounded and duplicate-free');
    const outcomes = await Promise.all(ids.map(async carrierId => { try { return { carrierId, quote: await this.quote(carrierId, input) }; } catch (error) { return { carrierId, error: error instanceof IntegrationError ? error : new IntegrationError('provider_unavailable', 'transient', true, 'Carrier unavailable') }; } }));
    return { quotes: outcomes.flatMap(v => 'quote' in v && v.quote ? [v.quote] : []), failures: outcomes.flatMap(v => 'error' in v && v.error ? [{ carrierId: v.carrierId, code: v.error.code, retriable: v.error.retriable }] : []) };
  }
  submit(purchase: CarrierPurchase, key: string): Promise<SubmissionResult> { const adapter = this.getAdapter(purchase.carrierId); return this.withinTenant(purchase.carrierId, purchase.tenantId, () => adapter.submit(purchase, key)); }
  status(id: CarrierId, orderId: string, reference?: string): Promise<StatusResult> { const adapter = this.getAdapter(id); return this.permits[id].run(() => adapter.status(orderId, reference)); }
  document(id: CarrierId, reference: string): Promise<PolicyDocument> { const adapter = this.getAdapter(id); return this.permits[id].run(() => adapter.document(reference)); }
  verifyCallback(raw: string, headers: Record<string, string | undefined>, path = '/callbacks/sim-signed'): VerifiedCallback {
    if (Buffer.byteLength(raw) > 32_768) mappingError('Callback body too large');
    verifySignedBytes('POST', path, raw, headers, this.options.signingSecret ?? SYNTHETIC_SIGNING_KEY, this.options.clock ?? (() => new Date()), this.nonces);
    let data: Record<string, unknown>;
    try { data = record(JSON.parse(raw)); } catch { return mappingError('Invalid callback JSON'); }
    keys(data, ['event_id', 'sequence', 'client_ref', 'receipt_ref', 'issuance', 'occurred_at', 'policy_ref', 'effective_jalali', 'until_jalali_exclusive', 'calendar', 'document_ref'], ['event_id', 'sequence', 'client_ref', 'receipt_ref', 'issuance', 'occurred_at']);
    const status = data['issuance'];
    utcInstant(data['occurred_at']);
    if ((status !== 'pending' && status !== 'issued') || !Number.isInteger(data['sequence']) || Number(data['sequence']) < 1 || Number(data['sequence']) > 2147483647) mappingError('Invalid callback status or sequence');
    const result: VerifiedCallback = { eventId: identifier(data['event_id'], 'eventId'), orderId: identifier(data['client_ref'], 'orderId'), reference: identifier(data['receipt_ref'], 'receipt'), sequence: Number(data['sequence']), status: status === 'issued' ? 'issued' : 'pending' };
    if (status === 'issued') {
      if (data['calendar'] !== 'persian') mappingError('Callback calendar must be explicit Persian');
      result.policyReference = identifier(data['policy_ref'], 'policy reference'); result.documentReference = identifier(data['document_ref'], 'document reference');
      result.effectiveFrom = gregorianDate(string(data['effective_jalali'], 'effective date')); result.effectiveUntil = gregorianDate(string(data['until_jalali_exclusive'], 'end date'));
    } else if (['policy_ref', 'effective_jalali', 'document_ref'].some(k => Object.hasOwn(data, k))) mappingError('Pending callback cannot assert issued policy fields');
    return result;
  }
}
export const createCarrierRegistry = (options: GatewayOptions): CarrierGateway => new CarrierGateway(options);
