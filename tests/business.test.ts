import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { Database } from '@st/database';
import { DomainError, type Actor } from '@st/contracts';
import { BusinessService, catalog, customerBusinessOperations, migrateBusiness, product, validateRisk, syntheticPngBase64, type Resource } from '@st/business';

const db = new Database();
const now = new Date('2026-10-28T10:00:00Z');
const customerPermissions = ['business.read', ...customerBusinessOperations.map(operation => `business.${operation}`)];
function actor(kind: Actor['contextKind'] = 'personal', contextId = randomUUID(), permissions = customerPermissions): Actor {
  const userId = randomUUID();
  return { userId, contextId, contextKind: kind, roles: [kind === 'platform' ? 'operator' : 'customer'], permissions, sessionId: randomUUID(), permissionRevision: 1 };
}
function command(expectedVersion?: number) { return { idempotencyKey: randomUUID(), expectedVersion }; }
function code(expected: string) { return (error: unknown) => error instanceof DomainError && error.code === expected; }
const service = new BusinessService(db, { clock: () => new Date(now) });
before(async () => { await migrateBusiness(db); });
after(async () => { await db.close(); });

test('all 24 risk schemas reject unknown fields and enforce required and semantic fields', () => {
  assert.equal(catalog().length, 24);
  for (const summary of catalog()) {
    const template = product(summary.id);
    validateRisk(template.id, template.example, now);
    assert.throws(() => validateRisk(template.id, {...template.example, injectedEmployerDiagnosis: 'forbidden'}, now), code('risk_validation_failed'));
    assert.throws(() => validateRisk(template.id, {}, now), code('risk_validation_failed'));
    assert.equal(summary.liveEnabled, false);
  }
  assert.throws(() => validateRisk('PRD-08', {...product('PRD-08').example, beneficiaries: [{ref: randomUUID(), basisPoints: 9999}]}, now), code('beneficiary_allocation_invalid'));
  assert.throws(() => validateRisk('PRD-08', {...product('PRD-08').example, birthDate: '2030-01-01'}, now), code('birth_date_invalid'));
  validateRisk('PRD-04', {...product('PRD-04').example, areaM2: '90.50'}, now);
});

test('real PostgreSQL transaction makes a repeated concurrent command one resource and rejects changed bodies', async () => {
  const owner=actor(); const key=command(); const input={subjectKind:'vehicle',label:'Synthetic vehicle',attributes:{model:'synthetic-model'}};
  const [a,b]=await Promise.all([service.execute(owner,'saveProfile',input,key),service.execute(owner,'saveProfile',input,key)]);
  assert.equal(a.id,b.id);assert.equal(a.version,1);
  await assert.rejects(service.execute(owner,'saveProfile',{...input,label:'Changed body'},key),code('idempotency_conflict'));
  const rows=await service.list(owner,'profiles');assert.equal(rows.items.length,1);
  const other=actor();await assert.rejects(service.get(other,'profiles',a.id),code('resource_not_found'));
  const switched={...owner,contextId:randomUUID(),contextKind:'organization' as const};assert.equal((await service.list(switched,'profiles')).items.length,0);
  const revoked={...owner,permissions:[]};await assert.rejects(service.execute(revoked,'saveProfile',input,key),code('forbidden_action'));
});

