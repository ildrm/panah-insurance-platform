import type {Actor} from '@st/contracts';
export type Purpose='new_sales'|'reservation_completion'|'servicing'|'partner_delivery'|'read'|'reconciliation';
export interface Scope {global?:true;productId?:string;planId?:string;carrierId?:string;organizationId?:string;regionId?:string;customerId?:string;channel?:string}
/** Internal server contract: build selectors from authorized stored records, never request-body overrides. */
export interface ControlContext extends Omit<Scope,'global'> {purpose:Purpose;environment:'sandbox'|'live';regionEvidenceRef?:string;cohortKey?:string;commitmentReference?:string;reservationReference?:string;reservationExpiresAt?:string;acceptedRevision?:number}
export interface Rule {id:string;key:string;enabled:boolean;scope:Scope;effectiveFrom:string;effectiveUntil?:string;dependencies:string[];rolloutPercent:number;regionEvidenceRef?:string;incidentRef?:string;reviewAt?:string;remediationRef?:string}
export interface RuleChange extends Omit<Rule,'id'|'dependencies'|'rolloutPercent'> {ruleId?:string;dependencies?:string[];rolloutPercent?:number}
export interface ProposalInput {changes:RuleChange[];reason:string}
export interface Decision {allowed:boolean;revision:number;capability:string;purpose:Purpose;decidedAt:string;reasonCodes:string[];requiredKeys:string[];matchedRuleIds:string[];unknownDimensions:string[]}
export interface MutationOptions {idempotencyKey:string;expectedRevision:number}
export interface ControlsOptions {cohortSecret?:string;plans?:readonly string[];carriers?:readonly string[];regions?:Readonly<Record<string,string>>}
export interface Proposal {id:string;makerId?:string;state:'proposed'|'validated'|'approved';expectedRevision:number;kind:'rules'|'rollback';payload:{changes?:Rule[];reason:string;targetRevision?:number};approvedRevision?:number}
export interface PreviewSample {context:ControlContext;asOf?:string;capability?:string}
export interface PlatformMembership extends Record<string,unknown>{permissions:string[];permission_revision:number;active:boolean;kind:Actor['contextKind']}
