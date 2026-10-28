import { randomInt, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Database, QueryResultRow, SqlClient } from '@st/database';
import { CarrierId, CarrierPurchase, CarrierQuote, IntegrationError, StatusResult, VerifiedCallback } from './contracts.js';
import { CarrierGateway } from './gateway.js';
import { sha256 } from './security.js';
import { StudioService } from './studio.js';

interface WorkRow extends QueryResultRow { id: string; event_type: string; aggregate_id: string; tenant_id: string; payload: Record<string, unknown>; attempts: number; lease_token: string; created_at: Date; }
interface OrderRow extends QueryResultRow { id: string; tenant_id: string; owner_id: string; product_id: string; carrier_id: CarrierId; state: string; payment_state: string; commitment_kind: string | null; issuance_state: string; quote_snapshot: CarrierQuote; }
interface SubmissionRow extends QueryResultRow { id: string; order_id: string; carrier_id: CarrierId; external_ref: string | null; state: string; data: Record<string, unknown>; }
interface FlagRow extends QueryResultRow { key: string; enabled: boolean; }
interface InboxRow extends QueryResultRow { id: string; payload_digest: string; }
interface PolicyRow extends QueryResultRow { id: string; order_id: string; tenant_id: string; carrier_id: CarrierId; reference: string; document_key: string | null; }
export interface IssuanceWorkerOptions { objectStorageDir?: string; retryDelayMs?: number; leaseSeconds?: number; maxAttempts?: number; retryRandom?: () => number; studio?: StudioService; }
type WorkOutcome = 'delivered' | 'pending' | 'unknown' | 'dead';
const EVENTS = ['purchase.committed.v1', 'purchase.committed.v2', 'carrier.status.requested.v1', 'carrier.observation.v1', 'policy.document.requested.v1'];
const stableId = (source: string): string => { const h = sha256(source); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };

export class IssuanceWorker {
  constructor(private readonly db: Database, private readonly gateway: CarrierGateway, private readonly options: IssuanceWorkerOptions = {}) {}

  async runOnce(): Promise<boolean> {
    const row = await this.db.transaction(async tx => {
      const claim = await tx.query<WorkRow>(`WITH candidate AS (
        SELECT id FROM outbox WHERE event_type=ANY($1::text[])
        AND ((state='pending' AND next_attempt_at<=now()) OR (state='processing' AND locked_until<now()))
        ORDER BY next_attempt_at,created_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
        UPDATE outbox o SET state='processing',attempts=o.attempts+1,locked_until=now()+($2::text||' seconds')::interval,updated_at=now()
        FROM candidate c WHERE o.id=c.id RETURNING o.*,o.locked_until::text AS lease_token`, [EVENTS, String(this.options.leaseSeconds ?? 30)]);
      return claim.rows[0];
    });
    if (!row) return false;
    let outcome: WorkOutcome = 'delivered'; let code: string | null = null;
    try {
      if (!(await this.deliveryEnabled())) outcome = 'pending';
      else if (row.event_type === 'policy.document.requested.v1') outcome = await this.processDocument(row);
      else if (row.event_type === 'carrier.observation.v1') outcome = await this.processObservation(row);
      else if (row.event_type === 'carrier.status.requested.v1') outcome = await this.processStatus(row);
      else outcome = await this.processPurchase(row);
    } catch (error) {
      const failure = error instanceof IntegrationError ? error : new IntegrationError('worker_internal_error', 'transient', true, 'Worker could not complete its persisted step');
      code = failure.code;
      if (failure.kind === 'external_outcome_unknown') {
        outcome = 'unknown';
        await this.markUnknown(row.aggregate_id, failure.code);
        const order = await this.order(row.aggregate_id);
        if ((await this.gatewayFor(order)).getAdapter(order.carrier_id).capabilities.status) await this.enqueueStatus(order);
      } else if (failure.kind === 'transient' && row.attempts < (this.options.maxAttempts ?? 5)) outcome = 'pending';
      else {
        outcome = 'dead';
        await this.db.query(`INSERT INTO audit(id,tenant_id,action,resource_id,reason,data) VALUES($1,$2,'integration.delivery.exception',$3,$4,$5)`, [randomUUID(), row.tenant_id, row.aggregate_id, failure.code, { eventId: row.id, failureKind: failure.kind }]);
      }
    }
    const random = Math.max(0, Math.min(1, this.options.retryRandom?.() ?? randomInt(0, 1000) / 1000));
    const delay = this.options.retryDelayMs ?? Math.min(30_000, Math.round(500 * 2 ** Math.min(row.attempts - 1, 6) * (0.8 + random * 0.4)));
    await this.db.query(`UPDATE outbox SET state=$2,last_error=$3,locked_until=NULL,next_attempt_at=now()+($4::text||' milliseconds')::interval,updated_at=now()
      WHERE id=$1 AND state='processing' AND locked_until::text=$5`, [row.id, outcome, code, String(delay), row.lease_token]);
    return true;
  }

