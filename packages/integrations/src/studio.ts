import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Actor, assertUuid, authorize, DomainError, requireObject, text } from '@st/contracts';
import type { Database, QueryResultRow, SqlClient } from '@st/database';
import { CarrierId, CarrierPurchase, CarrierQuote, GatewayOptions, IntegrationError, QuoteInput, SubmissionResult } from './contracts.js';
import { CarrierGateway, createCarrierRegistry } from './gateway.js';
import { persianDate, rialToToman, sha256, validateSandboxBaseUrl } from './security.js';

type MappingTransform = 'identity' | 'rial_to_toman' | 'gregorian_to_persian';
interface MappingField { from: string; to: string; transform: MappingTransform; }
export interface PartnerMapping { version: 'map-v1' | 'soap-map-v1' | 'signed-map-v1'; fields: MappingField[]; }
export interface ConnectionConfig { baseUrl: string; secretRef: string; products: string[]; channels: string[]; capabilities: string[]; mapping: PartnerMapping; }
interface ConnectionRow extends QueryResultRow { id: string; carrier_id: CarrierId; environment: 'sandbox'; version: number; revision: number; state: string; config: ConnectionConfig; maker_id: string; checker_id: string | null; validation_evidence: Record<string, unknown> | null; created_at: Date; updated_at: Date; }
export interface ConnectionView { id: string; carrierId: CarrierId; environment: 'sandbox'; version: number; revision: number; state: string; config: ConnectionConfig; makerId: string; checkerId: string | null; validationEvidence: Record<string, unknown> | null; createdAt: Date; updatedAt: Date; }
const view = (r: ConnectionRow): ConnectionView => ({ id: r.id, carrierId: r.carrier_id, environment: r.environment, version: r.version, revision: r.revision, state: r.state, config: r.config, makerId: r.maker_id, checkerId: r.checker_id, validationEvidence: r.validation_evidence, createdAt: r.created_at, updatedAt: r.updated_at });
const IDS: CarrierId[] = ['rest', 'soap', 'signed'];
const SOURCES = ['orderId', 'productId', 'premium.amount', 'effectiveFrom', 'effectiveUntil', 'risk.subjectRef', 'risk.memberCount'];
const TARGETS: Record<CarrierId, string[]> = { rest: ['clientApplicationRef', 'productCode', 'acceptedPremium.amount', 'effectiveDate', 'risk.subjectRef', 'risk.memberCount'], soap: ['ClientApplicationRef', 'PremiumRial', 'EffectiveGregorianDate', 'CensusRef', 'MemberCount'], signed: ['client_ref', 'product_code', 'premium_toman', 'effective_jalali', 'subject_ref', 'member_count'] };
function platform(actor: Actor, permission: string): void { authorize(actor, permission); if (actor.contextKind !== 'platform') throw new DomainError('forbidden_action', 403, 'Integration administration requires the platform context.'); }
function exact(data: Record<string, unknown>, keys: string[]): void { if (Object.keys(data).some(k => !keys.includes(k))) throw new DomainError('validation_failed', 422, 'Unknown configuration properties are rejected.'); }
function strings(data: Record<string, unknown>, key: string, allowed: readonly string[], max = 24): string[] { const values = data[key]; if (!Array.isArray(values) || values.length === 0 || values.length > max || values.some(v => typeof v !== 'string' || !allowed.includes(v)) || new Set(values).size !== values.length) throw new DomainError('validation_failed', 422, `Invalid ${key}.`); return values as string[]; }
function positiveVersion(v: unknown): number { if (!Number.isInteger(v) || Number(v) < 1 || Number(v) > 2147483647) throw new DomainError('validation_failed', 422, 'Expected a positive version.'); return Number(v); }
export function defaultPartnerMapping(carrierId: CarrierId): PartnerMapping {
  return { version: carrierId === 'rest' ? 'map-v1' : carrierId === 'soap' ? 'soap-map-v1' : 'signed-map-v1', fields: [
    { from: 'orderId', to: carrierId === 'rest' ? 'clientApplicationRef' : carrierId === 'soap' ? 'ClientApplicationRef' : 'client_ref', transform: 'identity' },
    { from: 'premium.amount', to: carrierId === 'rest' ? 'acceptedPremium.amount' : carrierId === 'soap' ? 'PremiumRial' : 'premium_toman', transform: carrierId === 'signed' ? 'rial_to_toman' : 'identity' },
    { from: 'effectiveFrom', to: carrierId === 'rest' ? 'effectiveDate' : carrierId === 'soap' ? 'EffectiveGregorianDate' : 'effective_jalali', transform: carrierId === 'signed' ? 'gregorian_to_persian' : 'identity' }
  ] };
}
function validateMapping(carrierId: CarrierId, value: unknown): PartnerMapping {
  const mapping = requireObject(value); exact(mapping, ['version', 'fields']);
  if (mapping['version'] !== defaultPartnerMapping(carrierId).version || !Array.isArray(mapping['fields']) || mapping['fields'].length < 3 || mapping['fields'].length > 20) throw new DomainError('mapping_unsupported', 422, 'Only the reviewed native mapping version is executable.');
  const fields: MappingField[] = mapping['fields'].map(raw => { const field = requireObject(raw); exact(field, ['from', 'to', 'transform']); const from = text(field, 'from', 80); const to = text(field, 'to', 80); const transform = text(field, 'transform', 40); if (!SOURCES.includes(from) || !TARGETS[carrierId].includes(to) || !['identity', 'rial_to_toman', 'gregorian_to_persian'].includes(transform)) throw new DomainError('mapping_unsafe', 422, 'Mapping expressions and unapproved fields are not executable.'); return { from, to, transform: transform as MappingTransform }; });
  if (new Set(fields.map(f => f.to)).size !== fields.length) throw new DomainError('mapping_conflict', 422, 'Multiple mappings cannot write the same field.');
  for (const essential of defaultPartnerMapping(carrierId).fields) if (!fields.some(f => f.from === essential.from && f.to === essential.to && f.transform === essential.transform)) throw new DomainError('mapping_incomplete', 422, 'Required money/date/identity transformations cannot be removed.');
  return { version: mapping['version'] as PartnerMapping['version'], fields };
}
export function applyPartnerMapping(mapping: PartnerMapping, input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of mapping.fields) {
    if (!SOURCES.includes(field.from) || !Object.values(TARGETS).some(values => values.includes(field.to)) || !['identity', 'rial_to_toman', 'gregorian_to_persian'].includes(field.transform)) throw new DomainError('mapping_unsafe', 422, 'Mapping contains unapproved paths or transforms.');
    let value: unknown = input;
    for (const part of field.from.split('.')) value = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>)[part] : undefined;
    if (value === undefined) continue;
    if (field.transform !== 'identity' && typeof value !== 'string') throw new DomainError('mapping_invalid_value', 422, 'Typed transforms require an exact string value.');
    if (field.transform === 'rial_to_toman') value = rialToToman(value as string);
    if (field.transform === 'gregorian_to_persian') value = persianDate(value as string);
    let destination = result; const path = field.to.split('.');
    for (const part of path.slice(0, -1)) { const existing = destination[part]; if (existing === undefined) destination[part] = {}; const next = destination[part]; if (!next || typeof next !== 'object' || Array.isArray(next)) throw new DomainError('mapping_conflict', 422, 'Mapping destination collision.'); destination = next as Record<string, unknown>; }
    const last = path.at(-1); if (!last || last === '__proto__' || last === 'constructor') throw new DomainError('mapping_unsafe', 422, 'Unsafe destination.'); destination[last] = value;
  }
  return result;
}
export async function migrateIntegrations(db: Database): Promise<void> { await db.query(await readFile(resolve(__dirname, '../migrations/002-studio.sql'), 'utf8')); }

