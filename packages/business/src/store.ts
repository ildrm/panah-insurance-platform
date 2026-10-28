import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { QueryResultRow } from 'pg';
import { DomainError, type Actor } from '@st/contracts';
import type { Database, SqlClient } from '@st/database';
import { object, stable, text, uuid, type Input } from './validation';

export interface Resource { id: string; kind: string; state: string; version: number; data: Input; createdAt: string; updatedAt: string }
export interface RecordRow extends QueryResultRow { id: string; kind: string; tenant_id: string; owner_id: string; carrier_id: string | null; visibility: string; state: string; version: number; data: Input; created_at: Date; updated_at: Date }
export interface CommandOptions { idempotencyKey: string; expectedVersion?: number }
export interface Runtime { clock: () => Date; id: () => string; cursorSecret:string }
export function permitted(actor: Actor, permission: string): boolean {
  return actor.permissions.some(grant => grant === '*' || grant === permission || grant.endsWith('.*') && permission.startsWith(grant.slice(0, -1)));
}
export function requirePermission(actor: Actor, permission: string): void { if (!permitted(actor, permission)) throw new DomainError('forbidden_action', 403, 'This action is not permitted'); }
export function resource(row: RecordRow): Resource { return { id: row.id, kind: row.kind, state: row.state, version: row.version, data: row.data, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() }; }
export async function migrateBusiness(db: Database): Promise<void> { const directory=resolve(__dirname,'../migrations');for(const file of readdirSync(directory).filter(file=>/^[0-9]{3}_[a-z_]+\.sql$/u.test(file)).sort())await db.query(readFileSync(resolve(directory,file),'utf8')); }
export class BusinessStore {
  readonly runtime: Runtime;
  constructor(readonly db: Database, runtime?: Partial<Runtime>) { this.runtime = { clock: runtime?.clock ?? (() => new Date()), id: runtime?.id ?? randomUUID, cursorSecret:runtime?.cursorSecret??process.env.ST_CURSOR_SECRET??randomBytes(32).toString('base64url') }; if(this.runtime.cursorSecret.length<32)throw new Error('ST_CURSOR_SECRET must contain at least32 characters'); }
  private cursorScope(actor:Actor,kind:string,search:string|null,state:string|null):string{return createHash('sha256').update(stable({userId:actor.userId,contextId:actor.contextId,permissionRevision:actor.permissionRevision,kind,search,state,sort:'id:asc'})).digest('hex');}
  private encodeCursor(id:string,scope:string):string{const payload=Buffer.from(JSON.stringify({v:1,id,scope,expiresAt:this.runtime.clock().getTime()+900_000})).toString('base64url');return payload+'.'+createHmac('sha256',this.runtime.cursorSecret).update(payload).digest('base64url');}
  private decodeCursor(value:string,scope:string):string{
    try{if(value.length>2048)throw new Error('length');const parts=value.split('.');if(parts.length!==2)throw new Error('shape');const payload=parts[0],signature=parts[1];if(payload===undefined||signature===undefined||!/^[A-Za-z0-9_-]+$/u.test(payload)||!/^[A-Za-z0-9_-]+$/u.test(signature))throw new Error('encoding');const expected=createHmac('sha256',this.runtime.cursorSecret).update(payload).digest();const received=Buffer.from(signature,'base64url');if(received.length!==expected.length||!timingSafeEqual(received,expected))throw new Error('signature');const decoded=object(JSON.parse(Buffer.from(payload,'base64url').toString('utf8')));if(decoded.v!==1||decoded.scope!==scope||typeof decoded.expiresAt!=='number'||decoded.expiresAt<=this.runtime.clock().getTime())throw new Error('scope');return uuid(decoded.id,'cursor');}catch{throw new DomainError('cursor_invalid',422,'Restart pagination after the context, permission or filter changed');}
  }
  async read(tx: SqlClient, actor: Actor, kind: string, id: string, lock = false, purpose?: string): Promise<RecordRow> {
    const found = await tx.query<RecordRow>(`SELECT * FROM business_records WHERE id=$1 AND kind=$2 ${lock ? 'FOR UPDATE' : ''}`, [uuid(id, 'id'), kind]);
    const row = found.rows[0];
    const ownContext = row !== undefined && row.tenant_id === actor.contextId && (row.owner_id === actor.userId || row.visibility === 'organization');
    const staff = actor.contextKind === 'platform' && permitted(actor, 'business.operate');
    const assignedClaim = row !== undefined && actor.permissions.includes('claims.review') && (actor.permissions.includes(`claims.tenant.${row.tenant_id}`) || actor.contextKind === 'carrier' && row.carrier_id !== null && actor.permissions.includes(`claims.carrier.${row.carrier_id}`));
    const assignedEvidence = row !== undefined && ['inspections','underwriting','documents'].includes(row.kind) && actor.permissions.includes('evidence.review') && actor.permissions.includes(`evidence.tenant.${row.tenant_id}`);
    if (row === undefined || !(ownContext || row.visibility === 'public' || staff || assignedClaim || assignedEvidence)) throw new DomainError('resource_not_found', 404, 'Resource not found');
    if (row.kind === 'claims') {
      const ownClaim = row.owner_id === actor.userId && row.tenant_id === actor.contextId;
      if (!ownClaim && !assignedClaim) throw new DomainError('resource_not_found', 404, 'Resource not found');
      const reason = ownClaim ? 'self-service claim access' : text(purpose, 'sensitive access purpose', 1000, 10);
      await tx.query('INSERT INTO business_audit(id,tenant_id,actor_id,operation,resource_id,version,reason,created_at) VALUES($1,$2,$3,\'readSensitiveClaim\',$4,$5,$6,$7)', [this.runtime.id(), row.tenant_id, actor.userId, row.id, row.version, reason, this.runtime.clock().toISOString()]);
    }
    return row;
  }
  assertVersion(row: RecordRow, options: CommandOptions): void { if (options.expectedVersion === undefined || row.version !== options.expectedVersion) throw new DomainError('version_conflict', 409, 'Reload the latest resource version before changing it'); }
  async create(tx: SqlClient, actor: Actor, kind: string, state: string, data: Input, visibility: 'private' | 'organization' | 'public' = 'private', carrierId: string | null = null): Promise<RecordRow> {
    const now = this.runtime.clock().toISOString();
    const rows = await tx.query<RecordRow>('INSERT INTO business_records(id,kind,tenant_id,owner_id,state,data,visibility,carrier_id,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *', [this.runtime.id(), kind, actor.contextId, actor.userId, state, data, visibility, carrierId, now]);
    const row = rows.rows[0]; if (row === undefined) throw new Error('Business insert returned no row'); return row;
  }
  async update(tx: SqlClient, row: RecordRow, state: string, data: Input): Promise<RecordRow> {
    const result = await tx.query<RecordRow>('UPDATE business_records SET state=$2,data=$3,version=version+1,updated_at=$4 WHERE id=$1 AND version=$5 RETURNING *', [row.id, state, data, this.runtime.clock().toISOString(), row.version]);
    const updated = result.rows[0]; if (updated === undefined) throw new DomainError('version_conflict', 409, 'Resource changed concurrently'); return updated;
  }
  async run(actor: Actor, operation: string, input: Input, options: CommandOptions, callback: (tx: SqlClient) => Promise<RecordRow>): Promise<Resource> {
    const key = text(options.idempotencyKey, 'Idempotency-Key', 128, 16);
    const digest = createHash('sha256').update(stable(input)).digest('hex');
    return this.db.transaction(async tx => {
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${actor.contextId}:${actor.userId}:${operation}:${key}`]);
      const previous = await tx.query<{request_hash: string; result: Resource}>('SELECT request_hash,result FROM business_idempotency WHERE tenant_id=$1 AND actor_id=$2 AND operation=$3 AND key=$4', [actor.contextId, actor.userId, operation, key]);
      const old = previous.rows[0];
      if (old !== undefined) {
        if (old.request_hash !== digest) throw new DomainError('idempotency_conflict', 409, 'An idempotency key cannot be reused with changed input');
        // An old command result is not a lasting disclosure grant after role or
        // relationship revocation. Reauthorize before returning its snapshot.
        await this.read(tx, actor, old.result.kind, old.result.id, false, typeof input.reason === 'string' ? input.reason : undefined);
        return old.result;
      }
      const row = await callback(tx); const output = resource(row); const now = this.runtime.clock().toISOString();
      await tx.query('INSERT INTO business_audit(id,tenant_id,actor_id,operation,resource_id,version,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [this.runtime.id(), actor.contextId, actor.userId, operation, row.id, row.version, typeof input.reason === 'string' ? input.reason.slice(0, 1000) : null, now]);
      await tx.query('INSERT INTO business_events(id,tenant_id,aggregate_id,aggregate_version,event_type,payload,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [this.runtime.id(), actor.contextId, row.id, row.version, `business.${operation}.v1`, { resourceId: row.id, resourceVersion: row.version, kind: row.kind }, now]);
      await tx.query('INSERT INTO business_idempotency(tenant_id,actor_id,operation,key,request_hash,result,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [actor.contextId, actor.userId, operation, key, digest, output, now]);
      return output;
    });
  }
  async get(actor: Actor, kind: string, id: string, purpose?: string): Promise<Resource> { requirePermission(actor, 'business.read'); return resource(await this.read(this.db, actor, kind, id, false, purpose)); }
  async list(actor: Actor, kind: string, options: { limit?: number; cursor?: string; search?: string; state?: string } = {}): Promise<{items: Resource[]; nextCursor: string | null; asOf: string}> {
    requirePermission(actor, 'business.read');
    const limit = Math.min(100, Math.max(1, options.limit ?? 25));
    if (!Number.isSafeInteger(limit)) throw new DomainError('validation_failed', 422, 'Invalid limit');
    const search = options.search ? text(options.search, 'search', 120) : null;
    const scope=this.cursorScope(actor,kind,search,options.state??null);
    const cursor = options.cursor ? this.decodeCursor(options.cursor,scope) : null;
    const staff = actor.contextKind === 'platform' && permitted(actor, 'business.operate');
    const claims = kind === 'claims';
    const assignedTenants = actor.permissions.filter(grant=>grant.startsWith('claims.tenant.')).map(grant=>grant.slice('claims.tenant.'.length));
    const result = await this.db.query<RecordRow>(`SELECT * FROM business_records WHERE kind=$1 AND (($2::boolean AND NOT $8::boolean) OR ($8::boolean AND $9::boolean AND tenant_id::text=ANY($11::text[])) OR visibility='public' OR (tenant_id=$3 AND (owner_id=$4 OR (visibility='organization' AND NOT $8::boolean)))) AND ($5::uuid IS NULL OR id>$5) AND ($6::text IS NULL OR data->>'label' ILIKE '%'||$6||'%' OR data->>'title' ILIKE '%'||$6||'%' OR data->>'subject' ILIKE '%'||$6||'%') AND ($7::text IS NULL OR state=$7) ORDER BY id LIMIT $10`, [kind, staff, actor.contextId, actor.userId, cursor, search, options.state ?? null, claims, actor.permissions.includes('claims.review'), limit + 1, assignedTenants]);
    const visible = result.rows.slice(0, limit);
    const lastId=visible[visible.length-1]?.id;
    return { items: visible.map(row=>claims ? {...resource(row),data:{policyId:row.data.policyId,claimKind:row.data.claimKind,publicStatus:row.state,advisoryOnly:row.data.advisoryOnly}} : resource(row)), nextCursor: result.rows.length > limit&&lastId!==undefined ? this.encodeCursor(lastId,scope) : null, asOf: this.runtime.clock().toISOString() };
  }
}