test('census preview preserves row errors, maker-checker and effective-period overlap constraints', async () => {
  const tenant=randomUUID(); const maker=actor('organization',tenant); const checker=actor('organization',tenant,[...customerPermissions,'business.approveEnrollmentBatch']);
  const rows=[{externalId:'EMP-001',name:'Synthetic employee',relationship:'employee',effectiveFrom:'2026-11-01',effectiveUntil:'2027-11-01'}];
  const batch=await service.execute(maker,'createEnrollmentBatch',{rows,mode:'atomic'},command());
  await assert.rejects(service.execute({...maker,permissions:[...maker.permissions,'business.approveEnrollmentBatch']},'approveEnrollmentBatch',{id:batch.id},command(1)),code('self_approval_forbidden'));
  const approved=await service.execute(checker,'approveEnrollmentBatch',{id:batch.id},command(1));assert.equal(approved.state,'approved');
  const applyKey=command(approved.version);const applied=await service.execute(maker,'applyEnrollmentBatch',{id:batch.id},applyKey);assert.equal(applied.state,'applied');
  assert.equal((await service.execute(maker,'applyEnrollmentBatch',{id:batch.id},applyKey)).id,applied.id);
  const stored=await db.query('SELECT external_id FROM business_enrollments WHERE tenant_id=$1',[tenant]);assert.equal(stored.rows.length,1);
  const second=await service.execute(maker,'createEnrollmentBatch',{rows,mode:'atomic'},command());const checked=await service.execute(checker,'approveEnrollmentBatch',{id:second.id},command(1));
  await assert.rejects(service.execute(maker,'applyEnrollmentBatch',{id:second.id},command(checked.version)),code('overlapping_enrollment'));
  const invalid=await service.execute(maker,'createEnrollmentBatch',{rows:[rows[0],{...rows[0],name:'Duplicate'}, {...rows[0],externalId:'EMP-002',diagnosis:'must not be stored'}],mode:'partial_after_approval'},command());
  assert.equal(invalid.data.validRowCount,1);assert.equal(invalid.data.invalidRowCount,2);assert.equal(JSON.stringify(invalid).includes('must not be stored'),false);
});

test('quotation preserves source versions and ownership while provider I/O is outside database transaction', async () => {
  const owner=actor();const profile=await service.execute(owner,'saveProfile',{subjectKind:'vehicle',label:'Synthetic vehicle',attributes:{}},command());
  let observedRisk: Record<string,unknown>|undefined;
  const quoteService=new BusinessService(db,{clock:()=>new Date(now),quoteGateway:{quoteAll:async input=>{observedRisk=input.risk;return{quotes:[{id:'provider-synthetic-ref',carrierId:'rest',productId:input.productId,premium:{amount:'120000',currency:'IRR',unit:'rial'},coverages:['synthetic-cover'],expiresAt:'2026-10-28T11:00:00Z',effectiveFrom:'2026-11-01',effectiveUntil:'2027-11-01',mappingVersion:'v1',synthetic:true}],failures:[]};}}});
  const application=await service.execute(owner,'createApplication',{productId:'PRD-01',answers:{...product('PRD-01').example,vehicleRef:profile.id},channel:'b2c'},command());
  const quoted=await quoteService.execute(owner,'quoteApplication',{id:application.id},command());assert.equal(quoted.state,'completed');assert.equal(observedRisk?.vehicleRef,profile.id);
  const offers=quoted.data.quotes;assert.ok(Array.isArray(offers));const offer=offers[0] as Resource;assert.equal(offer.data.applicationVersion,application.version);
  await service.execute(owner,'saveApplicationAnswers',{id:application.id,answers:{...product('PRD-01').example,vehicleRef:profile.id,usageCode:'changed-risk'}},command(application.version));
  assert.equal((await service.get(owner,'quotes',offer.id)).state,'expired');
  const foreign=actor();const attack=await service.execute(foreign,'createApplication',{productId:'PRD-01',answers:{...product('PRD-01').example,vehicleRef:profile.id},channel:'b2c'},command());
  await assert.rejects(quoteService.execute(foreign,'quoteApplication',{id:attack.id},command()),code('resource_not_found'));
});