  async observeCallback(rawBody: string, headers: Record<string, string | undefined>, path = '/callbacks/sim-signed'): Promise<{ received: true; duplicate: boolean; inboxId: string }> {
    const observation = this.gateway.verifyCallback(rawBody, headers, path); const digest = sha256(rawBody); const inboxId = randomUUID();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(observation.orderId)) throw new IntegrationError('callback_resource_denied', 'authentication', false, 'Callback reference is outside this mapping version');
    return this.db.transaction(async tx => {
      const order = (await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [observation.orderId])).rows[0];
      if (!order || order.carrier_id !== 'signed' || order.state !== 'committed') throw new IntegrationError('callback_resource_denied', 'authentication', false, 'Callback is outside the permitted committed purchase');
      const inserted = await tx.query<InboxRow>('INSERT INTO inbox(id,source,external_event_id,payload_digest) VALUES($1,$2,$3,$4) ON CONFLICT(source,external_event_id) DO NOTHING RETURNING id,payload_digest', [inboxId, 'signed', observation.eventId, digest]);
      if (!inserted.rows[0]) {
        const prior = (await tx.query<InboxRow>('SELECT id,payload_digest FROM inbox WHERE source=$1 AND external_event_id=$2', ['signed', observation.eventId])).rows[0];
        if (!prior || prior.payload_digest !== digest) throw new IntegrationError('callback_identity_conflict', 'authentication', false, 'Repeated event identity has a different payload');
        return { received: true, duplicate: true, inboxId: prior.id };
      }
      await tx.query('INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,$2,$3,$4,$5)', [randomUUID(), 'carrier.observation.v1', order.id, order.tenant_id, { observation, inboxId, payloadDigest: digest }]);
      await tx.query(`INSERT INTO audit(id,tenant_id,action,resource_id,data) VALUES($1,$2,'integration.callback.received',$3,$4)`, [randomUUID(), order.tenant_id, order.id, { eventId: observation.eventId, inboxId }]);
      return { received: true, duplicate: false, inboxId };
    });
  }

  /** A read-only reconciliation attempt; this never resubmits an uncertain mutation. */
  async reconcile(orderId: string): Promise<StatusResult> {
    const order = await this.order(orderId); const result = await (await this.gatewayFor(order)).status(order.carrier_id, order.id);
    if (result.status === 'issued') await this.applyIssued(order, result, 0);
    return result;
  }

  private async deliveryEnabled(): Promise<boolean> {
    const rows = (await this.db.query<FlagRow>(`SELECT key,enabled FROM feature_controls WHERE key IN ('security.quarantine','partner_delivery.enabled')`)).rows;
    return rows.find(r => r.key === 'security.quarantine')?.enabled !== true && rows.find(r => r.key === 'partner_delivery.enabled')?.enabled !== false;
  }
  private async order(id: string): Promise<OrderRow> {
    const result = (await this.db.query<OrderRow>('SELECT * FROM orders WHERE id=$1', [id])).rows[0];
    if (!result || !['rest', 'soap', 'signed'].includes(result.carrier_id)) throw new IntegrationError('order_missing', 'mapping_error', false, 'Carrier order is missing or unsupported');
    return result;
  }
  private purchase(order: OrderRow): CarrierPurchase {
    if (!order.quote_snapshot || order.quote_snapshot.synthetic !== true || order.quote_snapshot.carrierId !== order.carrier_id) throw new IntegrationError('invalid_purchase_snapshot', 'mapping_error', false, 'Immutable purchase snapshot does not match carrier');
    return { orderId: order.id, productId: order.product_id, carrierId: order.carrier_id, tenantId: order.tenant_id, ownerId: order.owner_id, quoteSnapshot: order.quote_snapshot };
  }
  private async gatewayFor(order: OrderRow): Promise<CarrierGateway> {
    if (order.quote_snapshot.connectionVersion === undefined) return this.gateway;
    const studio = this.options.studio ?? new StudioService(this.db);
    const resolved = await studio.gatewayForVersion(order.carrier_id, order.quote_snapshot.connectionVersion);
    if (resolved.connection.id !== order.quote_snapshot.connectionId) throw new IntegrationError('connection_snapshot_invalid', 'mapping_error', false, 'Committed connection version identity changed');
    return resolved.gateway;
  }
  private async enqueueStatus(order: OrderRow, tx: SqlClient = this.db): Promise<void> {
    await tx.query(`INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload,next_attempt_at) VALUES($1,'carrier.status.requested.v1',$2,$3,$4,now()) ON CONFLICT(id) DO NOTHING`, [stableId('status:' + order.id), order.id, order.tenant_id, { orderId: order.id }]);
  }
  private async processPurchase(row: WorkRow): Promise<WorkOutcome> {
    const order = await this.order(row.aggregate_id);
    const gateway = await this.gatewayFor(order);
    if (order.state !== 'committed') throw new IntegrationError('purchase_not_committed', 'mapping_error', false, 'Uncommitted purchase cannot be transmitted');
    if (row.event_type === 'purchase.committed.v2' && (order.payment_state !== 'wallet' || order.commitment_kind !== 'verified_wallet_allocation' || row.payload['commitmentKind'] !== 'verified_wallet_allocation' || typeof row.payload['walletSpendId'] !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.payload['walletSpendId']))) throw new IntegrationError('wallet_commitment_invalid', 'mapping_error', false, 'Wallet commitment event does not match the committed funding authority');
    const action = await this.db.transaction(async tx => {
      await tx.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE', [order.id]);
      const existing = (await tx.query<SubmissionRow>('SELECT * FROM submissions WHERE order_id=$1 FOR UPDATE', [order.id])).rows[0];
      if (existing) {
        if (existing.state === 'issued' || existing.state === 'rejected') return 'done';
        if (existing.state === 'acknowledged') { if (gateway.getAdapter(order.carrier_id).capabilities.status) await this.enqueueStatus(order, tx); return 'done'; }
        if (existing.state === 'external_outcome_unknown' || existing.state === 'sending') return 'unknown';
        await tx.query(`UPDATE submissions SET state='sending',version=version+1,updated_at=now(),data=data||$2::jsonb WHERE id=$1`, [existing.id, JSON.stringify({ businessKey: `purchase:${order.id}:submit:v1` })]);
        return 'submit';
      }
      await tx.query(`INSERT INTO submissions(id,order_id,carrier_id,state,data) VALUES($1,$2,$3,'sending',$4)`, [randomUUID(), order.id, order.carrier_id, { businessKey: `purchase:${order.id}:submit:v1`, mappingVersion: 'v1' }]);
      await tx.query(`UPDATE orders SET issuance_state='pending',version=version+1 WHERE id=$1`, [order.id]);
      return 'submit';
    });
    if (action === 'done') return 'delivered';
    if (action === 'unknown') throw new IntegrationError('external_outcome_unknown', 'external_outcome_unknown', false, 'Prior submission may already have been accepted');
    try {
      const result = await gateway.submit(this.purchase(order), `purchase:${order.id}:submit:v1`);
      await this.db.transaction(async tx => {
        await tx.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE', [order.id]);
        await tx.query(`UPDATE submissions SET external_ref=$2,state=CASE WHEN state='issued' THEN state ELSE 'acknowledged' END,version=version+1,updated_at=now() WHERE order_id=$1`, [order.id, result.reference]);
        if (gateway.getAdapter(order.carrier_id).capabilities.status) await this.enqueueStatus(order, tx);
        await tx.query(`INSERT INTO audit(id,tenant_id,action,resource_id,data) VALUES($1,$2,'integration.submission.acknowledged',$3,$4)`, [randomUUID(), order.tenant_id, order.id, { carrierId: order.carrier_id, reference: result.reference }]);
      });
      return 'delivered';
    } catch (error) {
      if (error instanceof IntegrationError && ['transient', 'authentication', 'business_rejection', 'mapping_error'].includes(error.kind)) {
        await this.db.query(`UPDATE submissions SET state=$2,version=version+1,updated_at=now() WHERE order_id=$1 AND state<>'issued'`, [order.id, error.kind === 'business_rejection' ? 'rejected' : 'pending']);
        if (error.kind === 'business_rejection') await this.db.query(`UPDATE orders SET issuance_state='failed',version=version+1 WHERE id=$1 AND issuance_state<>'issued'`, [order.id]);
      }
      throw error;
    }
  }
  private async processStatus(row: WorkRow): Promise<WorkOutcome> {
    const order = await this.order(row.aggregate_id);
    if (order.issuance_state === 'issued') return 'delivered';
    const submission = (await this.db.query<SubmissionRow>('SELECT * FROM submissions WHERE order_id=$1', [order.id])).rows[0];
    const result = await (await this.gatewayFor(order)).status(order.carrier_id, order.id, submission?.external_ref ?? undefined);
    if (result.status === 'issued') { await this.applyIssued(order, result, 0); return 'delivered'; }
    if (result.status === 'rejected') { await this.db.query(`UPDATE submissions SET state='rejected',version=version+1,updated_at=now() WHERE order_id=$1 AND state<>'issued'`, [order.id]); return 'dead'; }
    if (result.status === 'not_found' && result.authoritative) { await this.markUnknown(order.id, 'authoritative_absence_requires_review'); return 'unknown'; }
    if (Date.now() - new Date(row.created_at).getTime() > 900_000) { await this.markUnknown(order.id, 'status_reconciliation_overdue'); return 'unknown'; }
    return 'pending';
  }
  private async processObservation(row: WorkRow): Promise<WorkOutcome> {
    const value = row.payload['observation'];
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new IntegrationError('observation_invalid', 'mapping_error', false, 'Missing immutable callback observation');
    const candidate = value as Record<string, unknown>;
    if (typeof candidate['eventId'] !== 'string' || typeof candidate['orderId'] !== 'string' || typeof candidate['reference'] !== 'string' || !Number.isInteger(candidate['sequence']) || Number(candidate['sequence']) < 1 || !['pending', 'issued'].includes(String(candidate['status']))) throw new IntegrationError('observation_invalid', 'mapping_error', false, 'Callback job does not satisfy its typed boundary');
    const observation: VerifiedCallback = { eventId: candidate['eventId'], orderId: candidate['orderId'], reference: candidate['reference'], sequence: Number(candidate['sequence']), status: candidate['status'] === 'issued' ? 'issued' : 'pending' };
    if (observation.status === 'issued') {
      if (typeof candidate['policyReference'] !== 'string' || typeof candidate['effectiveFrom'] !== 'string' || typeof candidate['effectiveUntil'] !== 'string' || typeof candidate['documentReference'] !== 'string') throw new IntegrationError('observation_invalid', 'mapping_error', false, 'Issued callback job lacks typed policy evidence');
      observation.policyReference = candidate['policyReference']; observation.effectiveFrom = candidate['effectiveFrom']; observation.effectiveUntil = candidate['effectiveUntil']; observation.documentReference = candidate['documentReference'];
    }
    const evidence = (await this.db.query<InboxRow>(`SELECT id,payload_digest FROM inbox WHERE id=$1 AND source='signed' AND external_event_id=$2`, [row.payload['inboxId'], observation.eventId])).rows[0];
    if (!evidence || row.payload['payloadDigest'] !== undefined && row.payload['payloadDigest'] !== evidence.payload_digest) throw new IntegrationError('observation_provenance_invalid', 'authentication', false, 'Callback job has no matching durable verified inbox evidence');
    const order = await this.order(row.aggregate_id);
    if (observation.orderId !== order.id || order.carrier_id !== 'signed') throw new IntegrationError('observation_scope_invalid', 'authentication', false, 'Observation recipient scope mismatch');
    if (observation.status === 'issued') {
      if (!observation.policyReference || !observation.effectiveFrom || !observation.effectiveUntil || !observation.documentReference) throw new IntegrationError('issued_observation_invalid', 'mapping_error', false, 'Issued observation lacks policy evidence');
      await this.applyIssued(order, { status: 'issued', reference: observation.reference, policyReference: observation.policyReference, effectiveFrom: observation.effectiveFrom, effectiveUntil: observation.effectiveUntil, documentReference: observation.documentReference, authoritative: true }, observation.sequence);
    } else {
      await this.db.query(`UPDATE submissions SET external_ref=COALESCE(external_ref,$2),state='acknowledged',data=data||$3::jsonb,version=version+1,updated_at=now() WHERE order_id=$1 AND state<>'issued' AND COALESCE((data->>'sequence')::int,0)<$4`, [order.id, observation.reference, JSON.stringify({ sequence: observation.sequence }), observation.sequence]);
    }
    return 'delivered';
  }
  private async applyIssued(order: OrderRow, observation: Extract<StatusResult, { status: 'issued' }>, sequence: number): Promise<void> {
    if (observation.effectiveFrom !== order.quote_snapshot.effectiveFrom || observation.effectiveUntil !== order.quote_snapshot.effectiveUntil) throw new IntegrationError('carrier_effective_date_mismatch', 'mapping_error', false, 'Carrier policy dates differ from accepted terms');
    const policyId = stableId('policy:' + order.id);
    const today = new Date().toISOString().slice(0, 10);
    const policyState = observation.effectiveFrom > today ? 'future' : observation.effectiveUntil <= today ? 'expired' : 'active';
    await this.db.transaction(async tx => {
      const current = (await tx.query<OrderRow>('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [order.id])).rows[0];
      if (!current || current.state !== 'committed') throw new IntegrationError('purchase_not_committed', 'mapping_error', false, 'Policy cannot attach to an uncommitted order');
      const prior = await tx.query('SELECT id,reference FROM policies WHERE order_id=$1', [order.id]);
      if (prior.rows[0]) { if (prior.rows[0]['reference'] !== observation.policyReference) throw new IntegrationError('policy_reference_conflict', 'external_outcome_unknown', false, 'Carrier returned conflicting policy references'); return; }
      await tx.query(`INSERT INTO policies(id,order_id,tenant_id,owner_id,carrier_id,reference,effective_from,effective_until,state,document_key,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10)`, [policyId, order.id, order.tenant_id, order.owner_id, order.carrier_id, observation.policyReference, observation.effectiveFrom, observation.effectiveUntil, policyState, { synthetic: true, documentStatus: 'pending', effectiveDateSource: 'fictional-carrier', effectiveDateCalendar: 'gregory', effectiveDateZone: 'UTC-synthetic', mappingVersion: 'v1' }]);
      await tx.query(`UPDATE submissions SET state='issued',external_ref=$2,policy_id=$3,data=data||$4::jsonb,version=version+1,updated_at=now() WHERE order_id=$1`, [order.id, observation.reference, policyId, JSON.stringify({ sequence, policyReference: observation.policyReference })]);
      await tx.query(`UPDATE orders SET issuance_state='issued',version=version+1 WHERE id=$1`, [order.id]);
      await tx.query(`UPDATE outbox SET state='delivered',last_error=NULL,locked_until=NULL,updated_at=now() WHERE aggregate_id=$1 AND event_type IN('purchase.committed.v1','purchase.committed.v2') AND state='unknown'`, [order.id]);
      await tx.query(`INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'policy.issued.v1',$2,$3,$4) ON CONFLICT(id) DO NOTHING`, [stableId('policy-issued:' + order.id), order.id, order.tenant_id, { policyId, orderId: order.id, carrierId: order.carrier_id, policyReference: observation.policyReference }]);
      await tx.query(`INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'policy.document.requested.v1',$2,$3,$4) ON CONFLICT(id) DO NOTHING`, [stableId('policy-document:' + order.id), order.id, order.tenant_id, { policyId, orderId: order.id }]);
      await tx.query(`INSERT INTO audit(id,tenant_id,action,resource_id,data) VALUES($1,$2,'policy.issued',$3,$4)`, [randomUUID(), order.tenant_id, policyId, { orderId: order.id, carrierId: order.carrier_id, sequence }]);
    });
  }
  private async processDocument(row: WorkRow): Promise<WorkOutcome> {
    const policy = (await this.db.query<PolicyRow>('SELECT * FROM policies WHERE order_id=$1', [row.aggregate_id])).rows[0];
    if (!policy) throw new IntegrationError('policy_missing', 'mapping_error', false, 'Document job has no confirmed policy');
    if (policy.document_key) return 'delivered';
    const order = await this.order(policy.order_id);
    const document = await (await this.gatewayFor(order)).document(policy.carrier_id, policy.reference);
    const directory = resolve(this.options.objectStorageDir ?? process.env['OBJECT_STORAGE_DIR'] ?? '.local/objects'); const key = policy.id + '.pdf';
    await mkdir(directory, { recursive: true, mode: 0o700 });
    try { await writeFile(resolve(directory, key), document.bytes, { flag: 'wx', mode: 0o600 }); }
    catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST' || sha256(await readFile(resolve(directory, key))) !== document.sha256) throw error; }
    await this.db.transaction(async tx => {
      await tx.query('SELECT id FROM policies WHERE id=$1 FOR UPDATE', [policy.id]);
      await tx.query(`UPDATE policies SET document_key=$2,data=data||$3::jsonb,version=version+1 WHERE id=$1 AND document_key IS NULL`, [policy.id, key, JSON.stringify({ documentStatus: 'available', documentSha256: document.sha256 })]);
      await tx.query(`INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'policy.document.available.v1',$2,$3,$4) ON CONFLICT(id) DO NOTHING`, [stableId('policy-document-available:' + policy.order_id), policy.order_id, policy.tenant_id, { policyId: policy.id }]);
    });
    return 'delivered';
  }
  private async markUnknown(orderId: string, code: string): Promise<void> {
    await this.db.transaction(async tx => {
      await tx.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
      await tx.query(`UPDATE submissions SET state='external_outcome_unknown',data=data||$2::jsonb,version=version+1,updated_at=now() WHERE order_id=$1 AND state<>'issued'`, [orderId, JSON.stringify({ exceptionCode: code })]);
      await tx.query(`UPDATE orders SET issuance_state='external_outcome_unknown',version=version+1 WHERE id=$1 AND issuance_state<>'issued'`, [orderId]);
    });
  }
}