export class StudioService {
  private readonly gateways = new Map<string, CarrierGateway>();
  constructor(private readonly db: Database, private readonly options: Omit<GatewayOptions, 'baseUrl' | 'mode'> = {}) {}
  async list(actor: Actor, limit = 50): Promise<ConnectionView[]> { platform(actor, 'integrations.read'); if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new DomainError('validation_failed', 422, 'Limit must be 1..100.'); return (await this.db.query<ConnectionRow>('SELECT * FROM partner_connection_versions ORDER BY carrier_id,version DESC LIMIT $1', [limit])).rows.map(view); }
  async get(actor: Actor, id: string): Promise<ConnectionView> { platform(actor, 'integrations.read'); return view(await this.row(id)); }
  async propose(actor: Actor, raw: unknown): Promise<ConnectionView> {
    platform(actor, 'integrations.configure'); const input = requireObject(raw); exact(input, ['carrierId', 'environment', 'baseUrl', 'secretRef', 'products', 'channels', 'capabilities', 'mapping', 'reason']);
    const carrierId = text(input, 'carrierId') as CarrierId; if (!IDS.includes(carrierId)) throw new DomainError('carrier_unsupported', 422, 'Carrier adapter is not installed.');
    if (input['environment'] !== 'sandbox') throw new DomainError('live_connector_disabled', 409, 'Live contracts, credentials and certification are absent.');
    let baseUrl: string;
    try { baseUrl = validateSandboxBaseUrl(text(input, 'baseUrl', 200)).origin; } catch { throw new DomainError('destination_denied', 422, 'Sandbox connections require an approved loopback HTTP origin.'); }
    const secretRef = text(input, 'secretRef', 120); if (!/^secret:\/\/sandbox\/[a-z0-9/_-]{3,100}$/.test(secretRef)) throw new DomainError('secret_reference_required', 422, 'Use a sandbox secret reference, never raw credentials.');
    const config: ConnectionConfig = { baseUrl, secretRef, products: strings(input, 'products', ['PRD-01', 'PRD-07', 'PRD-24']), channels: strings(input, 'channels', ['b2c', 'corporate', 'commercial', 'reseller', 'b2b2c'], 5), capabilities: strings(input, 'capabilities', carrierId === 'signed' ? ['quote', 'submit', 'retrieve_document', 'callback'] : ['quote', 'submit', 'status', 'retrieve_document'], 5), mapping: validateMapping(carrierId, input['mapping']) };
    const reason = text(input, 'reason', 1000); if (reason.length < 10) throw new DomainError('reason_required', 422, 'Describe the configuration purpose.');
    return this.db.transaction(async tx => {
      await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['partner-config:' + carrierId]);
      const next = (await tx.query('SELECT COALESCE(max(version),0)+1 AS version FROM partner_connection_versions WHERE carrier_id=$1', [carrierId])).rows[0]?.['version'];
      const inserted = (await tx.query<ConnectionRow>(`INSERT INTO partner_connection_versions(id,carrier_id,environment,version,state,config,maker_id,reason) VALUES($1,$2,'sandbox',$3,'draft',$4,$5,$6) RETURNING *`, [randomUUID(), carrierId, next, config, actor.userId, reason])).rows[0];
      if (!inserted) throw new Error('Connection insert failed'); await this.audit(tx, actor, 'integration.connection.proposed', inserted.id, reason, { carrierId, version: inserted.version }); return view(inserted);
    });
  }
  async validate(actor: Actor, id: string, expectedRevision: number): Promise<ConnectionView> {
    platform(actor, 'integrations.validate'); positiveVersion(expectedRevision); const row = await this.row(id);
    if (row.revision !== expectedRevision || row.state !== 'draft') throw new DomainError('version_conflict', 409, 'Configuration revision/state changed.');
    const gateway = createCarrierRegistry(this.connectionOptions(row.carrier_id, row.config));
    const quote = await gateway.quote(row.carrier_id, { applicationId: randomUUID(), productId: row.config.products[0] ?? 'PRD-01', tenantId: actor.contextId, channel: 'b2c', risk: { manufactureYear: 2025, memberCount: 3 } });
    const mapped = applyPartnerMapping(row.config.mapping, { orderId: 'SYN-MAPPING-1', premium: { amount: '120000' }, effectiveFrom: '2026-11-01' });
    const evidence = { kind: 'actual-local-simulator-and-mapping-fixture', checkedAt: (this.options.clock?.() ?? new Date()).toISOString(), quoteDigest: sha256(JSON.stringify(quote)), mappingFixtureDigest: sha256(JSON.stringify(mapped)), synthetic: true, liveCertification: false };
    return this.db.transaction(async tx => {
      const current = await this.row(id, tx, true); if (current.revision !== expectedRevision || current.state !== 'draft') throw new DomainError('version_conflict', 409, 'Configuration changed during validation.');
      const updated = (await tx.query<ConnectionRow>(`UPDATE partner_connection_versions SET state='validated',validation_evidence=$2,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING *`, [id, evidence])).rows[0]; if (!updated) throw new Error('Validation persistence failed'); await this.audit(tx, actor, 'integration.connection.validated', id, 'Synthetic contract evidence recorded', evidence); return view(updated);
    });
  }
  async approve(actor: Actor, id: string, expectedRevision: number, reason: string): Promise<ConnectionView> {
    platform(actor, 'integrations.approve'); positiveVersion(expectedRevision); if (reason.trim().length < 10 || reason.length > 1000) throw new DomainError('reason_required', 422, 'Independent approval reason required.');
    return this.db.transaction(async tx => {
      const original = await this.row(id, tx); await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['partner-config:' + original.carrier_id]); const current = await this.row(id, tx, true);
      if (current.maker_id === actor.userId) throw new DomainError('self_approval_forbidden', 403, 'A different authorized checker must approve.');
      if (current.revision !== expectedRevision || current.state !== 'validated' || !current.validation_evidence) throw new DomainError('version_conflict', 409, 'Only the validated immutable revision can publish.');
      await tx.query(`UPDATE partner_connection_versions SET state='superseded',updated_at=now(),revision=revision+1 WHERE carrier_id=$1 AND state='enabled'`, [current.carrier_id]);
      const updated = (await tx.query<ConnectionRow>(`UPDATE partner_connection_versions SET state='enabled',checker_id=$2,reason=$3,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING *`, [id, actor.userId, reason])).rows[0]; if (!updated) throw new Error('Approval persistence failed'); await this.audit(tx, actor, 'integration.connection.enabled', id, reason, { carrierId: current.carrier_id, version: current.version }); return view(updated);
    });
  }
  async setState(actor: Actor, id: string, expectedRevision: number, state: 'disabled' | 'degraded' | 'suspended', reason: string): Promise<ConnectionView> {
    platform(actor, 'integrations.configure'); positiveVersion(expectedRevision); if (!['disabled', 'degraded', 'suspended'].includes(state) || reason.length < 10 || reason.length > 1000) throw new DomainError('validation_failed', 422, 'State and reason are required.');
    return this.db.transaction(async tx => { const row = await this.row(id, tx, true); if (row.revision !== expectedRevision || !row.checker_id) throw new DomainError('version_conflict', 409, 'Approved connection revision required.'); const updated = (await tx.query<ConnectionRow>('UPDATE partner_connection_versions SET state=$2,reason=$3,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING *', [id, state, reason])).rows[0]; if (!updated) throw new Error('State update failed'); await this.audit(tx, actor, 'integration.connection.' + state, id, reason, { version: row.version }); return view(updated); });
  }
  async resolveVersion(carrierId: CarrierId, version?: number): Promise<ConnectionView> {
    const rows = await this.db.query<ConnectionRow>(`SELECT * FROM partner_connection_versions WHERE carrier_id=$1 AND environment='sandbox' AND checker_id IS NOT NULL AND ($2::int IS NULL AND state='enabled' OR $2::int IS NOT NULL AND version=$2) ORDER BY version DESC LIMIT 1`, [carrierId, version ?? null]);
    const row = rows.rows[0]; if (!row) throw new DomainError('connection_unavailable', 409, 'No published connection version is available.'); if (row.state === 'suspended') throw new DomainError('connection_quarantined', 409, 'Connection is suspended for review.'); return view(row);
  }
  async gatewayForVersion(carrierId: CarrierId, version?: number): Promise<{ gateway: CarrierGateway; connection: ConnectionView }> { const connection = await this.resolveVersion(carrierId, version); let gateway = this.gateways.get(connection.id); if (!gateway) { gateway = createCarrierRegistry(this.connectionOptions(carrierId, connection.config)); this.gateways.set(connection.id, gateway); } return { gateway, connection }; }
  async quote(carrierId: CarrierId, input: QuoteInput): Promise<CarrierQuote> {
    const { gateway, connection } = await this.gatewayForVersion(carrierId);
    if (!connection.config.products.includes(input.productId) || !connection.config.channels.includes(input.channel) || !connection.config.capabilities.includes('quote')) throw new DomainError('connection_capability_unavailable', 409, 'Published connection does not permit this product/channel/operation.');
    return { ...await gateway.quote(carrierId, input), connectionId: connection.id, connectionVersion: connection.version };
  }
  async quoteAll(input: QuoteInput, carrierIds: CarrierId[] = ['rest', 'soap', 'signed']): Promise<{ quotes: CarrierQuote[]; failures: Array<{ carrierId: CarrierId; code: string; retriable: boolean }> }> {
    if (carrierIds.length > 3 || new Set(carrierIds).size !== carrierIds.length || carrierIds.some(id => !IDS.includes(id))) throw new DomainError('validation_failed', 422, 'Carrier selection is invalid.');
    const outcomes = await Promise.all(carrierIds.map(async carrierId => { try { return { carrierId, quote: await this.quote(carrierId, input) }; } catch (error) { return { carrierId, error }; } }));
    return { quotes: outcomes.flatMap(v => 'quote' in v && v.quote ? [v.quote] : []), failures: outcomes.flatMap(v => 'error' in v ? [{ carrierId: v.carrierId, code: v.error instanceof DomainError || v.error instanceof IntegrationError ? v.error.code : 'provider_unavailable', retriable: v.error instanceof IntegrationError && v.error.retriable }] : []) };
  }
  async submit(purchase: CarrierPurchase, businessKey: string): Promise<SubmissionResult> {
    const version = purchase.quoteSnapshot.connectionVersion;
    if (version === undefined) throw new DomainError('connection_snapshot_missing', 409, 'Committed work needs its immutable connection version.');
    const { gateway, connection } = await this.gatewayForVersion(purchase.carrierId, version);
    if (connection.id !== purchase.quoteSnapshot.connectionId || !connection.config.capabilities.includes('submit')) throw new DomainError('connection_snapshot_invalid', 409, 'Connection version does not match the accepted quote.');
    return gateway.submit(purchase, businessKey);
  }
  async health(actor: Actor, id: string): Promise<{ state: 'healthy' | 'degraded'; operation: 'synthetic_quote_probe'; checkedAt: string; durationMs: number; errorCode: string | null }> {
    platform(actor, 'integrations.read'); const row = await this.row(id); const start = performance.now();
    let errorCode: string | null = null;
    try { await createCarrierRegistry(this.connectionOptions(row.carrier_id, row.config)).quote(row.carrier_id, { applicationId: randomUUID(), productId: row.config.products[0] ?? 'PRD-01', tenantId: actor.contextId, channel: row.config.channels[0] ?? 'b2c', risk: { manufactureYear: 2025, memberCount: 3 } }); }
    catch (error) { errorCode = error instanceof IntegrationError || error instanceof DomainError ? error.code : 'provider_unavailable'; }
    const result = { state: errorCode === null ? 'healthy' as const : 'degraded' as const, operation: 'synthetic_quote_probe' as const, checkedAt: (this.options.clock?.() ?? new Date()).toISOString(), durationMs: Math.round((performance.now() - start) * 1000) / 1000, errorCode };
    await this.db.transaction(async tx => { await tx.query(`UPDATE partner_connection_versions SET validation_evidence=jsonb_set(COALESCE(validation_evidence,'{}'::jsonb),'{lastHealth}',$2::jsonb,true),updated_at=now() WHERE id=$1`, [id, JSON.stringify(result)]); await this.audit(tx, actor, 'integration.connection.health_observed', id, 'Synthetic quote capability probe; other operations are not inferred healthy', result); });
    return result;
  }
  async transactions(actor: Actor, carrierId?: CarrierId, limit = 50): Promise<Record<string, unknown>[]> { platform(actor, 'integrations.read'); if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new DomainError('validation_failed', 422, 'Limit must be 1..100.'); if (carrierId !== undefined && !IDS.includes(carrierId)) throw new DomainError('validation_failed', 422, 'Unknown carrier.'); return (await this.db.query(`SELECT s.id,s.order_id,s.carrier_id,s.external_ref,s.state,s.version,s.updated_at,o.issuance_state FROM submissions s JOIN orders o ON o.id=s.order_id WHERE ($1::text IS NULL OR s.carrier_id=$1) ORDER BY s.updated_at DESC,s.id LIMIT $2`, [carrierId ?? null, limit])).rows; }
  async classifyReplay(actor: Actor, orderId: string): Promise<{ action: 'reconcile_first' | 'manual_verified_evidence_required' | 'no_replay_needed'; automaticReplay: false; reason: string }> { platform(actor, 'integrations.replay'); assertUuid(orderId); const row = (await this.db.query('SELECT s.carrier_id,s.state FROM submissions s WHERE s.order_id=$1', [orderId])).rows[0]; if (!row) throw new DomainError('resource_not_found', 404, 'Submission not found.'); if (row['state'] === 'issued') return { action: 'no_replay_needed', automaticReplay: false, reason: 'Policy is already issued.' }; return row['carrier_id'] === 'signed' ? { action: 'manual_verified_evidence_required', automaticReplay: false, reason: 'No idempotency or authoritative status capability; verified external reconciliation and independent approval are required.' } : { action: 'reconcile_first', automaticReplay: false, reason: 'Read authoritative status and preserve the original business identity before considering replay.' }; }
  private async row(id: string, tx: SqlClient = this.db, lock = false): Promise<ConnectionRow> { assertUuid(id); const row = (await tx.query<ConnectionRow>('SELECT * FROM partner_connection_versions WHERE id=$1' + (lock ? ' FOR UPDATE' : ''), [id])).rows[0]; if (!row) throw new DomainError('resource_not_found', 404, 'Connection not found.'); return row; }
  private connectionOptions(carrierId: CarrierId, config: ConnectionConfig): GatewayOptions {
    const installedReferences = [`secret://sandbox/${carrierId}-v1`, `secret://sandbox/${carrierId}/v1`];
    if (!installedReferences.includes(config.secretRef)) throw new DomainError('secret_reference_unavailable', 409, 'The sandbox secret reference is not installed; connection remains disabled.');
    return { ...this.options, baseUrl: config.baseUrl, mode: 'sandbox' };
  }
  private async audit(tx: SqlClient, actor: Actor, action: string, resource: string, reason: string, data: unknown): Promise<void> { await tx.query('INSERT INTO audit(id,actor_id,tenant_id,action,resource_id,reason,data) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), actor.userId, actor.contextId, action, resource, reason, data]); }
}
