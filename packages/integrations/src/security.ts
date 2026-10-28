import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { IntegrationError } from './contracts.js';

export const SYNTHETIC_SIGNING_KEY = 'synthetic-only-key-v1-not-for-live-use';
export const sha256 = (bytes: string | Buffer): string => createHash('sha256').update(bytes).digest('hex');
export function canonicalSignature(method: string, path: string, timestamp: string, nonce: string, body: string | Buffer, secret: string): string {
  return createHmac('sha256', secret).update([method.toUpperCase(), path, timestamp, nonce, sha256(body)].join('\n'), 'utf8').digest('hex');
}
export function signedHeaders(method: string, path: string, body: string, secret: string, clock: () => Date = () => new Date()): Record<string, string> {
  const timestamp = clock().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nonce = randomUUID();
  return { 'X-Sim-Key-Id': 'sim-key-v1', 'X-Sim-Timestamp': timestamp, 'X-Sim-Nonce': nonce, 'X-Sim-Signature': canonicalSignature(method, path, timestamp, nonce, body, secret) };
}
export function verifySignedBytes(method: string, path: string, body: string | Buffer, headers: Record<string, string | undefined>, secret: string, clock: () => Date, seenNonces?: Map<string, number>): void {
  const get = (name: string): string | undefined => headers[name] ?? headers[name.toLowerCase()];
  const key = get('X-Sim-Key-Id'); const timestamp = get('X-Sim-Timestamp'); const nonce = get('X-Sim-Nonce'); const signature = get('X-Sim-Signature');
  if (key !== 'sim-key-v1' || !timestamp || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp) || !nonce || !/^[A-Za-z0-9-]{1,64}$/.test(nonce) || !signature || !/^[a-f0-9]{64}$/.test(signature)) throw new IntegrationError('invalid_signature', 'authentication', false, 'Signature metadata is invalid');
  const now = clock().getTime(); const instant = Date.parse(timestamp);
  if (!Number.isFinite(instant) || Math.abs(now - instant) > 300_000) throw new IntegrationError('stale_signature', 'authentication', false, 'Signature timestamp is outside the accepted window');
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(canonicalSignature(method, path, timestamp, nonce, body, secret), 'hex'))) throw new IntegrationError('invalid_signature', 'authentication', false, 'Signature validation failed');
  if (seenNonces) {
    for (const [n, expiry] of seenNonces) if (expiry < now) seenNonces.delete(n);
    if (seenNonces.has(nonce)) throw new IntegrationError('nonce_replayed', 'authentication', false, 'Nonce was already consumed');
    seenNonces.set(nonce, now + 600_000);
  }
}
export function validateSandboxBaseUrl(input: string): URL {
  const url = new URL(input);
  const configured = process.env['ST_SANDBOX_SERVICE_HOSTS'] ?? '';
  const hosts = configured ? configured.split(',').map(host => host.trim()) : [];
  if (hosts.length > 8 || hosts.some(host => !/^[a-z][a-z0-9-]{0,62}$/.test(host)) || configured && process.env['APP_MODE'] !== 'sandbox') throw new IntegrationError('destination_denied', 'authentication', false, 'Service-host configuration requires an explicit trusted sandbox deployment');
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost', ...hosts].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new IntegrationError('destination_denied', 'authentication', false, 'Sandbox destinations must be loopback or an explicitly configured local service HTTP origin');
  return url;
}
export function isoDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T12:00:00Z')) || new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) !== value) throw new IntegrationError('invalid_date', 'mapping_error', false, 'Expected an ISO Gregorian date');
  return value;
}
const persianFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
export function persianDate(value: string): string {
  const date = isoDate(value);
  const fields = persianFormatter.formatToParts(new Date(date + 'T12:00:00Z'));
  const part = (name: Intl.DateTimeFormatPartTypes): string => fields.find(p => p.type === name)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function gregorianDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new IntegrationError('invalid_persian_date', 'mapping_error', false, 'Invalid Persian date');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7)); const day = Number(value.slice(8, 10));
  if (year < 1300 || year > 1600) throw new IntegrationError('unsupported_calendar_range', 'mapping_error', false, 'Persian date is outside the tested range');
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new IntegrationError('invalid_persian_date', 'mapping_error', false, 'Persian date does not exist');
  const offset = (month <= 6 ? (month - 1) * 31 : 186 + (month - 7) * 30) + day - 1;
  const start = Date.UTC(year + 621, 2, 18, 12) + offset * 86_400_000;
  for (let n = 0; n < 8; n++) {
    const candidate = new Date(start + n * 86_400_000).toISOString().slice(0, 10);
    if (persianDate(candidate) === value) return candidate;
  }
  throw new IntegrationError('invalid_persian_date', 'mapping_error', false, 'Persian date does not exist');
}
export function rialAmount(value: unknown): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,23})$/.test(value)) throw new IntegrationError('invalid_amount', 'mapping_error', false, 'Expected an unsigned integer monetary string');
  return value;
}
export function rialToToman(value: string): string {
  const amount = BigInt(rialAmount(value));
  if (amount % 10n !== 0n) throw new IntegrationError('indivisible_currency_unit', 'mapping_error', false, 'Rial amount cannot be represented exactly in integer toman');
  return (amount / 10n).toString();
}
