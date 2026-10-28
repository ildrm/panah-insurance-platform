import type { Database, SqlClient } from '@st/database';
import { DomainError, type Actor } from '@st/contracts';
import { catalog, product, validateRisk } from './catalog';
import { BusinessStore, permitted, requirePermission, resource, type CommandOptions, type RecordRow, type Resource, type Runtime } from './store';
import { array, date, integer, keys, money, object, oneOf, text, uuid, type Input, type Money } from './validation';
import { EvidenceWorkflow } from './evidence';
export { syntheticPngBase64 } from './evidence';
export { catalog, product, validateRisk } from './catalog';
export { migrateBusiness } from './store';
export type { Resource, CommandOptions } from './store';
export interface CarrierQuote { id: string; carrierId: string; productId: string; premium: Money; coverages: string[]; expiresAt: string; effectiveFrom: string; effectiveUntil: string; mappingVersion: string; synthetic: true }
export interface QuoteInput { applicationId: string; productId: string; risk: Input; channel: string; tenantId: string; effectiveFrom?: string; effectiveUntil?: string }
export interface BusinessOptions extends Partial<Runtime> {
  quoteGateway?: { quoteAll(input: QuoteInput, carrierIds?: ('rest' | 'soap' | 'signed')[]): Promise<{quotes: CarrierQuote[]; failures: unknown[]}> };
  policyAccess?: (actor: Actor, id: string) => Promise<{id: string; carrierId?: string; productId: string; state: string; effectiveFrom?:string; effectiveUntil?:string}>;
  checkAdmission?: (actor: Actor, operation: string, input: Input) => Promise<void>;
}
export const businessOperations = [
  'saveProfile', 'createApplication', 'saveApplicationAnswers', 'quoteApplication',
  'createEnrollmentBatch', 'approveEnrollmentBatch', 'applyEnrollmentBatch',
  'createClaim', 'requestClaimEvidence', 'decideClaim', 'requestPolicyChange', 'startRenewal',
  'createSupportTicket', 'replySupportTicket', 'resolveSupportTicket',
  'publishContent', 'createCampaign', 'reservePromotion', 'createReferral', 'qualifyReferral',
  'accrueLoyalty', 'confirmLoyalty', 'redeemReward', 'createReward',
  'registerMaintenanceProvider', 'bookMaintenance', 'completeBooking', 'cancelBooking',
  'publishPart', 'reserveParts', 'fulfillParts', 'requestPartsReturn', 'cancelPartsOrder', 'approvePartsReturn',
  'saveVehicle', 'subscribeVehicleAlerts', 'requestVehicleInquiry', 'createListing', 'placeAuctionBid', 'createFinancialReferral'
  ,'createInspection','uploadEvidence','submitInspectionEvidence','reviewInspection','createUnderwritingCase','submitUnderwritingEvidence','reviewUnderwriting'
] as const;
export type BusinessOperation = typeof businessOperations[number];
export const customerBusinessOperations = businessOperations.filter(operation => !['approveEnrollmentBatch','publishContent','createCampaign','qualifyReferral','accrueLoyalty','confirmLoyalty','createReward','registerMaintenanceProvider','publishPart','completeBooking','fulfillParts','approvePartsReturn','requestClaimEvidence','decideClaim','resolveSupportTicket','reviewInspection','reviewUnderwriting'].includes(operation));
export const operatorBusinessOperations = businessOperations.filter(operation => !customerBusinessOperations.includes(operation));
export const businessKinds = ['profiles','applications','quotes','quote_sessions','enrollment','claims','service_requests','support','content','campaigns','promotions','referrals','loyalty','rewards','redemptions','providers','bookings','parts','parts_orders','vehicles','alert_subscriptions','vehicle_inquiries','listings','bids','financial_referrals','inspections','underwriting','documents'] as const;
const admissionOperations = new Set(['createApplication','quoteApplication','createEnrollmentBatch','bookMaintenance','reserveParts','createListing','placeAuctionBid','createFinancialReferral','reservePromotion']);
const managerOperations = new Set(['publishContent','createCampaign','qualifyReferral','accrueLoyalty','confirmLoyalty','createReward','registerMaintenanceProvider','publishPart','completeBooking','fulfillParts','approvePartsReturn','requestClaimEvidence','decideClaim','resolveSupportTicket']);
export class BusinessService {
  private readonly store: BusinessStore;
  private readonly evidence: EvidenceWorkflow;
  constructor(private readonly db: Database, private readonly options: BusinessOptions = {}) { this.store = new BusinessStore(db, options); this.evidence=new EvidenceWorkflow(this.store); }
  catalog() { return catalog(); }
  product(id: string) { return product(id); }
  list(actor: Actor, kind: string, options?: {limit?: number; cursor?: string; search?: string; state?: string}) { oneOf(kind, 'kind', businessKinds); return this.store.list(actor, kind, options); }
  get(actor: Actor, kind: string, id: string, purpose?: string) { oneOf(kind, 'kind', businessKinds); return this.store.get(actor, kind, id, purpose); }
  downloadEvidence(actor:Actor,id:string,purpose?:string){requirePermission(actor,'business.read');return this.evidence.download(actor,id,purpose);}
  async checkPurchaseReadiness(actor:Actor,applicationId:string):Promise<void>{
    const application=await this.store.read(this.db,actor,'applications',uuid(applicationId,'applicationId'));
    return this.assertPurchaseReady(this.db,{tenantId:application.tenant_id,ownerId:application.owner_id,applicationId:application.id,applicationVersion:application.version,productId:text(application.data.productId,'productId',6)},this.store.runtime.clock());
  }
  async assertPurchaseReady(tx:SqlClient,scope:{tenantId:string;ownerId:string;applicationId:string;applicationVersion:number;productId:string},at:Date):Promise<void>{
    const found=await tx.query<RecordRow>('SELECT * FROM business_records WHERE id=$1 AND kind=\'applications\' AND tenant_id=$2 AND owner_id=$3 FOR SHARE',[scope.applicationId,scope.tenantId,scope.ownerId]);const application=found.rows[0];
    if(application===undefined)throw new DomainError('resource_not_found',404,'Application not found');
    if(application.version!==scope.applicationVersion||application.data.productId!==scope.productId)throw new DomainError('application_changed',409,'The accepted risk version has changed');
    const answers=validateRisk(scope.productId,application.data.answers,at);
    const refs:unknown[]=[];for(const key of ['vehicleRef','motorcycleRef','insuredRef','patientRef','propertyRef','deviceRef','locationRef','insuredPartyRef'])if(answers[key]!==undefined)refs.push(answers[key]);
    for(const key of ['memberRefs','travelerRefs','siteRefs','contractorPartyRefs','locationRefs'])if(Array.isArray(answers[key]))refs.push(...answers[key]);
    const ids=[...new Set(refs.map(value=>uuid(value,'insured subject reference')))];
    if(ids.length>0){const subjects=await tx.query('SELECT id FROM business_records WHERE id=ANY($1::uuid[]) AND kind=\'profiles\' AND tenant_id=$2 AND owner_id=$3',[ids,scope.tenantId,scope.ownerId]);if(subjects.rows.length!==ids.length)throw new DomainError('insured_authority_required',403,'A referenced insured subject is not authorized in this purchase snapshot');}
    if(answers.organizationRef!==undefined&&answers.organizationRef!==scope.tenantId)throw new DomainError('organization_mismatch',403,'Risk belongs to another organization');
    if(['PRD-07','PRD-24'].includes(scope.productId)){const batchId=uuid(scope.productId==='PRD-07'?answers.censusBatchRef:answers.scheduleBatchRef,'censusBatchRef');const batches=await tx.query<RecordRow>('SELECT * FROM business_records WHERE id=$1 AND kind=\'enrollment\' AND tenant_id=$2 FOR SHARE',[batchId,scope.tenantId]);if(!batches.rows[0]||!['approved','applied'].includes(batches.rows[0].state))throw new DomainError('census_not_approved',409,'An approved census snapshot is required');}
    if(scope.productId==='PRD-02'){
      const inspections=await tx.query<RecordRow>('SELECT * FROM business_records WHERE id=$1 AND kind=\'inspections\' AND tenant_id=$2 AND owner_id=$3 FOR SHARE',[uuid(answers.inspectionRef,'inspectionRef'),scope.tenantId,scope.ownerId]);const inspection=inspections.rows[0];
      if(inspection===undefined||inspection.state!=='approved'||inspection.data.vehicleId!==answers.vehicleRef||typeof inspection.data.validUntil!=='string'||new Date(inspection.data.validUntil).getTime()<=at.getTime())throw new DomainError('inspection_required',409,'Current vehicle-bound approved inspection is required by the local synthetic body plan');
    }
    const cases=await tx.query<RecordRow>('SELECT * FROM business_records WHERE kind=\'underwriting\' AND tenant_id=$1 AND data->>\'applicationId\'=$2 FOR SHARE',[scope.tenantId,application.id]);
    const current=cases.rows.filter(row=>row.data.applicationVersion===application.version);
    if(cases.rows.length>0&&(current.length===0||current.some(row=>row.state!=='accepted')))throw new DomainError('underwriting_required',409,'The current risk revision has unresolved underwriting');
  }
  private organization(actor: Actor): void { if (actor.contextKind !== 'organization') throw new DomainError('organization_required', 403, 'Select an authorized organization context'); }
  private async policy(actor: Actor, value: unknown) {
    const policyId = uuid(value, 'policyId');
    if (this.options.policyAccess === undefined) throw new DomainError('dependency_unavailable', 503, 'Policy authorization service is unavailable');
    return this.options.policyAccess(actor, policyId);
  }
  async execute(actor: Actor, operation: string, value: unknown, command: CommandOptions): Promise<Resource> {
    const name = oneOf(operation, 'operation', businessOperations); const input = object(value);
    requirePermission(actor, `business.${name}`);
    if (managerOperations.has(name)) requirePermission(actor, name === 'decideClaim' || name === 'requestClaimEvidence' ? 'claims.review' : 'business.manage');
    if (admissionOperations.has(name)) await this.options.checkAdmission?.(actor, name, input);
    if (name === 'quoteApplication') return this.quoteApplication(actor, input, command);
    if (name === 'createClaim') return this.createClaim(actor, input, command);
    if (name === 'requestPolicyChange') return this.requestPolicyChange(actor, input, command);
    if (name === 'startRenewal') return this.startRenewal(actor, input, command);
    return this.store.run(actor, name, input, command, async tx => {
      switch (name) {
        case 'saveProfile': return this.saveProfile(tx, actor, input);
        case 'saveVehicle': return this.saveVehicle(tx, actor, input);
        case 'createApplication': return this.createApplication(tx, actor, input);
        case 'saveApplicationAnswers': return this.saveApplicationAnswers(tx, actor, input, command);
        case 'createEnrollmentBatch': return this.createEnrollmentBatch(tx, actor, input);
        case 'approveEnrollmentBatch': return this.approveEnrollmentBatch(tx, actor, input, command);
        case 'applyEnrollmentBatch': return this.applyEnrollmentBatch(tx, actor, input, command);
        case 'requestClaimEvidence': return this.reviewClaim(tx, actor, input, command, false);
        case 'decideClaim': return this.reviewClaim(tx, actor, input, command, true);
        case 'createSupportTicket': return this.createSupportTicket(tx, actor, input);
        case 'replySupportTicket': return this.replySupportTicket(tx, actor, input, command);
        case 'resolveSupportTicket': return this.resolveSupportTicket(tx, actor, input, command);
        case 'publishContent': return this.publishContent(tx, actor, input);
        case 'createCampaign': return this.createCampaign(tx, actor, input);
        case 'reservePromotion': return this.reservePromotion(tx, actor, input);
        case 'createReferral': return this.createReferral(tx, actor, input);
        case 'qualifyReferral': return this.qualifyReferral(tx, actor, input, command);
        case 'createReward': return this.createReward(tx, actor, input);
        case 'accrueLoyalty': return this.accrueLoyalty(tx, actor, input);
        case 'confirmLoyalty': return this.confirmLoyalty(tx, actor, input, command);
        case 'redeemReward': return this.redeemReward(tx, actor, input);
        case 'registerMaintenanceProvider': return this.registerProvider(tx, actor, input);
        case 'bookMaintenance': return this.bookMaintenance(tx, actor, input);
        case 'completeBooking': return this.completeBooking(tx, actor, input, command);
        case 'cancelBooking': return this.cancelBooking(tx, actor, input, command);
        case 'publishPart': return this.publishPart(tx, actor, input);
        case 'reserveParts': return this.reserveParts(tx, actor, input);
        case 'fulfillParts': return this.fulfillParts(tx, actor, input, command);
        case 'requestPartsReturn': return this.requestPartsReturn(tx, actor, input, command);
        case 'cancelPartsOrder': return this.cancelPartsOrder(tx, actor, input, command);
        case 'approvePartsReturn': return this.approvePartsReturn(tx, actor, input, command);
        case 'subscribeVehicleAlerts': return this.subscribeAlerts(tx, actor, input);
        case 'requestVehicleInquiry': return this.requestVehicleInquiry(tx, actor, input);
        case 'createListing': return this.createListing(tx, actor, input);
        case 'placeAuctionBid': return this.placeAuctionBid(tx, actor, input);
        case 'createFinancialReferral': return this.financialReferral(tx, actor, input);
        case 'createInspection': return this.evidence.createInspection(tx,actor,input);
        case 'uploadEvidence': return this.evidence.upload(tx,actor,input);
        case 'submitInspectionEvidence': return this.evidence.submitInspection(tx,actor,input,command);
        case 'reviewInspection': return this.evidence.reviewInspection(tx,actor,input,command);
        case 'createUnderwritingCase': return this.evidence.createUnderwriting(tx,actor,input);
        case 'submitUnderwritingEvidence': return this.evidence.submitUnderwriting(tx,actor,input,command);
        case 'reviewUnderwriting': return this.evidence.reviewUnderwriting(tx,actor,input,command);
      }
    });
  }
  private saveProfile(tx: SqlClient, actor: Actor, input: Input) {
    keys(input, ['subjectKind','label','attributes']);
    const subjectKind = oneOf(input.subjectKind, 'subjectKind', ['person','vehicle','property','device'] as const);
    const attributes = object(input.attributes ?? {}, 'attributes');
    if (Buffer.byteLength(JSON.stringify(attributes)) > 16_384) throw new DomainError('validation_failed', 422, 'Profile attributes exceed the permitted size');
    return this.store.create(tx, actor, 'profiles', 'active', {subjectKind, label: text(input.label,'label'), attributes});
  }
  private async assertReferences(tx: SqlClient, actor: Actor, answers: Input, productId: string): Promise<void> {
    for (const key of ['vehicleRef','motorcycleRef','insuredRef','patientRef','propertyRef','deviceRef','locationRef','insuredPartyRef']) if (answers[key] !== undefined) await this.store.read(tx, actor, 'profiles', uuid(answers[key], key));
    for (const key of ['memberRefs','travelerRefs','siteRefs','contractorPartyRefs','locationRefs']) if (Array.isArray(answers[key])) for (const id of answers[key]) await this.store.read(tx, actor, 'profiles', uuid(id, key));
    if (answers.organizationRef !== undefined && answers.organizationRef !== actor.contextId) throw new DomainError('organization_mismatch', 403, 'Risk organization does not match the active buyer context');
    if (['PRD-07','PRD-24'].includes(productId)) {
      this.organization(actor); const ref = productId === 'PRD-07' ? answers.censusBatchRef : answers.scheduleBatchRef;
      const batch = await this.store.read(tx, actor, 'enrollment', uuid(ref, 'scheduleBatchRef'));
      if (!['approved','applied'].includes(batch.state)) throw new DomainError('census_not_approved', 422, 'Group risk requires an approved census snapshot');
    }
  }
  private createApplication(tx: SqlClient, actor: Actor, input: Input) {
    keys(input, ['productId','answers','channel']); const id = text(input.productId,'productId',6); const template = product(id);
    const channel = oneOf(input.channel,'channel',['b2c','corporate','commercial','reseller','b2b2c'] as const);
    if (!template.channels.includes(channel)) throw new DomainError('channel_unavailable',409,'This product is not offered in the selected channel');
    if (channel !== 'b2c' && !(channel === 'reseller' && actor.contextKind === 'seller')) this.organization(actor);
    const answers = object(input.answers ?? {}, 'answers');
    if (Buffer.byteLength(JSON.stringify(answers)) > 32_768) throw new DomainError('validation_failed',422,'Risk answers exceed the permitted size');
    const known = new Set(Object.keys(template.schema.properties));
    if (Object.keys(answers).some(key => !known.has(key))) throw new DomainError('risk_validation_failed',422,'The draft contains unknown risk fields');
    return this.store.create(tx,actor,'applications','draft',{productId:id,answers,channel,riskSchemaVersion:template.schemaVersion,synthetic:true});
  }
  private async saveApplicationAnswers(tx: SqlClient, actor: Actor, input: Input, command: CommandOptions) {
    keys(input,['id','answers']); const row=await this.store.read(tx,actor,'applications',uuid(input.id,'id'),true); this.store.assertVersion(row,command);
    if (!['draft','quoted'].includes(row.state)) throw new DomainError('invalid_state',409,'Application cannot be edited in this state');
    const id=text(row.data.productId,'productId',6);const answers=object(input.answers,'answers'); const template=product(id);
    if (Object.keys(answers).some(key=>!Object.hasOwn(template.schema.properties,key))) throw new DomainError('risk_validation_failed',422,'Unknown risk field');
    if (Buffer.byteLength(JSON.stringify(answers))>32_768)throw new DomainError('validation_failed',422,'Risk answers exceed the permitted size');
    await tx.query("UPDATE business_records SET state='expired',version=version+1,updated_at=$2 WHERE kind='quotes' AND data->>'applicationId'=$1 AND state='valid'",[row.id,this.store.runtime.clock().toISOString()]);
    return this.store.update(tx,row,'draft',{...row.data,answers});
  }
  private async quoteApplication(actor: Actor, input: Input, command: CommandOptions) {
    keys(input,['id','carrierIds']);const id=uuid(input.id,'id');const application=await this.store.read(this.db,actor,'applications',id);
    if (this.options.quoteGateway===undefined)throw new DomainError('dependency_unavailable',503,'Carrier simulator gateway is unavailable');
    const productId=text(application.data.productId,'productId',6);const answers=validateRisk(productId,application.data.answers,this.store.runtime.clock());
    await this.assertReferences(this.db,actor,answers,productId);
    const carrierIds=input.carrierIds===undefined?undefined:array(input.carrierIds,'carrierIds',3,1).map(value=>oneOf(value,'carrierId',['rest','soap','signed'] as const));
    let carrierRisk=answers;
    if(['PRD-07','PRD-24'].includes(productId)){
      const batch=await this.store.read(this.db,actor,'enrollment',uuid(productId==='PRD-07'?answers.censusBatchRef:answers.scheduleBatchRef,'censusBatchRef'));
      carrierRisk={...answers,memberCount:integer(batch.data.validRowCount,'memberCount',1,20_000),censusRef:batch.id,censusVersion:batch.version};
    }
    const output=await this.options.quoteGateway.quoteAll({applicationId:id,productId,risk:carrierRisk,channel:text(application.data.channel,'channel',20),tenantId:actor.contextId},carrierIds);
    return this.store.run(actor,'quoteApplication',input,command,async tx=>{
      const latest=await this.store.read(tx,actor,'applications',id,true);
      if(latest.version!==application.version)throw new DomainError('version_conflict',409,'Risk changed while providers were quoting');
      const quotes:Resource[]=[];
      for(const offer of output.quotes){money(offer.premium);const row=await this.store.create(tx,actor,'quotes','valid',{...offer,applicationId:id,applicationVersion:latest.version,riskSnapshot:answers});quotes.push(resource(row));}
      return this.store.create(tx,actor,'quote_sessions',quotes.length>0?'completed':'unavailable',{applicationId:id,applicationVersion:latest.version,quotes,failures:output.failures,partial:output.failures.length>0,synthetic:true});
    });
  }
  private createEnrollmentBatch(tx: SqlClient, actor: Actor, input: Input) {
    this.organization(actor);keys(input,['rows','mode']);const mode=oneOf(input.mode,'mode',['atomic','partial_after_approval'] as const);
    const supplied=array(input.rows,'rows',20_000,1);const seen=new Set<string>();const rows:Input[]=[];const errors:Input[]=[];
    for(const [index,value] of supplied.entries()){
      try{
        const row=object(value,'row');keys(row,['externalId','name','relationship','effectiveFrom','effectiveUntil','beneficiaryUserId']);
        const externalId=text(row.externalId,'externalId',100);if(seen.has(externalId))throw new DomainError('duplicate_external_id',422,'Duplicate external identity');seen.add(externalId);
        const from=date(row.effectiveFrom,'effectiveFrom');const until=row.effectiveUntil===undefined?null:date(row.effectiveUntil,'effectiveUntil');if(until!==null&&until<=from)throw new DomainError('invalid_effective_period',422,'End must follow start');
        rows.push({row:index+1,externalId,name:text(row.name,'name'),relationship:oneOf(row.relationship,'relationship',['employee','dependent'] as const),effectiveFrom:from,effectiveUntil:until,beneficiaryUserId:row.beneficiaryUserId===undefined?null:uuid(row.beneficiaryUserId,'beneficiaryUserId')});
      }catch(error){if(error instanceof DomainError)errors.push({row:index+1,code:error.code,message:error.message});else throw error;}
    }
    return this.store.create(tx,actor,'enrollment','validated',{mode,rows,errors,totalRows:supplied.length,validRowCount:rows.length,invalidRowCount:errors.length,requesterId:actor.userId},'organization');
  }
  private async approveEnrollmentBatch(tx: SqlClient,actor:Actor,input:Input,command:CommandOptions){
    this.organization(actor);requirePermission(actor,'business.approveEnrollmentBatch');keys(input,['id']);const row=await this.store.read(tx,actor,'enrollment',uuid(input.id,'id'),true);this.store.assertVersion(row,command);
    if(row.state!=='validated')throw new DomainError('invalid_state',409,'Only a validated census can be approved');
    if(row.data.requesterId===actor.userId)throw new DomainError('self_approval_forbidden',403,'A different authorized person must approve the census');
    if(row.data.mode==='atomic'&&row.data.invalidRowCount!==0)throw new DomainError('census_has_errors',422,'Atomic census requires all row errors to be corrected');
    return this.store.update(tx,row,'approved',{...row.data,approverId:actor.userId,approvedAt:this.store.runtime.clock().toISOString()});
  }
  private async applyEnrollmentBatch(tx: SqlClient,actor:Actor,input:Input,command:CommandOptions){
    this.organization(actor);keys(input,['id']);const batch=await this.store.read(tx,actor,'enrollment',uuid(input.id,'id'),true);this.store.assertVersion(batch,command);
    if(batch.state!=='approved')throw new DomainError('approval_required',409,'An approved census snapshot is required');
    const rows=array(batch.data.rows,'rows',20_000);await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`census:${actor.contextId}`]);
    const overlap=await tx.query(`SELECT 1 FROM business_enrollments e JOIN jsonb_array_elements($2::jsonb) r ON e.external_id=r->>'externalId' WHERE e.tenant_id=$1 AND ((r->>'effectiveUntil')::date IS NULL OR e.effective_from<(r->>'effectiveUntil')::date) AND (e.effective_until IS NULL OR e.effective_until>(r->>'effectiveFrom')::date) LIMIT 1`,[actor.contextId,JSON.stringify(rows)]);
    if(overlap.rows.length>0)throw new DomainError('overlapping_enrollment',409,'An employee already has an overlapping effective period');
    // A bounded multi-row insert, never one write or provider call per employee.
    await tx.query(`INSERT INTO business_enrollments(id,tenant_id,external_id,effective_from,effective_until,beneficiary_user_id,name,relationship,batch_id) SELECT (x->>'id')::uuid,$1,x->>'externalId',(x->>'effectiveFrom')::date,(x->>'effectiveUntil')::date,(x->>'beneficiaryUserId')::uuid,x->>'name',x->>'relationship',$2 FROM jsonb_array_elements($3::jsonb) x`,[actor.contextId,batch.id,JSON.stringify(rows.map(value=>({...object(value),id:this.store.runtime.id()})))]);
    return this.store.update(tx,batch,'applied',{...batch.data,appliedAt:this.store.runtime.clock().toISOString(),appliedRows:rows.length});
  }
  private async createClaim(actor:Actor,input:Input,command:CommandOptions){
    keys(input,['policyId','incidentDate','description','evidenceIds','claimKind']);const policy=await this.policy(actor,input.policyId);
    if(!['active','issued'].includes(policy.state))throw new DomainError('claim_not_eligible',422,'This policy needs an eligibility review before claim intake');
    const incidentDate=date(input.incidentDate,'incidentDate');if(incidentDate>this.store.runtime.clock().toISOString().slice(0,10))throw new DomainError('incident_date_invalid',422,'An incident cannot be in the future');
    if(policy.effectiveFrom===undefined||policy.effectiveUntil===undefined)throw new DomainError('policy_coverage_unconfirmed',422,'The insurer-confirmed effective interval is required');
    if(incidentDate<date(policy.effectiveFrom,'effectiveFrom')||incidentDate>date(policy.effectiveUntil,'effectiveUntil'))throw new DomainError('incident_outside_coverage',422,'Incident date is outside the confirmed policy period');
    const evidenceIds=array(input.evidenceIds??[],'evidenceIds',30).map(id=>uuid(id,'evidenceId'));
    return this.store.run(actor,'createClaim',input,command,tx=>this.store.create(tx,actor,'claims','submitted',{policyId:policy.id,productId:policy.productId,carrierId:policy.carrierId??null,incidentDate,description:text(input.description,'description',4000),evidenceIds,claimKind:oneOf(input.claimKind,'claimKind',['health','property','liability'] as const),settlementAuthority:'not-configured',advisoryOnly:true},'private',policy.carrierId??null));
  }
  private async reviewClaim(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions,decide:boolean){
    keys(input,decide?['id','decision','reason','approvedAmount']:['id','requiredEvidence','reason']);const row=await this.store.read(tx,actor,'claims',uuid(input.id,'id'),true,text(input.reason,'reason',1000,10));this.store.assertVersion(row,command);
    if(!['submitted','evidence_required','assessing'].includes(row.state))throw new DomainError('invalid_state',409,'Claim has already been decided');
    if(row.owner_id===actor.userId)throw new DomainError('self_approval_forbidden',403,'A claimant cannot assess their own claim');
    const reason=text(input.reason,'reason',1000,10);
    if(!decide)return this.store.update(tx,row,'evidence_required',{...row.data,requiredEvidence:array(input.requiredEvidence,'requiredEvidence',30,1).map(value=>text(value,'requiredEvidence',100)),reviewerId:actor.userId,reason});
    const decision=oneOf(input.decision,'decision',['approved','rejected'] as const);
    const approvedAmount=decision==='approved'?money(input.approvedAmount,'approvedAmount'):null;
    return this.store.update(tx,row,'assessment_recorded',{...row.data,assessment:{decision,reason,approvedAmount,assessorId:actor.userId,decidedAt:this.store.runtime.clock().toISOString()},advisoryOnly:true,insurerDecisionConfirmed:false,payoutState:'not_authorized'});
  }
  private async requestPolicyChange(actor:Actor,input:Input,command:CommandOptions){
    keys(input,['policyId','changeKind','effectiveDate','reason']);const policy=await this.policy(actor,input.policyId);
    return this.store.run(actor,'requestPolicyChange',input,command,tx=>this.store.create(tx,actor,'service_requests','awaiting_carrier',{policyId:policy.id,changeKind:oneOf(input.changeKind,'changeKind',['endorsement','cancellation'] as const),effectiveDate:date(input.effectiveDate,'effectiveDate'),reason:text(input.reason,'reason',1000,10),originalPolicyState:policy.state,coverageChanged:false,refundState:'not_requested'}));
  }
  private async startRenewal(actor:Actor,input:Input,command:CommandOptions){
    keys(input,['policyId','answers','channel']);const policy=await this.policy(actor,input.policyId);const template=product(policy.productId);
    return this.store.run(actor,'startRenewal',input,command,tx=>this.store.create(tx,actor,'applications','draft',{productId:policy.productId,answers:object(input.answers??{},'answers'),channel:oneOf(input.channel??'b2c','channel',['b2c','corporate','commercial','reseller','b2b2c'] as const),previousPolicyId:policy.id,riskSchemaVersion:template.schemaVersion,freshQuoteRequired:true,synthetic:true}));
  }
  private createSupportTicket(tx:SqlClient,actor:Actor,input:Input){keys(input,['subject','description','category']);return this.store.create(tx,actor,'support','open',{subject:text(input.subject,'subject'),description:text(input.description,'description',4000),category:oneOf(input.category,'category',['policy','payment','claim','complaint','technical','automotive'] as const),messages:[],assistanceConsent:false});}
  private async replySupportTicket(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){
    keys(input,['id','message']);const row=await this.store.read(tx,actor,'support',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state==='closed')throw new DomainError('invalid_state',409,'A closed ticket must be reopened through review');
    const messages=array(row.data.messages??[],'messages',500);return this.store.update(tx,row,'open',{...row.data,messages:[...messages,{id:this.store.runtime.id(),actorId:actor.userId,body:text(input.message,'message',4000),createdAt:this.store.runtime.clock().toISOString()}]});
  }
  private async resolveSupportTicket(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){keys(input,['id','reason']);const row=await this.store.read(tx,actor,'support',uuid(input.id,'id'),true);this.store.assertVersion(row,command);return this.store.update(tx,row,'closed',{...row.data,resolution:text(input.reason,'reason',1000,10),resolvedBy:actor.userId});}
  private publishContent(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['slug','title','body']);const slug=text(input.slug,'slug',120);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug))throw new DomainError('validation_failed',422,'Slug must be lowercase words separated by hyphens');
    return this.store.create(tx,actor,'content','published',{slug,title:text(input.title,'title'),body:text(input.body,'body',30_000),format:'plain-text',approvedBy:actor.userId},'public');
  }
  private createCampaign(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['title','budget','startsAt','endsAt']);const starts=date(input.startsAt,'startsAt'),ends=date(input.endsAt,'endsAt');if(ends<=starts)throw new DomainError('invalid_effective_period',422,'Campaign end must follow start');
    return this.store.create(tx,actor,'campaigns','active',{title:text(input.title,'title'),budget:money(input.budget,'budget'),reservedAmount:'0',startsAt:starts,endsAt:ends,source:'synthetic-local-commercial-rule'},'organization');
  }
  private async reservePromotion(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['campaignId','amount','orderReference']);const row=await this.store.read(tx,actor,'campaigns',uuid(input.campaignId,'campaignId'),true);const budget=money(row.data.budget,'budget');const amount=money(input.amount,'amount');const today=this.store.runtime.clock().toISOString().slice(0,10);
    if(row.state!=='active'||text(row.data.startsAt,'startsAt')>today||text(row.data.endsAt,'endsAt')<today)throw new DomainError('promotion_expired',409,'Campaign is not currently eligible');
    const reserved=BigInt(text(row.data.reservedAmount,'reservedAmount'));if(reserved+BigInt(amount.amount)>BigInt(budget.amount))throw new DomainError('promotion_budget_exhausted',409,'Campaign has no remaining budget');
    await this.store.update(tx,row,'active',{...row.data,reservedAmount:(reserved+BigInt(amount.amount)).toString()});return this.store.create(tx,actor,'promotions','reserved',{campaignId:row.id,amount,orderReference:text(input.orderReference,'orderReference',100)});
  }
  private createReferral(tx:SqlClient,actor:Actor,input:Input){keys(input,['campaignId']);return this.store.create(tx,actor,'referrals','pending',{code:this.store.runtime.id().replaceAll('-','').slice(0,16),campaignId:input.campaignId===undefined?null:uuid(input.campaignId,'campaignId'),inviterId:actor.userId,qualifyingEvent:null});}
  private async qualifyReferral(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){
    keys(input,['id','inviteeId','qualifyingEventId']);const row=await this.store.read(tx,actor,'referrals',uuid(input.id,'id'),true);this.store.assertVersion(row,command);const inviteeId=uuid(input.inviteeId,'inviteeId');if(inviteeId===row.data.inviterId)throw new DomainError('self_referral_forbidden',422,'Referral cannot qualify for the same person');if(row.state!=='pending')throw new DomainError('invalid_state',409,'Referral has already been qualified');
    return this.store.update(tx,row,'confirmed',{...row.data,inviteeId,qualifyingEventId:uuid(input.qualifyingEventId,'qualifyingEventId'),qualifiedBy:actor.userId});
  }
  private createReward(tx:SqlClient,actor:Actor,input:Input){keys(input,['title','points','kind']);const kind=oneOf(input.kind,'kind',['voucher','badge'] as const);return this.store.create(tx,actor,'rewards','published',{title:text(input.title,'title'),points:integer(input.points,'points',1,1_000_000),kind,cashConvertible:false},'public');}
  private async accrueLoyalty(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['ownerId','points','sourceKey']);const ownerId=uuid(input.ownerId,'ownerId'),points=integer(input.points,'points',1,1_000_000),sourceKey=text(input.sourceKey,'sourceKey',128);const id=this.store.runtime.id();
    const result=await tx.query('INSERT INTO business_point_entries(id,owner_id,source_key,amount,state,created_at) VALUES($1,$2,$3,$4,\'pending\',$5) ON CONFLICT(owner_id,source_key) DO NOTHING RETURNING id',[id,ownerId,sourceKey,points,this.store.runtime.clock().toISOString()]);if(result.rows.length===0)throw new DomainError('duplicate_reward_source',409,'The qualifying source already has an accrual');
    return this.store.create(tx,actor,'loyalty','pending',{ownerId,points,sourceKey,entryId:id,createdBy:actor.userId,cashConvertible:false});
  }
  private async confirmLoyalty(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){
    keys(input,['id','reason']);const row=await this.store.read(tx,actor,'loyalty',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='pending')throw new DomainError('invalid_state',409,'Accrual is not pending');if(row.data.createdBy===actor.userId)throw new DomainError('self_approval_forbidden',403,'A separate reviewer must confirm the qualifying event');
    const ownerId=uuid(row.data.ownerId,'ownerId'),points=integer(row.data.points,'points',1);await tx.query('INSERT INTO business_points(owner_id,confirmed) VALUES($1,$2) ON CONFLICT(owner_id) DO UPDATE SET confirmed=business_points.confirmed+$2',[ownerId,points]);await tx.query("UPDATE business_point_entries SET state='confirmed' WHERE id=$1 AND state='pending'",[row.data.entryId]);return this.store.update(tx,row,'confirmed',{...row.data,confirmedBy:actor.userId,reason:text(input.reason,'reason',1000,10)});
  }
  private async redeemReward(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['rewardId']);const reward=await this.store.read(tx,actor,'rewards',uuid(input.rewardId,'rewardId'),true);if(reward.state!=='published')throw new DomainError('reward_unavailable',409,'Reward is unavailable');const points=integer(reward.data.points,'points',1);
    const updated=await tx.query('UPDATE business_points SET confirmed=confirmed-$2 WHERE owner_id=$1 AND confirmed-reserved>=$2 RETURNING confirmed',[actor.userId,points]);if(updated.rows.length===0)throw new DomainError('insufficient_points',409,'There are not enough confirmed points');
    const redemption=await this.store.create(tx,actor,'redemptions','redeemed',{rewardId:reward.id,points,title:reward.data.title,kind:reward.data.kind,cashConvertible:false});await tx.query("INSERT INTO business_point_entries(id,owner_id,source_key,amount,state,created_at) VALUES($1,$2,$3,$4,'redeemed',$5)",[this.store.runtime.id(),actor.userId,`redemption:${redemption.id}`,-points,this.store.runtime.clock().toISOString()]);return redemption;
  }
  private registerProvider(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['label','services','location']);const services=array(input.services,'services',20,1).map(value=>{const service=object(value);keys(service,['code','title','price']);return{code:text(service.code,'code',60),title:text(service.title,'title'),price:money(service.price,'price')};});
    if(new Set(services.map(service=>service.code)).size!==services.length)throw new DomainError('validation_failed',422,'Provider service codes must be unique');
    return this.store.create(tx,actor,'providers','published',{label:text(input.label,'label'),services,location:text(input.location,'location',300),synthetic:true,authority:'local-simulator-only'},'public');
  }
  private async bookMaintenance(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['providerId','serviceCode','slot','vehicleId']);const vehicle=await this.store.read(tx,actor,'profiles',uuid(input.vehicleId,'vehicleId'));if(vehicle.data.subjectKind!=='vehicle')throw new DomainError('vehicle_required',422,'Select an authorized vehicle');
    const provider=await this.store.read(tx,actor,'providers',uuid(input.providerId,'providerId'));if(provider.state!=='published')throw new DomainError('provider_unavailable',409,'Provider is not accepting bookings');
    const serviceCode=text(input.serviceCode,'serviceCode',60),slot=text(input.slot,'slot',40);const instant=new Date(slot);if(!Number.isFinite(instant.getTime())||instant.getTime()<=this.store.runtime.clock().getTime())throw new DomainError('slot_invalid',422,'Appointment must be a future timestamp with timezone');
    if(!/(Z|[+-]\d{2}:\d{2})$/u.test(slot))throw new DomainError('slot_invalid',422,'Appointment timezone must be explicit');
    const selected=array(provider.data.services,'services',20).map(value=>object(value)).find(service=>service.code===serviceCode);if(selected===undefined)throw new DomainError('service_unavailable',422,'Provider does not offer this service');
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`booking:${provider.id}:${serviceCode}:${instant.toISOString()}`]);const available=await tx.query('SELECT booking_id FROM business_slot_reservations WHERE provider_id=$1 AND service_code=$2 AND slot=$3',[provider.id,serviceCode,instant.toISOString()]);if(available.rows.length>0)throw new DomainError('slot_taken',409,'This appointment is already reserved');
    const booking=await this.store.create(tx,actor,'bookings','reserved',{providerId:provider.id,providerLabel:provider.data.label,serviceCode,slot:instant.toISOString(),vehicleId:vehicle.id,price:money(selected.price),paymentState:'not_collected',fulfillmentState:'awaiting_provider',synthetic:true});await tx.query('INSERT INTO business_slot_reservations(provider_id,service_code,slot,booking_id) VALUES($1,$2,$3,$4)',[provider.id,serviceCode,instant.toISOString(),booking.id]);return booking;
  }
  private async completeBooking(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){keys(input,['id','reason','outcome']);const row=await this.store.read(tx,actor,'bookings',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='reserved')throw new DomainError('invalid_state',409,'Only a reserved booking can be completed');const outcome=oneOf(input.outcome,'outcome',['completed','provider_no_show','customer_no_show'] as const);return this.store.update(tx,row,outcome,{...row.data,fulfillmentState:outcome,completionReason:text(input.reason,'reason',1000,10),completedBy:actor.userId,settlementState:outcome==='completed'?'awaiting_approved_settlement':'disputed'});}
  private async cancelBooking(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){keys(input,['id','reason']);const row=await this.store.read(tx,actor,'bookings',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='reserved')throw new DomainError('invalid_state',409,'A completed booking requires dispute review');await tx.query('DELETE FROM business_slot_reservations WHERE booking_id=$1',[row.id]);return this.store.update(tx,row,'cancelled',{...row.data,cancellationReason:text(input.reason,'reason',1000,5),refundState:'not_applicable_no_payment'});}
  private async publishPart(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['sku','title','stock','price','compatibleModels']);const compatibleModels=array(input.compatibleModels,'compatibleModels',100,1).map(value=>text(value,'vehicleModel',100));
    const row=await this.store.create(tx,actor,'parts','published',{sku:text(input.sku,'sku',80),title:text(input.title,'title'),price:money(input.price),compatibleModels,synthetic:true},'public');await tx.query('INSERT INTO business_inventory(part_id,available,reserved) VALUES($1,$2,0)',[row.id,integer(input.stock,'stock',0,100_000)]);return row;
  }
  private async reserveParts(tx:SqlClient,actor:Actor,input:Input){
    keys(input,['items','vehicleModel','address']);const supplied=array(input.items,'items',20,1);const items=supplied.map(value=>{const item=object(value);keys(item,['partId','quantity']);return{partId:uuid(item.partId,'partId'),quantity:integer(item.quantity,'quantity',1,100)};});
    if(new Set(items.map(item=>item.partId)).size!==items.length)throw new DomainError('duplicate_cart_line',422,'Combine duplicate part lines');
    const vehicleModel=text(input.vehicleModel,'vehicleModel',100),address=text(input.address,'address',1000);const ids=items.map(item=>item.partId).sort();
    const stocks=await tx.query<RecordRow & {available:number;reserved:number}>('SELECT r.*,i.available,i.reserved FROM business_records r JOIN business_inventory i ON i.part_id=r.id WHERE r.id=ANY($1::uuid[]) AND r.kind=\'parts\' AND r.visibility=\'public\' ORDER BY r.id FOR UPDATE OF i',[ids]);
    const lines:Input[]=[];let amount=0n;
    for(const item of items){const part=stocks.rows.find(row=>row.id===item.partId);if(part===undefined||part.state!=='published')throw new DomainError('part_unavailable',404,'A selected part is unavailable');if(part.available<item.quantity)throw new DomainError('insufficient_stock',409,'A selected quantity is no longer available');if(!array(part.data.compatibleModels,'compatibleModels',100).includes(vehicleModel))throw new DomainError('fitment_mismatch',422,'A selected part is not approved for this vehicle model');const price=money(part.data.price);amount+=BigInt(price.amount)*BigInt(item.quantity);lines.push({partId:part.id,quantity:item.quantity,title:part.data.title,unitPrice:price,priceVersion:part.version});}
    await tx.query('UPDATE business_inventory i SET available=available-x.quantity,reserved=reserved+x.quantity FROM jsonb_to_recordset($1::jsonb) AS x("partId" uuid,quantity integer) WHERE i.part_id=x."partId"',[JSON.stringify(items)]);
    return this.store.create(tx,actor,'parts_orders','reserved',{lines,vehicleModel,address,total:{amount:amount.toString(),currency:'IRR',unit:'rial'},paymentState:'not_collected',shipmentState:'not_started',synthetic:true});
  }
  private async fulfillParts(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){
    keys(input,['id','stage','trackingReference']);const row=await this.store.read(tx,actor,'parts_orders',uuid(input.id,'id'),true);this.store.assertVersion(row,command);const stage=oneOf(input.stage,'stage',['shipped','delivered'] as const);
    if((stage==='shipped'&&row.state!=='reserved')||(stage==='delivered'&&row.state!=='shipped'))throw new DomainError('invalid_state',409,'Shipment stages must occur in order');
    if(stage==='shipped')await tx.query('UPDATE business_inventory i SET reserved=reserved-x.quantity FROM jsonb_to_recordset($1::jsonb) AS x("partId" uuid,quantity integer) WHERE i.part_id=x."partId" AND i.reserved>=x.quantity',[JSON.stringify(row.data.lines)]);
    return this.store.update(tx,row,stage,{...row.data,shipmentState:stage,trackingReference:text(input.trackingReference,'trackingReference',100),settlementState:stage==='delivered'?'awaiting_review':'held'});
  }
  private async cancelPartsOrder(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){
    keys(input,['id','reason']);const row=await this.store.read(tx,actor,'parts_orders',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='reserved')throw new DomainError('invalid_state',409,'Only an unshipped reservation may be cancelled');await tx.query('UPDATE business_inventory i SET available=available+x.quantity,reserved=reserved-x.quantity FROM jsonb_to_recordset($1::jsonb) AS x("partId" uuid,quantity integer) WHERE i.part_id=x."partId" AND i.reserved>=x.quantity',[JSON.stringify(row.data.lines)]);return this.store.update(tx,row,'cancelled',{...row.data,reason:text(input.reason,'reason',1000,5),refundState:'not_applicable_no_payment'});
  }
  private async requestPartsReturn(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){keys(input,['id','reason']);const row=await this.store.read(tx,actor,'parts_orders',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='delivered')throw new DomainError('invalid_state',409,'Only delivered parts can enter return review');return this.store.update(tx,row,'return_requested',{...row.data,returnReason:text(input.reason,'reason',1000,5),settlementState:'disputed'});}
  private async approvePartsReturn(tx:SqlClient,actor:Actor,input:Input,command:CommandOptions){keys(input,['id','reason','inspectionPassed']);const row=await this.store.read(tx,actor,'parts_orders',uuid(input.id,'id'),true);this.store.assertVersion(row,command);if(row.state!=='return_requested')throw new DomainError('invalid_state',409,'A requested return is required');if(input.inspectionPassed!==true)throw new DomainError('return_inspection_required',422,'Physical return and inspection must be confirmed');await tx.query('UPDATE business_inventory i SET available=available+x.quantity FROM jsonb_to_recordset($1::jsonb) AS x("partId" uuid,quantity integer) WHERE i.part_id=x."partId"',[JSON.stringify(row.data.lines)]);return this.store.update(tx,row,'returned',{...row.data,returnApprovedBy:actor.userId,returnInspectionReason:text(input.reason,'reason',1000,10),refundState:'not_applicable_no_payment',settlementState:'reversed'});}
  private async saveVehicle(tx:SqlClient,actor:Actor,input:Input){keys(input,['profileId','label']);const profile=await this.store.read(tx,actor,'profiles',uuid(input.profileId,'profileId'));if(profile.data.subjectKind!=='vehicle')throw new DomainError('vehicle_required',422,'Profile must be a vehicle');return this.store.create(tx,actor,'vehicles','active',{profileId:profile.id,label:text(input.label,'label'),officialStatus:'not_verified'});}
  private async subscribeAlerts(tx:SqlClient,actor:Actor,input:Input){keys(input,['vehicleId','channel','enabled']);const vehicle=await this.store.read(tx,actor,'vehicles',uuid(input.vehicleId,'vehicleId'));if(typeof input.enabled!=='boolean')throw new DomainError('validation_failed',422,'enabled must be boolean');const channel=oneOf(input.channel,'channel',['sms','push'] as const);return this.store.create(tx,actor,'alert_subscriptions',input.enabled?'enabled':'disabled',{vehicleId:vehicle.id,channel,enabled:input.enabled,paidSubscription:false,consentActor:actor.userId,deliveryProvider:'local-notification-boundary'});}
  private async requestVehicleInquiry(tx:SqlClient,actor:Actor,input:Input){keys(input,['vehicleId','inquiryKind','consent']);const vehicle=await this.store.read(tx,actor,'vehicles',uuid(input.vehicleId,'vehicleId'));if(input.consent!==true)throw new DomainError('consent_required',422,'Official inquiry requires explicit purpose consent');const inquiryKind=oneOf(input.inquiryKind,'inquiryKind',['fines','tolls','registration','inspection','license','history','municipal','transfer_tax'] as const);return this.store.create(tx,actor,'vehicle_inquiries','provider_unavailable',{vehicleId:vehicle.id,inquiryKind,consent:true,provenance:null,result:null,official:false,reason:'No authorized official-data contract is configured'});}
  private async createListing(tx:SqlClient,actor:Actor,input:Input){keys(input,['vehicleId','title','askingPrice']);const vehicle=await this.store.read(tx,actor,'vehicles',uuid(input.vehicleId,'vehicleId'));return this.store.create(tx,actor,'listings','published',{vehicleId:vehicle.id,title:text(input.title,'title'),askingPrice:money(input.askingPrice),listingOwnerId:actor.userId,auctionEnabled:false,secureTransactionEnabled:false,valuation:null,synthetic:true},'public');}
  private async placeAuctionBid(_tx:SqlClient,_actor:Actor,_input:Input):Promise<RecordRow>{throw new DomainError('commercial_authority_missing',409,'Auctions are independently disabled until a reviewed contract and dispute process are configured');}
  private financialReferral(_tx:SqlClient,_actor:Actor,_input:Input):Promise<RecordRow>{throw new DomainError('commercial_authority_missing',409,'No approved financial-referral agreement and disclosure version are configured');}
}
