export type ContextKind = 'personal' | 'organization' | 'carrier' | 'seller' | 'platform';
export type Channel = 'b2c' | 'corporate' | 'commercial' | 'reseller' | 'b2b2c';
export interface Actor { userId:string; contextId:string; contextKind:ContextKind; roles:string[]; permissions:string[]; sessionId:string; permissionRevision:number }
export interface Money { amount:string; currency:'IRR'; unit:'rial' }
export class DomainError extends Error {
  constructor(readonly code:string, readonly status:number, message:string) { super(message); this.name='DomainError'; }
}
export function authorize(actor:Actor, permission:string):void {
  if (!actor.permissions.some(p => p==='*' || p===permission || (p.endsWith('.*') && permission.startsWith(p.slice(0,-1))))) throw new DomainError('forbidden_action',403,'This action is not permitted in the active context.');
}
export function money(amount:string):Money {
  if (!/^(0|[1-9][0-9]{0,23})$/.test(amount)) throw new DomainError('invalid_money',422,'Money must be a nonnegative integer string.');
  return {amount,currency:'IRR',unit:'rial'};
}
export function requireObject(value:unknown):Record<string,unknown> {
  if (!value || typeof value!=='object' || Array.isArray(value)) throw new DomainError('validation_failed',422,'A JSON object is required.');
  return value as Record<string,unknown>;
}
export function text(input:Record<string,unknown>,key:string,max=200):string {
  const v=input[key]; if(typeof v!=='string'||!v.trim()||v.length>max)throw new DomainError('validation_failed',422,`Invalid ${key}.`); return v.trim();
}
export function assertUuid(value:string):string { if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new DomainError('validation_failed',422,'Invalid identifier.'); return value; }
export interface Clock { now():Date }
export const systemClock:Clock={now:()=>new Date()};
