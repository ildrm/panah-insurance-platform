import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { Database } from '@st/database';
import { CarrierPurchase, CarrierQuote, createCarrierRegistry, IntegrationError, IssuanceWorker, parseSoap, persianDate, gregorianDate, rialToToman, signedHeaders, SYNTHETIC_SIGNING_KEY } from '../packages/integrations/src/index.js';
import { createSimulatorServer, RunningSimulator } from '../apps/simulators/src/server.js';

const now = new Date('2026-10-28T08:00:00Z'); const clock = (): Date => new Date(now);
const input = (productId = 'PRD-01') => ({ applicationId: randomUUID(), productId, risk: productId === 'PRD-01' ? { manufactureYear: 2025, privateMedicalField: 'must-not-be-projected' } : { memberCount: 3, censusRef: randomUUID(), privateMedicalField: 'must-not-be-projected' }, channel: productId === 'PRD-01' ? 'b2c' : 'corporate', tenantId: randomUUID(), effectiveFrom: '2026-11-01' });
const purchase = (quote: CarrierQuote): CarrierPurchase => ({ orderId: randomUUID(), productId: quote.productId, carrierId: quote.carrierId, tenantId: randomUUID(), ownerId: randomUUID(), quoteSnapshot: quote });
async function reset(simulator: RunningSimulator, carrier: string, scenario: string): Promise<void> { const response = await fetch(`${simulator.url}/_test/carriers/${carrier}/reset`, { method: 'POST', body: JSON.stringify({ scenario }), headers: { 'content-type': 'application/json' } }); assert.equal(response.status, 200); }

test('three incompatible real HTTP adapters quote, submit, map money/calendar and retrieve documents', async t => {
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close());
  const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  const result = await gateway.quoteAll(input());
  assert.equal(result.failures.length, 0); assert.equal(result.quotes.length, 3);
  assert.deepEqual(result.quotes.map(q => q.premium.amount), ['120000', '130000', '140000']);
  for (const quote of result.quotes.filter(q => q.carrierId !== 'signed')) {
    const order = purchase(quote); const ack = await gateway.submit(order, `purchase:${order.orderId}:submit:v1`); assert.equal(ack.status, 'acknowledged');
    let status = await gateway.status(order.carrierId, order.orderId);
    if (order.carrierId === 'soap') { assert.deepEqual(status, { status: 'not_found', authoritative: false }); status = await gateway.status('soap', order.orderId); }
    assert.equal(status.status, 'pending'); status = await gateway.status(order.carrierId, order.orderId); assert.equal(status.status, 'issued');
    if (status.status !== 'issued') assert.fail('expected policy');
    const document = await gateway.document(order.carrierId, status.policyReference); assert.equal(document.contentType, 'application/pdf'); assert.ok(document.bytes.subarray(0, 5).equals(Buffer.from('%PDF-')));
  }
  const group = await gateway.quote('soap', input('PRD-07')); assert.equal(group.premium.amount, '390000'); assert.equal(group.coverages[0], 'synthetic-group-benefit');
});

test('REST idempotency prevents duplicate acceptance, and timeout-after-acceptance reconciles by status', async t => {
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  const quote = await gateway.quote('rest', input()); const order = purchase(quote); const key = `purchase:${order.orderId}:submit:v1`;
  const a = await gateway.submit(order, key); const b = await gateway.submit(order, key); assert.equal(a.reference, b.reference); assert.equal(simulator.state('rest').submissions, 1);
  await assert.rejects(gateway.submit({ ...order, quoteSnapshot: { ...order.quoteSnapshot, effectiveFrom: '2026-11-02' } }, key), (error: unknown) => error instanceof IntegrationError && error.kind === 'external_outcome_unknown');
  await reset(simulator, 'rest', 'timeout_after_acceptance');
  const timed = purchase(await gateway.quote('rest', input()));
  await assert.rejects(gateway.submit(timed, `purchase:${timed.orderId}:submit:v1`), (error: unknown) => error instanceof IntegrationError && error.kind === 'external_outcome_unknown' && !error.retriable);
  assert.equal((await gateway.status('rest', timed.orderId)).status, 'pending'); assert.equal((await gateway.status('rest', timed.orderId)).status, 'issued'); assert.equal(simulator.state('rest').submitCalls, 1);
});