test('private claim evidence is absent from employer and generic admin projections and assigned reads require purpose', async () => {
  const tenant=randomUUID(), employee=actor('organization',tenant),employer=actor('organization',tenant);
  const policyId=randomUUID();const claims=new BusinessService(db,{clock:()=>new Date(now),policyAccess:async(a,id)=>{if(a.userId!==employee.userId)throw new DomainError('resource_not_found',404,'Policy not found');return{id,productId:'PRD-07',state:'active',carrierId:'rest',effectiveFrom:'2026-01-01',effectiveUntil:'2026-12-31'};}});
  const claim=await claims.execute(employee,'createClaim',{policyId,incidentDate:'2026-10-20',description:'Synthetic private medical evidence',evidenceIds:[],claimKind:'health'},command());
  assert.equal((await claims.list(employer,'claims')).items.length,0);
  await assert.rejects(claims.get(employer,'claims',claim.id),code('resource_not_found'));
  const genericAdmin=actor('platform',randomUUID(),['*']);await assert.rejects(claims.get(genericAdmin,'claims',claim.id,'Synthetic audit purpose'),code('resource_not_found'));
  const assessor=actor('platform',randomUUID(),['business.read','claims.review',`claims.tenant.${tenant}`,'business.decideClaim']);
  await assert.rejects(claims.get(assessor,'claims',claim.id),code('validation_failed'));
  const detail=await claims.get(assessor,'claims',claim.id,'Review assigned synthetic claim');assert.equal(detail.data.description,'Synthetic private medical evidence');
  const queue=await claims.list(assessor,'claims');assert.equal(queue.items.some(row=>Object.hasOwn(row.data,'description')),false);
  const audit=await db.query('SELECT reason FROM business_audit WHERE resource_id=$1 AND operation=\'readSensitiveClaim\'',[claim.id]);assert.ok(audit.rows.length>0);
  const decided=await claims.execute(assessor,'decideClaim',{id:claim.id,decision:'approved',approvedAmount:{amount:'1000',currency:'IRR',unit:'rial'},reason:'Synthetic assessment only; no settlement authority'},command(claim.version));
  assert.equal(decided.state,'assessment_recorded');assert.equal(decided.data.payoutState,'not_authorized');assert.equal(decided.data.insurerDecisionConfirmed,false);
});

test('last inventory unit is reserved once across two users and cancellation restores it once', async () => {
  const manager=actor('platform',randomUUID(),['*']);const a=actor(),b=actor();
  const part=await service.execute(manager,'publishPart',{sku:'SYN-'+randomUUID(),title:'Synthetic filter',stock:1,price:{amount:'3500',currency:'IRR',unit:'rial'},compatibleModels:['synthetic-model']},command());
  const input={items:[{partId:part.id,quantity:1}],vehicleModel:'synthetic-model',address:'Synthetic delivery address'};
  const attempts=await Promise.allSettled([service.execute(a,'reserveParts',input,command()),service.execute(b,'reserveParts',input,command())]);
  const successful=attempts.filter((attempt):attempt is PromiseFulfilledResult<Resource>=>attempt.status==='fulfilled');assert.equal(successful.length,1);const order=successful[0]?.value;assert.ok(order);
  const loser=attempts.find(attempt=>attempt.status==='rejected');assert.ok(loser&&loser.status==='rejected'&&loser.reason instanceof DomainError&&loser.reason.code==='insufficient_stock');
  const winner=attempts[0]?.status==='fulfilled'?a:b;const cancelKey=command(order.version);
  await service.execute(winner,'cancelPartsOrder',{id:order.id,reason:'Synthetic cancellation'},cancelKey);await service.execute(winner,'cancelPartsOrder',{id:order.id,reason:'Synthetic cancellation'},cancelKey);
  const inventory=await db.query('SELECT available,reserved FROM business_inventory WHERE part_id=$1',[part.id]);assert.deepEqual(inventory.rows[0],{available:1,reserved:0});
});

