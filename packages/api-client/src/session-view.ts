/** Minimal session transport for shared public chrome; no quote/form/CSV/finance dependencies. */
export type JsonObject = Record<string, unknown>;
export type Context = { id: string; label: string; kind: string; roles: string[] };
export type Actor = { userId: string; contextId: string; contextKind: string; roles: string[]; permissions: string[]; permissionRevision: number; label: string };
export type Session = { actor: Actor; csrfToken: string; contexts: Context[] };
export function contextHome(actor: Pick<Actor,'contextKind'|'contextId'|'roles'>): string { if(actor.contextKind==='organization')return `/org/${actor.contextId}`;if(actor.contextKind==='seller')return '/seller';if(actor.contextKind==='carrier')return '/partner';if(actor.contextKind==='platform')return actor.roles.includes('operator')?'/ops':'/admin';return '/account'; }
export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly fields: JsonObject = {}) { super(message); this.name = 'ApiError'; }
}
function isJsonObject(value: unknown): value is JsonObject { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function object(value: unknown): JsonObject { return isJsonObject(value) ? value : {}; }
export function string(value: unknown, fallback = ''): string { return typeof value === 'string' ? value : fallback; }
export function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
export function number(value: unknown, fallback = 0): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
export function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
export function unwrap(value: unknown): JsonObject { const data = object(value); return typeof data.data === 'object' && !Array.isArray(data.data) && data.data !== null ? object(data.data) : data; }
export function parseSession(value: unknown): Session {
  const data = unwrap(value); const a = object(data.actor ?? data.user); const actor: Actor = { userId: string(a.userId, string(a.id)), contextId: string(a.contextId), contextKind: string(a.contextKind, 'personal'), roles: strings(a.roles), permissions: strings(a.permissions), permissionRevision: number(a.permissionRevision), label: string(a.label, string(a.name, string(a.contact, 'حساب من'))) };
  if (!actor.userId) throw new ApiError('unauthenticated', 401, 'برای ادامه وارد حساب خود شوید.');
  return { actor, csrfToken: string(data.csrfToken), contexts: array(data.contexts).map(value => { const c = object(value); return { id: string(c.id, string(c.contextId)), label: string(c.label, string(c.name, 'حساب شخصی')), kind: string(c.kind, string(c.contextKind, 'personal')), roles: strings(c.roles) }; }) };
}