test('provider outages, malformed mapping and explicit rejection are classified without invented offers', async t => {
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'rest', 'malformed_response'); const partial = await gateway.quoteAll(input()); assert.equal(partial.quotes.length, 2); assert.equal(partial.failures[0]?.code, 'invalid_amount');
  await reset(simulator, 'rest', 'partial_outage'); await assert.rejects(gateway.quote('rest', input()), (e: unknown) => e instanceof IntegrationError && e.kind === 'transient');
  await reset(simulator, 'soap', 'mapping_version_change'); await assert.rejects(gateway.quote('soap', input()), (e: unknown) => e instanceof IntegrationError && e.kind === 'mapping_error');
  await reset(simulator, 'signed', 'definitive_reject'); const order = purchase(await gateway.quote('signed', input()));
  await assert.rejects(gateway.submit(order, `purchase:${order.orderId}:submit:v1`), (e: unknown) => e instanceof IntegrationError && e.kind === 'business_rejection'); assert.equal(simulator.state('signed').submissions, 0);
  assert.throws(() => createCarrierRegistry({ baseUrl: 'https://real.example.invalid', mode: 'live' }), /Live carrier/);
  assert.throws(() => createCarrierRegistry({ baseUrl: 'http://169.254.169.254', mode: 'sandbox' }), /loopback/);
});

test('safe throttling/authentication failures and unsupported idempotency are explicit provider boundaries', async t => {
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'rest', 'throttled'); await assert.rejects(gateway.quote('rest', input()), (e: unknown) => e instanceof IntegrationError && e.retriable);
  const quote = await gateway.quote('rest', input()); const order = purchase(quote); const key = `purchase:${order.orderId}:submit:v1`;
  await assert.rejects(gateway.submit(order, key), (e: unknown) => e instanceof IntegrationError && e.kind === 'transient'); assert.equal(simulator.state('rest').submissions, 0); await gateway.submit(order, key); assert.equal(simulator.state('rest').submissions, 1);
  await reset(simulator, 'soap', 'expired_token'); await assert.rejects(gateway.quote('soap', input()), (e: unknown) => e instanceof IntegrationError && e.kind === 'authentication');
  await reset(simulator, 'rest', 'idempotency_not_supported'); const noDedupe = purchase(await gateway.quote('rest', input())); const first = await gateway.submit(noDedupe, `purchase:${noDedupe.orderId}:submit:v1`); const second = await gateway.submit(noDedupe, `purchase:${noDedupe.orderId}:submit:v1`); assert.notEqual(first.reference, second.reference, 'fixture deliberately demonstrates duplicate risk'); await assert.rejects(gateway.status('rest', noDedupe.orderId), (e: unknown) => e instanceof IntegrationError && e.kind === 'external_outcome_unknown');
});

test('signature nonce replay, body tampering, unsafe XML and inexact currency transforms fail closed', () => {
  const gateway = createCarrierRegistry({ baseUrl: 'http://127.0.0.1:3100', mode: 'sandbox', clock });
  const body = JSON.stringify({ event_id: 'SYN-E1', sequence: 1, client_ref: randomUUID(), receipt_ref: 'SYN-S1', issuance: 'pending', occurred_at: now.toISOString() });
  const headers = signedHeaders('POST', '/callbacks/sim-signed', body, SYNTHETIC_SIGNING_KEY, clock);
  assert.equal(gateway.verifyCallback(body, headers).status, 'pending'); assert.throws(() => gateway.verifyCallback(body, headers), /Nonce/);
  const fresh = signedHeaders('POST', '/callbacks/sim-signed', body, SYNTHETIC_SIGNING_KEY, clock); assert.throws(() => gateway.verifyCallback(body + ' ', fresh), /Signature/);
  assert.throws(() => parseSoap('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]><x/>'), /SOAP/);
  assert.throws(() => parseSoap('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:c="urn:fictional:carrier:soap:v1"><wrong:Body><c:RequestQuote><c:ClientApplicationRef>test</c:ClientApplicationRef></c:RequestQuote></wrong:Body></soap:Envelope>'), /SOAP/);
  assert.equal(persianDate('2026-11-01'), '1405-08-10'); assert.equal(gregorianDate('1405-08-10'), '2026-11-01'); assert.equal(rialToToman('120000'), '12000'); assert.throws(() => rialToToman('120001'), /exactly/);
});

