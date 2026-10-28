import { DomainError } from '@st/contracts';

export type Input = Record<string, unknown>;
function isInput(value: unknown): value is Input { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function object(value: unknown, label = 'input'): Input {
  if (!isInput(value)) throw new DomainError('validation_failed', 422, `${label} must be an object`);
  return value;
}
export function text(value: unknown, field: string, max = 200, min = 1): string {
  if (typeof value !== 'string') throw new DomainError('validation_failed', 422, `${field} must be text`);
  const result = value.normalize('NFC').trim();
  if (result.length < min || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result)) throw new DomainError('validation_failed', 422, `${field} has invalid length or characters`);
  return result;
}
export function integer(value: unknown, field: string, min = 0, max = 1_000_000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new DomainError('validation_failed', 422, `${field} must be an integer in range`);
  return value;
}
export function uuid(value: unknown, field: string): string {
  const result = text(value, field, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(result)) throw new DomainError('validation_failed', 422, `${field} must be a UUID`);
  return result.toLowerCase();
}
export function date(value: unknown, field: string): string {
  const result = text(value, field, 10);
  const parsed = new Date(result + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(result) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new DomainError('validation_failed', 422, `${field} must be a Gregorian ISO date`);
  return result;
}
export function array(value: unknown, field: string, max = 100, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new DomainError('validation_failed', 422, `${field} has invalid item count`);
  return value;
}
export function oneOf<T extends string>(value: unknown, field: string, choices: readonly T[]): T {
  const v = text(value, field, 100);
  const match = choices.find(choice => choice === v);
  if (match === undefined) throw new DomainError('validation_failed', 422, `${field} is not supported`);
  return match;
}
export function keys(input: Input, allowed: string[]): void {
  const unexpected = Object.keys(input).find(key => !allowed.includes(key));
  if (unexpected !== undefined) throw new DomainError('validation_failed', 422, `Unexpected field ${unexpected}`);
}
export interface Money { amount: string; currency: 'IRR'; unit: 'rial' }
export function money(value: unknown, field = 'money', allowZero = false): Money {
  const input = object(value, field); keys(input, ['amount', 'currency', 'unit']);
  if (typeof input.amount !== 'string' || !/^(0|[1-9][0-9]{0,23})$/u.test(input.amount) || input.currency !== 'IRR' || input.unit !== 'rial') throw new DomainError('validation_failed', 422, `${field} requires an exact integer rial amount`);
  if (!allowZero && BigInt(input.amount) === 0n) throw new DomainError('validation_failed', 422, `${field} must be positive`);
  return { amount: input.amount, currency: 'IRR', unit: 'rial' };
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => JSON.stringify(key) + ':' + stable(item)).join(',') + '}';
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new DomainError('validation_failed', 422, 'Undefined values are not JSON input');
  return serialized;
}
