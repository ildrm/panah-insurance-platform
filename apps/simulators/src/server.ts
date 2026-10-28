import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CarrierId, CarrierScenario, IntegrationError, gregorianDate, parseSoap, persianDate, sha256, signedHeaders, soapEnvelope, SYNTHETIC_SIGNING_KEY, validateSandboxBaseUrl, verifySignedBytes } from '@st/integrations';

interface Submission {
  orderId: string; reference: string; policyReference: string; effectiveFrom: string; effectiveUntil: string;
  polls: number; duplicate: boolean; quoteRef: string; scenario: CarrierScenario;
}
interface Quote { id: string; amount: string; from: string; until: string; }
interface CarrierState { submissions: Map<string, Submission>; quotes: Map<string, Quote>; idempotency: Map<string, { digest: string; reference: string }>; scenario: CarrierScenario; counts: Record<string, number>; nonceStore: Map<string, number>; }
export interface SimulatorOptions { clock?: () => Date; signingSecret?: string; callbackUrl?: string; documentBytes?: Buffer; }
export interface RunningSimulator { server: Server; url: string; close(): Promise<void>; state(id: CarrierId): { submissions: number; submitCalls: number }; }
const carriers: CarrierId[] = ['rest', 'soap', 'signed'];
const scenarios: CarrierScenario[] = ['normal', 'timeout_after_acceptance', 'malformed_response', 'throttled', 'expired_token', 'partial_outage', 'document_outage', 'callback_before_ack', 'mapping_version_change', 'definitive_reject', 'duplicate_callback', 'out_of_order_callback', 'idempotency_not_supported'];
const object = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object_required'); return value as Record<string, unknown>; };
const text = (value: unknown): string => { if (typeof value !== 'string' || !value || value.length > 256) throw new Error('invalid_string'); return value; };
function exactKeys(data: Record<string, unknown>, allowed: string[], required = allowed): void { if (Object.keys(data).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(data, k))) throw new Error('invalid_fields'); }
const id = (value: unknown): string => { const s = text(value); if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new Error('invalid_id'); return s; };
const json = (response: ServerResponse, status: number, body: unknown): void => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(body)); };
const xml = (response: ServerResponse, body: string): void => { response.writeHead(200, { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' }); response.end(body); };
const reject = (response: ServerResponse, status: number, code: string): void => json(response, status, { kind: 'rejection', accepted: false, code });
async function requestBody(request: IncomingMessage): Promise<string> { const chunks: Buffer[] = []; let size = 0; for await (const value of request) { const b = Buffer.isBuffer(value) ? value : Buffer.from(value); size += b.length; if (size > 32_768) throw new Error('body_too_large'); chunks.push(b); } return Buffer.concat(chunks).toString('utf8'); }
function date(value: unknown): string { const v = text(value); if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) !== v) throw new Error('invalid_date'); return v; }
function makeState(): CarrierState { return { submissions: new Map(), quotes: new Map(), idempotency: new Map(), scenario: 'normal', counts: {}, nonceStore: new Map() }; }

export async function createSimulatorServer(options: SimulatorOptions = {}, port = 0, host: '127.0.0.1' | '0.0.0.0' = '127.0.0.1'): Promise<RunningSimulator> {
  const clock = options.clock ?? (() => new Date()); const secret = options.signingSecret ?? SYNTHETIC_SIGNING_KEY;
  const pdf = options.documentBytes ?? await readFile(join(__dirname, '../fixtures/policy.pdf'));
  const states: Record<CarrierId, CarrierState> = { rest: makeState(), soap: makeState(), signed: makeState() };
  const document = (reference: string): Record<string, unknown> => ({ kind: 'document', documentRef: 'SIM-DOC-' + reference, mediaType: 'application/pdf', sha256: sha256(pdf), sizeBytes: pdf.length, contentBase64: pdf.toString('base64') });
  const signatureHeaders = (request: IncomingMessage): Record<string, string | undefined> => Object.fromEntries(Object.entries(request.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  async function deliverSigned(s: Submission): Promise<void> {
    if (!options.callbackUrl || s.scenario === 'timeout_after_acceptance') return;
    const url = new URL(options.callbackUrl);
    validateSandboxBaseUrl(url.origin);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/callbacks/sim-signed') throw new Error('callback_destination_denied');
    const make = (status: 'pending' | 'issued', sequence: number): string => JSON.stringify({ event_id: `${s.reference}-E-${sequence}`, sequence, client_ref: s.orderId, receipt_ref: s.reference, issuance: status, occurred_at: clock().toISOString(), ...(status === 'issued' ? { policy_ref: s.policyReference, effective_jalali: persianDate(s.effectiveFrom), until_jalali_exclusive: persianDate(s.effectiveUntil), calendar: 'persian', document_ref: `SIM-DOC-${s.policyReference}` } : {}) });
    const sequence: Array<['pending' | 'issued', number]> = s.scenario === 'out_of_order_callback' ? [['issued', 2], ['pending', 1]] : [['pending', 1], ['issued', 2]];
    if (s.scenario === 'duplicate_callback') sequence.push(['issued', 2]);
    for (const [status, n] of sequence) {
      const body = make(status, n);
      const response = await fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/json', ...signedHeaders('POST', url.pathname, body, secret, clock) }, redirect: 'error', signal: AbortSignal.timeout(3_000) });
      if (!response.ok) throw new Error('callback_not_acknowledged');
    }
  }
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (url.search || url.hash) return reject(response, 400, 'query_not_supported');
      if (request.method === 'GET' && url.pathname === '/health') return json(response, 200, { status: 'ok', mode: 'fictional-sandbox' });
      const harness = /^\/_test\/carriers\/(rest|soap|signed)\/(reset|state|fault)$/.exec(url.pathname);
      if (harness) {
        const carrier = harness[1] as CarrierId;
        if (request.method === 'GET' && harness[2] === 'state') return json(response, 200, { submissions: states[carrier].submissions.size, counts: states[carrier].counts });
        if (request.method !== 'POST' || !['reset', 'fault'].includes(harness[2] ?? '')) return reject(response, 405, 'method_not_allowed');
        const body = object(JSON.parse(await requestBody(request))); exactKeys(body, ['scenario']);
        if (!scenarios.includes(body['scenario'] as CarrierScenario)) return reject(response, 422, 'scenario_invalid');
        if (harness[2] === 'reset') states[carrier] = makeState(); states[carrier].scenario = body['scenario'] as CarrierScenario;
        return json(response, 200, { reset: true, carrier, scenario: body['scenario'] });
      }
      const match = /^\/sim\/(rest|soap|signed)\/v1(?:\/(.*))?$/.exec(url.pathname);
      if (!match) return reject(response, 404, 'not_found');
      const carrier = match[1] as CarrierId; const state = states[carrier]; const route = match[2] ?? ''; const raw = await requestBody(request);
      state.counts[`${request.method} ${route}`] = (state.counts[`${request.method} ${route}`] ?? 0) + 1;
      if (state.scenario === 'expired_token') return reject(response, 401, 'expired_token');
      if (carrier === 'rest' && request.headers['x-sim-key'] !== 'synthetic-rest-key-v1') return reject(response, 401, 'invalid_key');
      if (carrier === 'soap' && request.headers['x-sim-certificate'] !== 'sim-soap-cert-v1') return reject(response, 401, 'invalid_certificate');
      if (carrier === 'signed') verifySignedBytes(request.method ?? 'GET', url.pathname, raw, signatureHeaders(request), secret, clock, state.nonceStore);
      let action = route; let fields: Record<string, unknown> = {};
      if (carrier === 'soap') {
        if (route || request.method !== 'POST') return reject(response, 405, 'method_not_allowed');
        const payload = parseSoap(raw); action = payload.operation; fields = payload.fields;
        if (request.headers['soapaction'] !== 'urn:fictional:carrier:soap:v1:' + action) return reject(response, 400, 'soap_action_invalid');
      } else if (raw) fields = object(JSON.parse(raw));
      const isQuote = action === 'quotes' || action === 'RequestQuote' || action === 'RequestGroupQuote';
      const isSubmit = action === 'submissions' || action === 'SubmitApplication';
      const countKey = `${isQuote ? 'quote' : isSubmit ? 'submit' : 'read'}`;
      state.counts[countKey] = (state.counts[countKey] ?? 0) + 1;
      if (state.scenario === 'throttled' && state.counts[countKey] === 1) { response.setHeader('Retry-After', '1'); return reject(response, 429, 'throttled'); }
      if (state.scenario === 'partial_outage' && isQuote) return reject(response, 503, 'quote_unavailable');
      if (isQuote) {
        if (request.method !== 'POST') return reject(response, 405, 'method_not_allowed');
        let client: string; let from: string; let members = 1;
        if (carrier === 'rest') {
          exactKeys(fields, ['kind', 'clientApplicationRef', 'productCode', 'risk', 'effectiveDate']);
          if (fields['kind'] !== 'quote_request' || !['SIM-MOTOR', 'SIM-GROUP'].includes(text(fields['productCode']))) return reject(response, 422, 'product_unsupported');
          client = id(fields['clientApplicationRef']); from = date(fields['effectiveDate']); const risk = object(fields['risk']);
          if (fields['productCode'] === 'SIM-MOTOR') { exactKeys(risk, ['subjectRef', 'manufactureYear']); id(risk['subjectRef']); const year = Number(risk['manufactureYear']); if (!Number.isInteger(year) || year < 2000 || year > 2030) throw new Error('invalid_year'); }
          else { exactKeys(risk, ['subjectRef', 'memberCount']); id(risk['subjectRef']); members = Number(risk['memberCount']); }
        } else if (carrier === 'soap') {
          client = id(fields['ClientApplicationRef']); from = date(fields['EffectiveGregorianDate']);
          if (action === 'RequestGroupQuote') { exactKeys(fields, ['ClientApplicationRef', 'CensusRef', 'MemberCount', 'EffectiveGregorianDate']); id(fields['CensusRef']); members = Number(fields['MemberCount']); }
          else { exactKeys(fields, ['ClientApplicationRef', 'SubjectRef', 'EffectiveGregorianDate']); id(fields['SubjectRef']); }
        } else {
          exactKeys(fields, ['client_ref', 'product_code', 'subject_ref', 'member_count', 'effective_jalali', 'calendar'], ['client_ref', 'product_code', 'subject_ref', 'effective_jalali', 'calendar']);
          if (fields['calendar'] !== 'persian' || !['SIM-MOTOR', 'SIM-GROUP'].includes(text(fields['product_code']))) return reject(response, 422, 'mapping_invalid');
          client = id(fields['client_ref']); id(fields['subject_ref']); from = gregorianDate(text(fields['effective_jalali'])); members = Number(fields['member_count'] ?? 1);
        }
        if (!Number.isInteger(members) || members < 1 || members > 20_000) return reject(response, 422, 'invalid_member_count');
        const quote: Quote = { id: `SIM-${carrier.toUpperCase()}-Q-${randomUUID()}`, amount: (BigInt(members) * BigInt(carrier === 'rest' ? 120_000 : carrier === 'soap' ? 130_000 : 140_000)).toString(), from, until: new Date(Date.parse(from + 'T12:00:00Z') + 365 * 86_400_000).toISOString().slice(0, 10) };
        state.quotes.set(quote.id, quote);
        const expiry = new Date(clock().getTime() + 10 * 60_000).toISOString();
        if (carrier === 'soap') {
          const payload = soapEnvelope('QuoteResponse', { QuoteRef: quote.id, PremiumRial: state.scenario === 'malformed_response' ? 'NaN' : quote.amount, ValidUntilUTC: expiry });
          return xml(response, state.scenario === 'mapping_version_change' ? payload.replaceAll('urn:fictional:carrier:soap:v1', 'urn:fictional:carrier:soap:v2') : payload);
        }
        if (carrier === 'signed') return json(response, 200, { quote_ref: quote.id, premium_toman: state.scenario === 'malformed_response' ? 'NaN' : (BigInt(quote.amount) / 10n).toString(), valid_until_utc: expiry, mapping_version: state.scenario === 'mapping_version_change' ? 'signed-map-v2' : 'signed-map-v1' });
        return json(response, 200, { kind: 'quote', quoteRef: quote.id, premium: { amount: state.scenario === 'malformed_response' ? 'NaN' : quote.amount, currency: 'IRR', unit: 'rial' }, expiresAt: expiry, mappingVersion: state.scenario === 'mapping_version_change' ? 'map-v2' : 'map-v1' });
      }
      if (isSubmit) {
        if (request.method !== 'POST') return reject(response, 405, 'method_not_allowed');
        if (state.scenario === 'definitive_reject') { if (carrier === 'soap') return xml(response, soapEnvelope('Reject', { Code: 'risk_declined', Accepted: 'false' })); return reject(response, 422, 'risk_declined'); }
        const client = id(fields[carrier === 'rest' ? 'clientApplicationRef' : carrier === 'soap' ? 'ClientApplicationRef' : 'client_ref']);
        const quoteRef = id(fields[carrier === 'rest' ? 'quoteRef' : carrier === 'soap' ? 'QuoteRef' : 'quote_ref']);
        const quote = state.quotes.get(quoteRef); if (!quote) return reject(response, 422, 'quote_missing');
        const amount = carrier === 'rest' ? object(fields['acceptedPremium'])['amount'] : carrier === 'soap' ? fields['PremiumRial'] : (BigInt(text(fields['premium_toman'])) * 10n).toString();
        if (amount !== quote.amount) return reject(response, 422, 'amount_mismatch');
        const businessKey = request.headers['idempotency-key']; const digest = sha256(raw);
        if (carrier === 'rest' && state.scenario !== 'idempotency_not_supported') {
          if (typeof businessKey !== 'string' || businessKey.length < 16 || businessKey.length > 128) return reject(response, 422, 'idempotency_required');
          const prior = state.idempotency.get(businessKey);
          if (prior) { if (prior.digest !== digest) return reject(response, 409, 'idempotency_conflict'); return json(response, 202, { kind: 'submission_ack', externalRef: prior.reference, acknowledgedAt: clock().toISOString(), issuanceState: 'pending' }); }
        }
        const ref = `SIM-${carrier.toUpperCase()}-S-${randomUUID()}`;
        const submission: Submission = { orderId: client, reference: ref, policyReference: `SIM-${carrier.toUpperCase()}-P-${randomUUID()}`, effectiveFrom: quote.from, effectiveUntil: quote.until, polls: 0, duplicate: state.submissions.has(client), quoteRef, scenario: state.scenario };
        if (state.submissions.has(client)) { const prior = state.submissions.get(client); if (prior) prior.duplicate = true; }
        else state.submissions.set(client, submission);
        if (carrier === 'rest' && typeof businessKey === 'string') state.idempotency.set(businessKey, { digest, reference: ref });
        if (state.scenario === 'timeout_after_acceptance') { request.socket.destroy(); return; }
        if (carrier === 'signed') {
          if (state.scenario === 'malformed_response') return json(response, 202, { accepted: true });
          if (state.scenario === 'callback_before_ack') { await deliverSigned(submission); return json(response, 202, { receipt_ref: ref, result: 'accepted', issuance: 'pending' }); }
          json(response, 202, { receipt_ref: ref, result: 'accepted', issuance: 'pending' });
          setTimeout(() => { void deliverSigned(submission).catch(() => { state.counts['callback_failed'] = (state.counts['callback_failed'] ?? 0) + 1; }); }, 100);
          return;
        }
        if (carrier === 'soap') return xml(response, soapEnvelope('SubmissionAcknowledgment', { Ticket: ref, AcceptedAtUTC: clock().toISOString() }));
        return json(response, 202, { kind: 'submission_ack', externalRef: ref, acknowledgedAt: clock().toISOString(), issuanceState: 'pending' });
      }
      if (carrier === 'soap' && action === 'GetSubmissionStatus' || carrier === 'rest' && route.startsWith('submissions/by-client/')) {
        const client = carrier === 'soap' ? id(fields['ClientApplicationRef']) : id(route.slice('submissions/by-client/'.length));
        const s = state.submissions.get(client);
        if (!s) { if (carrier === 'soap') return xml(response, soapEnvelope('SubmissionStatus', { Status: 'not_found', Authoritative: 'true' })); return json(response, 404, { issuanceState: 'not_found', authoritative: true }); }
        if (s.duplicate) { if (carrier === 'soap') return xml(response, soapEnvelope('Reject', { Code: 'duplicate_reference', Accepted: 'true' })); return reject(response, 409, 'duplicate_reference'); }
        s.polls++;
        if (carrier === 'soap' && s.polls === 1) return xml(response, soapEnvelope('SubmissionStatus', { Status: 'not_found', Authoritative: 'false' }));
        const issued = s.polls >= (carrier === 'soap' ? 3 : 2);
        if (carrier === 'soap') return xml(response, soapEnvelope('SubmissionStatus', { ClientApplicationRef: client, PollOrdinal: String(s.polls), Status: issued ? 'issued' : 'pending', Authoritative: 'true', Ticket: s.reference, ...(issued ? { PolicyRef: s.policyReference, EffectiveGregorianDate: s.effectiveFrom, UntilGregorianExclusive: s.effectiveUntil, DocumentRef: `SIM-DOC-${s.policyReference}` } : {}) }));
        return json(response, 200, { kind: 'status', clientApplicationRef: client, externalRef: s.reference, submissionState: 'acknowledged', issuanceState: issued ? 'issued' : 'pending', observedAt: clock().toISOString(), ...(issued ? { policy: { policyRef: s.policyReference, effectiveFrom: s.effectiveFrom, effectiveUntilExclusive: s.effectiveUntil, documentRef: `SIM-DOC-${s.policyReference}` } } : {}) });
      }
      if (carrier === 'signed' && route.startsWith('submissions/')) return reject(response, 405, 'capability_unsupported');
      if (carrier === 'soap' && action === 'GetPolicyDocument' || route.startsWith('policies/') && route.endsWith('/document')) {
        if (state.scenario === 'document_outage') return reject(response, 503, 'document_unavailable');
        const policy = carrier === 'soap' ? id(fields['PolicyRef']) : id(route.slice('policies/'.length, -'/document'.length));
        const s = [...state.submissions.values()].find(v => v.policyReference === policy);
        if (!s || carrier !== 'signed' && s.polls < (carrier === 'soap' ? 3 : 2)) return reject(response, 409, 'policy_not_issued');
        if (carrier === 'soap') return xml(response, soapEnvelope('PolicyDocument', { DocumentRef: `SIM-DOC-${policy}`, MediaType: 'application/pdf', SHA256: sha256(pdf), ContentBase64: pdf.toString('base64') }));
        return json(response, 200, document(policy));
      }
      return reject(response, 404, 'operation_not_found');
    } catch (error) {
      if (response.headersSent || response.destroyed) return;
      return reject(response, error instanceof IntegrationError && error.kind === 'authentication' ? 401 : 422, error instanceof IntegrationError ? error.code : 'invalid_payload');
    }
  });
  await new Promise<void>((resolve, rejectListen) => { server.once('error', rejectListen); server.listen(port, host, resolve); });
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('simulator_address_missing');
  return { server, url: `http://127.0.0.1:${address.port}`, close: () => new Promise<void>((resolve, rejectClose) => { server.closeAllConnections(); server.close(error => error ? rejectClose(error) : resolve()); }), state: carrier => ({ submissions: states[carrier].submissions.size, submitCalls: states[carrier].counts['submit'] ?? 0 }) };
}