test('container service destinations require explicit trusted sandbox environment and remain forbidden by default', () => {
  const previousHosts = process.env['ST_SANDBOX_SERVICE_HOSTS']; const previousMode = process.env['APP_MODE'];
  try {
    delete process.env['ST_SANDBOX_SERVICE_HOSTS'];
    assert.throws(() => createCarrierRegistry({ baseUrl: 'http://simulators:3100', mode: 'sandbox' }), /loopback/);
    process.env['APP_MODE'] = 'sandbox'; process.env['ST_SANDBOX_SERVICE_HOSTS'] = 'simulators';
    assert.ok(createCarrierRegistry({ baseUrl: 'http://simulators:3100', mode: 'sandbox' }));
    assert.throws(() => createCarrierRegistry({ baseUrl: 'http://169.254.169.254', mode: 'sandbox' }), /loopback/);
    assert.throws(() => createCarrierRegistry({ baseUrl: 'http://other-service:3100', mode: 'sandbox' }), /loopback/);
    process.env['APP_MODE'] = 'production'; assert.throws(() => createCarrierRegistry({ baseUrl: 'http://simulators:3100', mode: 'sandbox' }), /explicit trusted sandbox/);
  } finally { if (previousHosts === undefined) delete process.env['ST_SANDBOX_SERVICE_HOSTS']; else process.env['ST_SANDBOX_SERVICE_HOSTS'] = previousHosts; if (previousMode === undefined) delete process.env['APP_MODE']; else process.env['APP_MODE'] = previousMode; }
});

test('provider and tenant concurrency permits stay bounded under simultaneous quote requests', async t => {
  let active = 0; let peak = 0;
  const server = createServer(async (request, response) => {
    for await (const _chunk of request) { /* Consume the bounded synthetic request. */ }
    active++; peak = Math.max(peak, active); await new Promise(done => setTimeout(done, 25));
    response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ kind: 'quote', quoteRef: 'SIM-Q-' + randomUUID(), premium: { amount: '120000', currency: 'IRR', unit: 'rial' }, expiresAt: '2026-10-28T08:10:00Z', mappingVersion: 'map-v1' })); active--;
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done)); t.after(() => new Promise<void>(done => { server.closeAllConnections(); server.close(() => done()); }));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const gateway = createCarrierRegistry({ baseUrl: `http://127.0.0.1:${address.port}`, mode: 'sandbox', clock, perProviderConcurrency: 4 });
  const oneTenant = input(); await Promise.all(Array.from({ length: 12 }, () => gateway.quote('rest', { ...oneTenant, applicationId: randomUUID() }))); assert.ok(peak <= 2);
  peak = 0; await Promise.all(Array.from({ length: 20 }, () => gateway.quote('rest', input()))); assert.ok(peak <= 4); assert.ok(peak > 1);
});

async function isolatedDatabase(): Promise<{ db: Database; close(): Promise<void> }> {
  const url = new URL(process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? 'postgresql://st@127.0.0.1:55432/st_local');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'tests only use loopback database');
  const admin = new Database(url.toString()); const schema = 'integration_' + randomUUID().replace(/-/g, '');
  await admin.query(`CREATE SCHEMA ${schema}`); url.searchParams.set('options', '-csearch_path=' + schema);
  const db = new Database(url.toString()); for (const file of (await readdir('packages/database/migrations')).filter(file => file.endsWith('.sql')).sort()) await db.query(await readFile(resolve('packages/database/migrations', file), 'utf8'));
  await db.query("INSERT INTO feature_controls(key,enabled) VALUES ('partner_delivery.enabled',true),('security.quarantine',false),('sales.b2c',false),('sales.b2b',false)");
  return { db, close: async () => { await db.close(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.close(); } };
}
async function committedOrder(db: Database, order: CarrierPurchase, credit = false): Promise<void> {
  await db.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,issuance_state,quote_snapshot) VALUES($1,$2,$3,$4,$5,'committed',$6,'not_started',$7)", [order.orderId, order.tenantId, order.ownerId, order.productId, order.carrierId, credit ? 'credit' : 'verified', order.quoteSnapshot]);
  await db.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'purchase.committed.v1',$2,$3,$4)", [randomUUID(), order.orderId, order.tenantId, { orderId: order.orderId }]);
}
async function drain(worker: IssuanceWorker, max = 12): Promise<void> { for (let n = 0; n < max; n++) if (!(await worker.runOnce())) break; }

test('PostgreSQL worker persists policies once, survives duplicate events and continues while both new-sales modes are off', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const directory = await mkdtemp(join(tmpdir(), 'st-worker-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  const order = purchase(await gateway.quote('rest', input())); await committedOrder(database.db, order);
  const worker = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0 });
  await drain(worker); assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [order.orderId])).rows[0]?.['issuance_state'], 'issued');
  await database.db.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'purchase.committed.v1',$2,$3,'{}')", [randomUUID(), order.orderId, order.tenantId]); await drain(worker);
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM policies')).rows[0]?.['count'], 1); assert.equal(simulator.state('rest').submitCalls, 1);
  const policy = (await database.db.query('SELECT document_key,data FROM policies')).rows[0]; assert.ok(policy); assert.equal((await readFile(join(directory, String(policy['document_key'])))).subarray(0, 5).toString(), '%PDF-');
});

