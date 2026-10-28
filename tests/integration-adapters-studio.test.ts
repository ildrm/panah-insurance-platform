import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Database } from '@st/database';
import { Actor, DomainError } from '@st/contracts';
import { applyPartnerMapping, createCarrierRegistry, defaultPartnerMapping, IssuanceWorker, migrateIntegrations, StudioService } from '../packages/integrations/src/index.js';
import { createSimulatorServer } from '../apps/simulators/src/server.js';

async function fixture(): Promise<{ db: Database; close(): Promise<void> }> {
  const url = new URL(process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? 'postgresql://st@127.0.0.1:55432/st_local');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  const admin = new Database(url.toString()); const schema = 'studio_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE SCHEMA ${schema}`); url.searchParams.set('options', '-csearch_path=' + schema); const db = new Database(url.toString());
  for (const file of (await readdir('packages/database/migrations')).filter(file => file.endsWith('.sql')).sort()) await db.query(await readFile(resolve('packages/database/migrations', file), 'utf8')); await migrateIntegrations(db);
  return { db, close: async () => { await db.close(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.close(); } };
}
const actor = (): Actor => ({ userId: randomUUID(), contextId: randomUUID(), contextKind: 'platform', roles: ['integration-admin'], permissions: ['integrations.*'], sessionId: randomUUID(), permissionRevision: 1 });
test('Integration Studio persists validate/maker-checker publication and retains old in-flight versions', async t => {
  const database = await fixture(); t.after(database.close); const simulator = await createSimulatorServer(); t.after(() => simulator.close());
  const maker = actor(); const checker = actor(); const studio = new StudioService(database.db);
  const proposal = { carrierId: 'rest', environment: 'sandbox', baseUrl: simulator.url, secretRef: 'secret://sandbox/rest-v1', products: ['PRD-01'], channels: ['b2c'], capabilities: ['quote', 'submit', 'status', 'retrieve_document'], mapping: defaultPartnerMapping('rest'), reason: 'Synthetic local carrier onboarding' };
  const draft = await studio.propose(maker, proposal); assert.equal(draft.state, 'draft');
  await assert.rejects(studio.approve(checker, draft.id, draft.revision, 'Attempt before contract validation'), (e: unknown) => e instanceof DomainError && e.code === 'version_conflict');
  const validated = await studio.validate(maker, draft.id, draft.revision); assert.equal(validated.state, 'validated'); assert.equal(validated.validationEvidence?.['liveCertification'], false);
  await assert.rejects(studio.approve(maker, draft.id, validated.revision, 'Maker attempts own publication'), (e: unknown) => e instanceof DomainError && e.code === 'self_approval_forbidden');
  const enabled = await studio.approve(checker, draft.id, validated.revision, 'Independent local synthetic approval'); assert.equal(enabled.state, 'enabled');
  assert.equal((await studio.health(checker, enabled.id)).state, 'healthy');
  const second = await studio.propose(maker, proposal); const validation2 = await studio.validate(maker, second.id, second.revision); const enabled2 = await studio.approve(checker, second.id, validation2.revision, 'Publish revised local endpoint configuration');
  assert.equal(enabled2.version, 2); const retained = await studio.resolveVersion('rest', 1); assert.equal(retained.state, 'superseded'); assert.deepEqual(retained.config, enabled.config);
  const old = await studio.gatewayForVersion('rest', 1); assert.equal(old.connection.version, 1); assert.equal((await old.gateway.quote('rest', { applicationId: randomUUID(), productId: 'PRD-01', tenantId: maker.contextId, channel: 'b2c', risk: { manufactureYear: 2025 } })).synthetic, true);
  await studio.setState(checker, enabled2.id, enabled2.revision, 'suspended', 'Security review pauses this connection');
  await assert.rejects(studio.resolveVersion('rest', 2), (e: unknown) => e instanceof DomainError && e.code === 'connection_quarantined');
  const audit = await database.db.query('SELECT action FROM audit ORDER BY created_at'); assert.ok(audit.rows.some(row => row['action'] === 'integration.connection.enabled'));
});

test('Studio rejects live access, metadata SSRF, raw credentials, arbitrary expressions and nonplatform context', async t => {
  const database = await fixture(); t.after(database.close); const studio = new StudioService(database.db); const maker = actor();
  const proposal = { carrierId: 'signed', environment: 'sandbox', baseUrl: 'http://127.0.0.1:3100', secretRef: 'secret://sandbox/signed-v1', products: ['PRD-01'], channels: ['b2c'], capabilities: ['quote', 'submit', 'callback', 'retrieve_document'], mapping: defaultPartnerMapping('signed'), reason: 'Synthetic boundary negative test' };
  for (const change of [{ environment: 'live' }, { baseUrl: 'http://169.254.169.254' }, { baseUrl: 'http://user:pass@127.0.0.1:3100' }, { secretRef: 'actual-unapproved-secret-value' }, { mapping: { version: 'signed-map-v1', fields: [{ from: 'eval(process.env)', to: 'premium_toman', transform: 'identity' }] } }]) await assert.rejects(studio.propose(maker, { ...proposal, ...change }));
  await assert.rejects(studio.list({ ...maker, contextKind: 'carrier' }), (e: unknown) => e instanceof DomainError && e.status === 403);
  assert.deepEqual(applyPartnerMapping(defaultPartnerMapping('signed'), { orderId: 'SYN-1', premium: { amount: '120000' }, effectiveFrom: '2026-11-01' }), { client_ref: 'SYN-1', premium_toman: '12000', effective_jalali: '1405-08-10' });
  assert.throws(() => applyPartnerMapping({ version: 'map-v1', fields: [{ from: 'orderId', to: '__proto__.polluted', transform: 'identity' }] }, { orderId: 'malicious' }), /unapproved/);
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM partner_connection_versions')).rows[0]?.['count'], 0);
});

test('new quotes use published version while a committed order remains on its original endpoint after rollout', async t => {
  const database = await fixture(); t.after(database.close); const clock = (): Date => new Date('2026-10-28T08:00:00Z');
  const oldCarrier = await createSimulatorServer({ clock }); const newCarrier = await createSimulatorServer({ clock }); t.after(() => oldCarrier.close()); t.after(() => newCarrier.close());
  const directory = await mkdtemp(join(tmpdir(), 'st-version-route-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const maker = actor(); const checker = actor(); const studio = new StudioService(database.db, { clock });
  async function publish(baseUrl: string, secretRef = 'secret://sandbox/rest-v1'): Promise<void> { const proposal = await studio.propose(maker, { carrierId: 'rest', environment: 'sandbox', baseUrl, secretRef, products: ['PRD-01'], channels: ['b2c'], capabilities: ['quote', 'submit', 'status', 'retrieve_document'], mapping: defaultPartnerMapping('rest'), reason: 'Controlled synthetic endpoint rollout' }); const validated = await studio.validate(maker, proposal.id, proposal.revision); await studio.approve(checker, proposal.id, validated.revision, 'Independent synthetic endpoint review'); }
  await publish(oldCarrier.url, 'secret://sandbox/rest/v1');
  const input = { applicationId: randomUUID(), productId: 'PRD-01', tenantId: randomUUID(), channel: 'b2c', risk: { manufactureYear: 2025 } };
  const quote = await studio.quote('rest', input); assert.equal(quote.connectionVersion, 1); const orderId = randomUUID();
  await database.db.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot) VALUES($1,$2,$3,'PRD-01','rest','committed','verified','not_started',$4)", [orderId, input.tenantId, randomUUID(), quote]);
  await database.db.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'purchase.committed.v1',$2,$3,'{}')", [randomUUID(), orderId, input.tenantId]);
  await publish(newCarrier.url); assert.equal((await studio.quote('rest', { ...input, applicationId: randomUUID() })).connectionVersion, 2);
  await assert.rejects(studio.quote('rest', { ...input, channel: 'corporate' }), (e: unknown) => e instanceof DomainError && e.code === 'connection_capability_unavailable');
  const worker = new IssuanceWorker(database.db, createCarrierRegistry({ baseUrl: newCarrier.url, mode: 'sandbox', clock }), { studio, objectStorageDir: directory, retryDelayMs: 0 });
  for (let n = 0; n < 10; n++) if (!(await worker.runOnce())) break;
  assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [orderId])).rows[0]?.['issuance_state'], 'issued'); assert.equal(oldCarrier.state('rest').submitCalls, 1); assert.equal(newCarrier.state('rest').submitCalls, 0);
});