test('a booking slot is not oversold and cancelled bookings retain exact price without a fictitious payment', async () => {
  const manager=actor('platform',randomUUID(),['*']);const user=actor();const profile=await service.execute(user,'saveProfile',{subjectKind:'vehicle',label:'Synthetic car',attributes:{}},command());
  const provider=await service.execute(manager,'registerMaintenanceProvider',{label:'Synthetic provider',location:'Synthetic test area',services:[{code:'oil',title:'Oil change',price:{amount:'5000',currency:'IRR',unit:'rial'}}]},command());
  const input={providerId:provider.id,vehicleId:profile.id,serviceCode:'oil',slot:'2026-11-01T10:00:00Z'};
  const results=await Promise.allSettled([service.execute(user,'bookMaintenance',input,command()),service.execute(user,'bookMaintenance',input,command())]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  const completed=results.find((result):result is PromiseFulfilledResult<Resource>=>result.status==='fulfilled');assert.ok(completed);assert.equal(completed.value.data.paymentState,'not_collected');
  const cancelled=await service.execute(user,'cancelBooking',{id:completed.value.id,reason:'Synthetic booking cancellation'},command(completed.value.version));assert.equal(cancelled.state,'cancelled');assert.equal(cancelled.data.refundState,'not_applicable_no_payment');
});

test('confirmed loyalty points cannot be redeemed twice or turned into cash', async () => {
  const tenant=randomUUID(), maker=actor('platform',tenant,['*']),checker=actor('platform',tenant,['*']),customer=actor();
  const reward=await service.execute(maker,'createReward',{title:'Synthetic voucher',points:100,kind:'voucher'},command());
  await assert.rejects(service.execute(maker,'createReward',{title:'Cash',points:1,kind:'cash'},command()),code('validation_failed'));
  const accrual=await service.execute(maker,'accrueLoyalty',{ownerId:customer.userId,points:100,sourceKey:'SYN-'+randomUUID()},command());
  await assert.rejects(service.execute(maker,'confirmLoyalty',{id:accrual.id,reason:'Synthetic reviewed qualifying event'},command(1)),code('self_approval_forbidden'));
  await service.execute(checker,'confirmLoyalty',{id:accrual.id,reason:'Synthetic independently reviewed event'},command(1));
  const results=await Promise.allSettled([service.execute(customer,'redeemReward',{rewardId:reward.id},command()),service.execute(customer,'redeemReward',{rewardId:reward.id},command())]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  const balance=await db.query('SELECT confirmed::text FROM business_points WHERE owner_id=$1',[customer.userId]);assert.equal(balance.rows[0]?.confirmed,'0');
});

test('missing financial referral and auction authority rejects before creating a transaction', async()=>{
  const user=actor();await assert.rejects(service.execute(user,'placeAuctionBid',{auctionId:randomUUID()},command()),code('commercial_authority_missing'));await assert.rejects(service.execute(user,'createFinancialReferral',{partnerId:randomUUID()},command()),code('commercial_authority_missing'));
});

test('inspection evidence is case-scoped, quarantined by default, independently reviewed and expires', async()=>{
  let clock=new Date(now);const inspections=new BusinessService(db,{clock:()=>new Date(clock)});const owner=actor();const reviewer=actor('platform',randomUUID(),['business.read','business.reviewInspection','evidence.review',`evidence.tenant.${owner.contextId}`]);
  const profile=await inspections.execute(owner,'saveProfile',{subjectKind:'vehicle',label:'Synthetic body-insurance vehicle',attributes:{}},command());
  let inspection=await inspections.execute(owner,'createInspection',{vehicleId:profile.id,mode:'self'},command());
  const documents:Resource[]=[];
  for(const view of ['front','rear','left','right','vin'])documents.push(await inspections.execute(owner,'uploadEvidence',{caseKind:'inspection',caseId:inspection.id,fileName:view+'.png',mimeType:'image/png',contentBase64:syntheticPngBase64},command()));
  assert.ok(documents.every(document=>document.state==='clean_synthetic'));
  const otherInspection=await inspections.execute(owner,'createInspection',{vehicleId:profile.id,mode:'self'},command());
  await assert.rejects(inspections.execute(owner,'submitInspectionEvidence',{id:otherInspection.id,documentIds:documents.map(document=>document.id),itemCodes:['front','rear','left','right','vin']},command(1)),code('resource_not_found'));
  const unknown=Buffer.concat([Buffer.from(syntheticPngBase64,'base64'),Buffer.from('unknown-not-allowlisted')]).toString('base64');
  const quarantined=await inspections.execute(owner,'uploadEvidence',{caseKind:'inspection',caseId:otherInspection.id,fileName:'unknown.png',mimeType:'image/png',contentBase64:unknown},command());assert.equal(quarantined.state,'quarantined');
  await assert.rejects(inspections.execute(owner,'submitInspectionEvidence',{id:otherInspection.id,documentIds:[quarantined.id],itemCodes:['front']},command(1)),code('evidence_quarantined'));
  const eicar=await inspections.execute(owner,'uploadEvidence',{caseKind:'inspection',caseId:otherInspection.id,fileName:'test.pdf',mimeType:'application/pdf',contentBase64:Buffer.from('%PDF-1.4 EICAR-STANDARD-ANTIVIRUS-TEST-FILE').toString('base64')},command());assert.equal(eicar.state,'rejected');
  inspection=await inspections.execute(owner,'submitInspectionEvidence',{id:inspection.id,documentIds:documents.map(document=>document.id),itemCodes:['front','rear','left','right','vin']},command(inspection.version));
  const assignedOwner={...owner,permissions:[...owner.permissions,'business.reviewInspection','evidence.review',`evidence.tenant.${owner.contextId}`]};
  await assert.rejects(inspections.execute(assignedOwner,'reviewInspection',{id:inspection.id,decision:'approved',reason:'Synthetic reviewer cannot approve own evidence'},command(inspection.version)),code('self_approval_forbidden'));
  inspection=await inspections.execute(reviewer,'reviewInspection',{id:inspection.id,decision:'retake_required',retakeItems:['front'],reason:'Synthetic front view requires a new capture'},command(inspection.version));
  const retake=await inspections.execute(owner,'uploadEvidence',{caseKind:'inspection',caseId:inspection.id,fileName:'front-retake.png',mimeType:'image/png',contentBase64:syntheticPngBase64},command());
  inspection=await inspections.execute(owner,'submitInspectionEvidence',{id:inspection.id,documentIds:[retake.id],itemCodes:['front']},command(inspection.version));
  assert.equal((inspection.data.documentIds as unknown[]).length,5);
  const decisions=await Promise.allSettled([inspections.execute(reviewer,'reviewInspection',{id:inspection.id,decision:'approved',reason:'Synthetic independent inspection acceptance'},command(inspection.version)),inspections.execute(reviewer,'reviewInspection',{id:inspection.id,decision:'approved',reason:'Concurrent synthetic inspection acceptance'},command(inspection.version))]);
  const result=decisions.find((value):value is PromiseFulfilledResult<Resource>=>value.status==='fulfilled');assert.ok(result);assert.equal(decisions.filter(value=>value.status==='fulfilled').length,1);inspection=result.value;
  const bodyApp=await inspections.execute(owner,'createApplication',{productId:'PRD-02',answers:{...product('PRD-02').example,vehicleRef:profile.id,inspectionRef:inspection.id},channel:'b2c'},command());
  await inspections.checkPurchaseReadiness(owner,bodyApp.id);
  const first=documents[0];assert.ok(first);await assert.rejects(inspections.downloadEvidence(actor(),first.id),code('resource_not_found'));
  await assert.rejects(inspections.downloadEvidence(actor('platform',randomUUID(),['*']),first.id,'Generic admin cannot read files'),code('resource_not_found'));
  const download=await inspections.downloadEvidence(reviewer,first.id,'Assigned synthetic evidence review');assert.equal(download.bytes.toString('base64'),syntheticPngBase64);
  clock=new Date(now.getTime()+25*3600_000);
  await assert.rejects(inspections.checkPurchaseReadiness(owner,bodyApp.id),code('inspection_required'));
  await assert.rejects(inspections.downloadEvidence(owner,first.id),code('evidence_expired'));
});

test('an unresolved or stale underwriting decision blocks purchase and cannot activate coverage',async()=>{
  const owner=actor();const reviewer=actor('platform',randomUUID(),['business.read','business.reviewUnderwriting','evidence.review',`evidence.tenant.${owner.contextId}`]);
  const profile=await service.execute(owner,'saveProfile',{subjectKind:'vehicle',label:'Synthetic underwriting vehicle',attributes:{}},command());
  const answers={...product('PRD-01').example,vehicleRef:profile.id};const application=await service.execute(owner,'createApplication',{productId:'PRD-01',answers,channel:'b2c'},command());
  const underwriting=await service.execute(owner,'createUnderwritingCase',{applicationId:application.id},command());await assert.rejects(service.checkPurchaseReadiness(owner,application.id),code('underwriting_required'));
  const decision=await service.execute(reviewer,'reviewUnderwriting',{id:underwriting.id,decision:'accepted',reason:'Synthetic carrier-rule-v1 independent acceptance'},command(underwriting.version));assert.equal(decision.data.coverageActivated,false);assert.equal(decision.data.syntheticDecision,true);
  await service.checkPurchaseReadiness(owner,application.id);
  await service.execute(owner,'saveApplicationAnswers',{id:application.id,answers:{...answers,usageCode:'changed-underwritten-risk'}},command(application.version));await assert.rejects(service.checkPurchaseReadiness(owner,application.id),code('underwriting_required'));
  const revised=await service.execute(owner,'createUnderwritingCase',{applicationId:application.id},command());
  const requested=await service.execute(reviewer,'reviewUnderwriting',{id:revised.id,decision:'evidence_required',evidenceCodes:['synthetic-declaration'],reason:'Synthetic rule requires a clean declaration'},command(revised.version));
  await assert.rejects(service.execute(reviewer,'reviewUnderwriting',{id:requested.id,decision:'accepted',reason:'Attempted approval without requested evidence'},command(requested.version)),code('required_evidence_missing'));
  const wrong=await service.execute(owner,'uploadEvidence',{caseKind:'underwriting',caseId:requested.id,fileName:'wrong.png',mimeType:'image/png',contentBase64:syntheticPngBase64,evidenceCode:'other-document'},command());
  await assert.rejects(service.execute(owner,'submitUnderwritingEvidence',{id:requested.id,documentIds:[wrong.id]},command(requested.version)),code('required_evidence_missing'));
  const correct=await service.execute(owner,'uploadEvidence',{caseKind:'underwriting',caseId:requested.id,fileName:'declaration.png',mimeType:'image/png',contentBase64:syntheticPngBase64,evidenceCode:'synthetic-declaration'},command());
  const submitted=await service.execute(owner,'submitUnderwritingEvidence',{id:requested.id,documentIds:[correct.id]},command(requested.version));
  await service.execute(reviewer,'reviewUnderwriting',{id:submitted.id,decision:'accepted',reason:'Synthetic current-risk evidence reviewed independently'},command(submitted.version));
  await service.checkPurchaseReadiness(owner,application.id);
});

test('opaque signed pagination is bound to actor, context, revision and filters',async()=>{
  const owner=actor();const paging=new BusinessService(db,{clock:()=>new Date(now),cursorSecret:'synthetic-only-paging-key-for-integration-test'});
  for(let index=0;index<3;index++)await paging.execute(owner,'saveProfile',{subjectKind:'vehicle',label:'Paging vehicle '+index,attributes:{}},command());
  const first=await paging.list(owner,'profiles',{limit:1,search:'Paging'});assert.ok(first.nextCursor);assert.equal(first.items.length,1);
  const second=await paging.list(owner,'profiles',{limit:1,search:'Paging',cursor:first.nextCursor});assert.equal(second.items.length,1);assert.notEqual(first.items[0]?.id,second.items[0]?.id);
  await assert.rejects(paging.list({...owner,contextId:randomUUID()},'profiles',{limit:1,search:'Paging',cursor:first.nextCursor}),code('cursor_invalid'));
  await assert.rejects(paging.list({...owner,userId:randomUUID()},'profiles',{limit:1,search:'Paging',cursor:first.nextCursor}),code('cursor_invalid'));
  await assert.rejects(paging.list({...owner,permissionRevision:2},'profiles',{limit:1,search:'Paging',cursor:first.nextCursor}),code('cursor_invalid'));
  await assert.rejects(paging.list(owner,'profiles',{limit:1,search:'Changed',cursor:first.nextCursor}),code('cursor_invalid'));
  await assert.rejects(paging.list(owner,'profiles',{limit:1,search:'Paging',cursor:first.nextCursor+'x'}),code('cursor_invalid'));
});