test('PostgreSQL timeout reconciliation and asynchronous group polling issue without repeating submission or fabricating cash receipt', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const directory = await mkdtemp(join(tmpdir(), 'st-reconcile-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'rest', 'timeout_after_acceptance'); const rest = purchase(await gateway.quote('rest', input())); await committedOrder(database.db, rest);
  const worker = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0 }); await worker.runOnce();
  assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [rest.orderId])).rows[0]?.['issuance_state'], 'external_outcome_unknown');
  await drain(worker); assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [rest.orderId])).rows[0]?.['issuance_state'], 'issued'); assert.equal(simulator.state('rest').submitCalls, 1);
  await reset(simulator, 'soap', 'timeout_after_acceptance'); const group = purchase(await gateway.quote('soap', input('PRD-07'))); await committedOrder(database.db, group, true); await drain(worker);
  const row = (await database.db.query('SELECT issuance_state,payment_state FROM orders WHERE id=$1', [group.orderId])).rows[0]; assert.equal(row?.['issuance_state'], 'issued'); assert.equal(row?.['payment_state'], 'credit'); assert.equal(simulator.state('soap').submitCalls, 1);
});

test('confirmed issuance survives PDF provider outage and a leased sending attempt recovers without a second submit', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const directory = await mkdtemp(join(tmpdir(), 'st-document-outage-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'rest', 'document_outage'); const order = purchase(await gateway.quote('rest', input())); await committedOrder(database.db, order);
  const worker = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0, maxAttempts: 20 }); await drain(worker, 4);
  assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [order.orderId])).rows[0]?.['issuance_state'], 'issued'); assert.equal((await database.db.query('SELECT document_key FROM policies WHERE order_id=$1', [order.orderId])).rows[0]?.['document_key'], null);
  const restore = await fetch(`${simulator.url}/_test/carriers/rest/fault`, { method: 'POST', body: JSON.stringify({ scenario: 'normal' }), headers: { 'content-type': 'application/json' } }); assert.equal(restore.status, 200); await drain(worker);
  assert.ok((await database.db.query('SELECT document_key FROM policies WHERE order_id=$1', [order.orderId])).rows[0]?.['document_key']);
  const crashed = purchase(await gateway.quote('rest', input())); await committedOrder(database.db, crashed); const accepted = await gateway.submit(crashed, `purchase:${crashed.orderId}:submit:v1`);
  await database.db.query("INSERT INTO submissions(id,order_id,carrier_id,state,data) VALUES($1,$2,'rest','sending','{}')", [randomUUID(), crashed.orderId]);
  await database.db.query("UPDATE outbox SET state='processing',locked_until=now()-interval '1 second' WHERE aggregate_id=$1 AND event_type='purchase.committed.v1'", [crashed.orderId]);
  assert.ok(accepted.reference); const restarted = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0 }); await drain(restarted);
  assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [crashed.orderId])).rows[0]?.['issuance_state'], 'issued'); assert.equal(simulator.state('rest').submitCalls, 2, 'one submit for each of the two distinct orders');
});

test('wallet v2 commitment reconciles an unknown acceptance once without inventing a provider cash receipt', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const directory = await mkdtemp(join(tmpdir(), 'st-wallet-v2-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'rest', 'timeout_after_acceptance'); const order = purchase(await gateway.quote('rest', input()));
  await database.db.query("INSERT INTO orders(id,tenant_id,owner_id,product_id,carrier_id,state,payment_state,commitment_kind,issuance_state,quote_snapshot) VALUES($1,$2,$3,$4,$5,'committed','wallet','verified_wallet_allocation','pending',$6)", [order.orderId, order.tenantId, order.ownerId, order.productId, order.carrierId, order.quoteSnapshot]);
  await database.db.query("INSERT INTO outbox(id,event_type,aggregate_id,tenant_id,payload) VALUES($1,'purchase.committed.v2',$2,$3,$4)", [randomUUID(), order.orderId, order.tenantId, { ...order, commitmentKind: 'verified_wallet_allocation', walletSpendId: randomUUID() }]);
  const worker = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0 }); await worker.runOnce();
  assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [order.orderId])).rows[0]?.['issuance_state'], 'external_outcome_unknown'); await drain(worker);
  const row = (await database.db.query('SELECT issuance_state,payment_state,commitment_kind FROM orders WHERE id=$1', [order.orderId])).rows[0];
  assert.equal(row?.['issuance_state'], 'issued'); assert.equal(row?.['payment_state'], 'wallet'); assert.equal(row?.['commitment_kind'], 'verified_wallet_allocation'); assert.equal(simulator.state('rest').submitCalls, 1);
  assert.equal((await database.db.query("SELECT state FROM outbox WHERE aggregate_id=$1 AND event_type='purchase.committed.v2'", [order.orderId])).rows[0]?.['state'], 'delivered');
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM payment_receipts')).rows[0]?.['count'], 0);
});

test('signed carrier with neither status nor idempotency holds ambiguous acceptance and never automatically replays', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const simulator = await createSimulatorServer({ clock }); t.after(() => simulator.close()); const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock });
  await reset(simulator, 'signed', 'timeout_after_acceptance'); const order = purchase(await gateway.quote('signed', input())); await committedOrder(database.db, order); const worker = new IssuanceWorker(database.db, gateway, { retryDelayMs: 0 });
  await drain(worker); await drain(worker); assert.equal(simulator.state('signed').submitCalls, 1); assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [order.orderId])).rows[0]?.['issuance_state'], 'external_outcome_unknown');
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM policies')).rows[0]?.['count'], 0); await assert.rejects(worker.reconcile(order.orderId), /no authoritative status/);
});

test('durable signed callback inbox deduplicates and late pending observation cannot downgrade issued', async t => {
  const database = await isolatedDatabase(); t.after(database.close); const directory = await mkdtemp(join(tmpdir(), 'st-callback-')); t.after(() => rm(directory, { recursive: true, force: true }));
  let worker: IssuanceWorker | undefined;
  const receiver = createServer(async (request, response) => { try { const chunks: Buffer[] = []; for await (const b of request) chunks.push(Buffer.isBuffer(b) ? b : Buffer.from(b)); const headers = Object.fromEntries(Object.entries(request.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])); assert.ok(worker); const result = await worker.observeCallback(Buffer.concat(chunks).toString(), headers); response.writeHead(202, { 'content-type': 'application/json' }); response.end(JSON.stringify(result)); } catch { response.writeHead(422); response.end(); } });
  await new Promise<void>(resolveListen => receiver.listen(0, '127.0.0.1', resolveListen)); t.after(() => new Promise<void>(resolveClose => { receiver.closeAllConnections(); receiver.close(() => resolveClose()); }));
  const address = receiver.address(); assert.ok(address && typeof address !== 'string'); const simulator = await createSimulatorServer({ clock, callbackUrl: `http://127.0.0.1:${address.port}/callbacks/sim-signed` }); t.after(() => simulator.close());
  const gateway = createCarrierRegistry({ baseUrl: simulator.url, mode: 'sandbox', clock }); await reset(simulator, 'signed', 'duplicate_callback'); const order = purchase(await gateway.quote('signed', input())); await committedOrder(database.db, order);
  worker = new IssuanceWorker(database.db, gateway, { objectStorageDir: directory, retryDelayMs: 0 }); await worker.runOnce();
  const deadline = Date.now() + 5000; while (Date.now() < deadline && (await database.db.query('SELECT count(*)::int AS count FROM inbox')).rows[0]?.['count'] !== 2) await new Promise(done => setTimeout(done, 20));
  await drain(worker);
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM inbox')).rows[0]?.['count'], 2); assert.equal((await database.db.query('SELECT count(*)::int AS count FROM policies')).rows[0]?.['count'], 1);
  const s = (await database.db.query('SELECT * FROM submissions WHERE order_id=$1', [order.orderId])).rows[0]; assert.ok(s);
  const late = JSON.stringify({ event_id: 'late-pending', sequence: 1, client_ref: order.orderId, receipt_ref: s['external_ref'], issuance: 'pending', occurred_at: now.toISOString() });
  await worker.observeCallback(late, signedHeaders('POST', '/callbacks/sim-signed', late, SYNTHETIC_SIGNING_KEY, clock)); await drain(worker); assert.equal((await database.db.query('SELECT issuance_state FROM orders WHERE id=$1', [order.orderId])).rows[0]?.['issuance_state'], 'issued');
  const fault = await fetch(`${simulator.url}/_test/carriers/signed/fault`, { method: 'POST', body: JSON.stringify({ scenario: 'callback_before_ack' }), headers: { 'content-type': 'application/json' } }); assert.equal(fault.status, 200);
  const beforeAck = purchase(await gateway.quote('signed', input())); await committedOrder(database.db, beforeAck); await worker.runOnce();
  assert.equal((await database.db.query('SELECT count(*)::int AS count FROM inbox')).rows[0]?.['count'], 5, 'both early callbacks are durably accepted before synchronous submit returns'); await drain(worker); assert.equal((await database.db.query('SELECT count(*)::int AS count FROM policies')).rows[0]?.['count'], 2);
});
