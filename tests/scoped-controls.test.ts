import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {Database} from '@st/database';
import {DomainError,type Actor} from '@st/contracts';
import {ControlsService,migrateControls,permissions,type ControlContext,type RuleChange} from '../packages/controls/src';
const source=new URL(process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local');
if(!['127.0.0.1','localhost'].includes(source.hostname)||source.pathname!=='/st_local')throw new Error('Scoped-control tests require the isolated task sandbox.');
const databaseName='st_controls_fixture_'+randomUUID().replaceAll('-','');
const adminUrl=new URL(source);adminUrl.pathname='/postgres';const admin=new Database(adminUrl.toString());
const fixtureUrl=new URL(source);fixtureUrl.pathname='/'+databaseName;const db=new Database(fixtureUrl.toString());
const service=new ControlsService(db,{cohortSecret:'synthetic-control-test-secret-at-least32characters',plans:['synthetic-plan-v1'],regions:{'synthetic-north':'synthetic-regional-evidence-v1'}});
const options=async()=>({idempotencyKey:randomUUID(),expectedRevision:(await service.current(maker)).revision});
const context:ControlContext={purpose:'new_sales',environment:'sandbox',channel:'b2c',productId:'PRD-01',carrierId:'rest'};
const start='2020-01-01T00:00:00Z';
const isCode=(code:string)=>(error:unknown)=>error instanceof DomainError&&error.code===code;
let maker:Actor,checker:Actor,customer:Actor,foreign:Actor;
async function actor(kind:Actor['contextKind'],grants:string[]):Promise<Actor>{const userId=randomUUID(),contextId=randomUUID();await db.query('INSERT INTO users(id,contact,display_name) VALUES($1,$2,$3)',[userId,'synthetic-control:'+userId,'Synthetic scoped-control actor']);await db.query('INSERT INTO contexts(id,kind,label) VALUES($1,$2,$3)',[contextId,kind,'Synthetic controls context']);await db.query('INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$2,$3,$4)',[userId,contextId,[kind==='platform'?'admin':'customer'],grants]);return{userId,contextId,contextKind:kind,permissions:grants,roles:[kind==='platform'?'admin':'customer'],sessionId:randomUUID(),permissionRevision:1};}
before(async()=>{await admin.query('CREATE DATABASE "'+databaseName+'" TEMPLATE template0');for(const file of(await readdir('packages/database/migrations')).filter(file=>file.endsWith('.sql')).sort())await db.query(await readFile('packages/database/migrations/'+file,'utf8'));await migrateControls(db);maker=await actor('platform',Object.values(permissions));checker=await actor('platform',Object.values(permissions));customer=await actor('personal',[]);foreign=await actor('personal',[]);await db.query('CREATE TABLE control_test_effects(id uuid PRIMARY KEY,revision integer NOT NULL)');});
after(async()=>{await db.close();await admin.query('DROP DATABASE "'+databaseName+'"');await admin.close();});
async function propose(changes:RuleChange[]){return service.propose(maker,{changes,reason:'Synthetic scoped-control acceptance change'},await options());}
async function preview(id:string,samples:unknown[]=[{context}]){return service.preview(maker,id,samples,{idempotencyKey:randomUUID()});}
async function publish(changes:RuleChange[]){const proposal=await propose(changes);await preview(proposal.id);return service.approve(checker,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:proposal.expectedRevision,reason:'Independent synthetic configuration approval'});}
async function decision(value:ControlContext=context,capability='COM-01'){return db.transaction(tx=>service.assertCapability(tx,customer,capability,value));}
const allow=(key:string,extra:Partial<RuleChange>={}):RuleChange=>({key,enabled:true,scope:{global:true},effectiveFrom:start,...extra});
test('registry preserves74parents/24products and defaults fail closed while read/servicing retain separate purpose',async()=>{
  const catalog=service.catalog();assert.equal(catalog.capabilities.filter(row=>row.key.startsWith('feature.')).length,74);assert.equal(catalog.capabilities.filter(row=>row.key.startsWith('product.')).length,24);
  await assert.rejects(decision(),isCode('capability_disabled'));
  assert.equal((await decision({purpose:'read',environment:'sandbox'})).allowed,true);
  assert.equal((await decision({purpose:'servicing',environment:'sandbox',commitmentReference:randomUUID()})).allowed,true);
  await assert.rejects(decision({...context,environment:'live'}),isCode('live_authority_unconfigured'));
  await publish([allow('feature.COM-01.enabled'),allow('feature.INS-11.enabled'),allow('product.PRD-01.new_sales'),allow('sales.b2c')]);assert.equal((await decision()).allowed,true);
});
test('strict scopes, regional evidence, dependency cycles and mandatory-foundation changes are rejected',async()=>{
  const before=(await db.query<{count:string}>("SELECT count(*)::text FROM scoped_control_audit WHERE operation='command.denied' AND data->>'code'='mandatory_foundation'")).rows[0]!.count;
  await assert.rejects(propose([allow('feature.CHN-04.enabled',{enabled:false})]),isCode('mandatory_foundation'));
  assert.equal(BigInt((await db.query<{count:string}>("SELECT count(*)::text FROM scoped_control_audit WHERE operation='command.denied' AND data->>'code'='mandatory_foundation'")).rows[0]!.count),BigInt(before)+1n,'A rejected mutation still leaves sanitized audit evidence after rollback.');
  await assert.rejects(propose([allow('feature.COM-01.enabled',{scope:{global:true,productId:'PRD-01'}})]),isCode('invalid_control_scope'));
  await assert.rejects(propose([allow('feature.COM-01.enabled',{scope:{regionId:'unregistered-region'}})]),isCode('region_authority_not_configured'));
  await assert.rejects(propose([allow('feature.COM-01.enabled',{scope:{regionId:'synthetic-north'}})]),isCode('regional_evidence_required'));
  await assert.rejects(propose([allow('feature.COM-01.enabled',{scope:{planId:'unknown-plan'}})]),isCode('plan_authority_not_configured'));
  await assert.rejects(propose([allow('feature.INS-01.enabled',{dependencies:['feature.INS-02.enabled']}),allow('feature.INS-02.enabled',{dependencies:['feature.INS-01.enabled']})]),isCode('control_dependency_cycle'));
  await assert.rejects(propose([allow('feature.INS-04.enabled',{scope:{productId:'PRD-01'}}),allow('feature.INS-04.enabled',{enabled:false,scope:{carrierId:'rest'}})]),isCode('conflicting_control_rules'));
  await assert.rejects(service.propose(maker,{changes:[{...allow('feature.COM-01.enabled'),expression:'javascript:allow()'}],reason:'Unknown expressions must not run'},await options()),isCode('validation_failed'));
});
test('explicit broader deny defeats narrower allow and unknown matching deny selectors fail closed',async()=>{
  const current=await service.listRules(maker,{limit:100}),global=current.items.find(rule=>rule.key==='feature.COM-01.enabled')!;
  await publish([allow(global.key,{ruleId:global.id,enabled:false}),allow(global.key,{scope:{productId:'PRD-01'}})]);
  await assert.rejects(decision(),isCode('capability_disabled'));
  const nested=(await service.listRules(maker,{limit:100})).items.find(rule=>rule.key===global.key&&rule.scope.productId==='PRD-01')!;await publish([allow(global.key,{ruleId:global.id}),allow(global.key,{ruleId:nested.id})]);
  await publish([allow(global.key,{enabled:false,scope:{carrierId:'rest'}})]);
  await assert.rejects(decision(),isCode('capability_disabled'));
  await assert.rejects(decision({...context,carrierId:undefined}),isCode('control_context_incomplete'));
  assert.equal((await decision({...context,carrierId:'soap'})).allowed,true);
  const rules=await service.listRules(maker,{limit:100}),carrier=rules.items.find(rule=>rule.key===global.key&&rule.scope.carrierId==='rest')!;
  await publish([allow(global.key,{ruleId:carrier.id})]);
});
test('time windows and stable opaque cohorts preview exact decisions without activating future rules',async()=>{
  const future=new Date(Date.now()+60000).toISOString(),until=new Date(Date.now()+120000).toISOString();
  const proposal=await propose([allow('feature.COM-01.enabled',{enabled:false,scope:{planId:'synthetic-plan-v1'},effectiveFrom:future,effectiveUntil:until})]);
  const result=await preview(proposal.id,[{context:{...context,planId:'synthetic-plan-v1'},asOf:start},{context:{...context,planId:'synthetic-plan-v1'},asOf:future},{context:{...context,planId:'synthetic-plan-v1'},asOf:until}]);
  assert.deepEqual(result.decisions.map(row=>row.allowed),[true,false,true]);
  await service.approve(checker,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:proposal.expectedRevision,reason:'Synthetic future-window approval'});
  assert.equal((await decision({...context,planId:'synthetic-plan-v1'})).allowed,true);
  const cohort=await propose([allow('feature.INS-12.enabled',{rolloutPercent:50})]);const sample={context:{...context,cohortKey:'opaque-cohort-key-0000001'},capability:'INS-12'};
  const previewed=await preview(cohort.id,[sample,sample]);assert.equal(previewed.decisions[0]?.allowed,previewed.decisions[1]?.allowed);assert.ok(!JSON.stringify(previewed).includes('opaque-cohort-key-0000001'));
});
test('maker/checker, current permissions, revision and command digests govern privileged publication',async()=>{
  const initial=await options(),body={changes:[allow('feature.INS-03.enabled')],reason:'Synthetic idempotent scoped proposal'};
  const [first,duplicate]=await Promise.all([service.propose(maker,body,initial),service.propose(maker,body,initial)]);assert.equal(first.id,duplicate.id);
  await assert.rejects(service.propose(maker,{...body,reason:'Changed command input cannot reuse the key'},initial),isCode('idempotency_conflict'));
  await assert.rejects(service.approve(checker,first.id,{idempotencyKey:randomUUID(),expectedRevision:first.expectedRevision,reason:'Preview is required before approval'}),isCode('control_preview_required'));
  await preview(first.id);
  await assert.rejects(service.approve(maker,first.id,{idempotencyKey:randomUUID(),expectedRevision:first.expectedRevision,reason:'A maker cannot approve the same proposal'}),isCode('maker_checker_required'));
  await db.query('UPDATE memberships SET permissions=array_remove(permissions,$3) WHERE user_id=$1 AND context_id=$2',[checker.userId,checker.contextId,permissions.approve]);
  await assert.rejects(service.approve(checker,first.id,{idempotencyKey:randomUUID(),expectedRevision:first.expectedRevision,reason:'Stale actor grants cannot survive revocation'}),isCode('forbidden_action'));
  await db.query('UPDATE memberships SET permissions=array_append(permissions,$3) WHERE user_id=$1 AND context_id=$2',[checker.userId,checker.contextId,permissions.approve]);
  const approved=await service.approve(checker,first.id,{idempotencyKey:randomUUID(),expectedRevision:first.expectedRevision,reason:'Independent checker after current permission reload'});assert.ok(approved.revision>first.expectedRevision);
  await assert.rejects(service.current({...maker,contextId:foreign.contextId,contextKind:'personal'}),isCode('session_revoked'));
  await assert.rejects(service.current(foreign),isCode('forbidden_action'));
});
test('configuration epoch locks serialize committed effects against disables and rollback appends history',async()=>{
  const before=await service.current(maker),proposal=await propose([allow('feature.COM-01.enabled',{enabled:false,scope:{channel:'b2c'}})]);await preview(proposal.id);
  let release!:()=>void,started!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;}),locked=new Promise<void>(resolve=>{started=resolve;});const effectId=randomUUID();
  const effect=db.transaction(async tx=>{const allowed=await service.assertCapability(tx,customer,'COM-01',context);started();await held;await tx.query('INSERT INTO control_test_effects(id,revision) VALUES($1,$2)',[effectId,allowed.revision]);});await locked;
  let approved=false;const approval=service.approve(checker,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:proposal.expectedRevision,reason:'Synthetic disable racing an accepted effect'}).then(value=>{approved=true;return value;});await new Promise(resolve=>setTimeout(resolve,30));assert.equal(approved,false);release();await effect;const disabled=await approval;
  assert.equal((await db.query<{revision:number}>('SELECT revision FROM control_test_effects WHERE id=$1',[effectId])).rows[0]!.revision,before.revision);await assert.rejects(decision(),isCode('capability_disabled'));
  const rollback=await service.proposeRollback(maker,before.revision,'Audited rollback preserves historical revisions',{idempotencyKey:randomUUID(),expectedRevision:disabled.revision});await preview(rollback.id);const rolled=await service.approve(checker,rollback.id,{idempotencyKey:randomUUID(),expectedRevision:disabled.revision,reason:'Different checker approves new rollback version'});assert.equal(rolled.revision,disabled.revision+1);assert.equal((await decision()).allowed,true);
  await assert.rejects(db.query('UPDATE scoped_control_versions SET reason=$2 WHERE revision=$1',[before.revision,'Forbidden history rewrite']),/append-only/);
});
test('ordinary actor revocation waits for protected transaction and invalidates the next admission',async()=>{
  const subject=await actor('personal',[]);let release!:()=>void,started!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;}),locked=new Promise<void>(resolve=>{started=resolve;});
  const effect=db.transaction(async tx=>{await service.assertCapability(tx,subject,'COM-01',context);started();await held;});await locked;let revoked=false;const revoke=db.query('UPDATE users SET permission_revision=permission_revision+1 WHERE id=$1',[subject.userId]).then(()=>{revoked=true;});await new Promise(resolve=>setTimeout(resolve,30));assert.equal(revoked,false);release();await effect;await revoke;await assert.rejects(db.transaction(tx=>service.assertCapability(tx,subject,'COM-01',context)),isCode('session_revoked'));
});
test('security quarantine is separately privileged, preserves safety reads and cannot be silently expired or rolled back',async()=>{
  const commercial=await actor('platform',[permissions.read,permissions.propose,permissions.preview,permissions.approve,permissions.rollback]);
  const change=allow('security.quarantine',{incidentRef:randomUUID(),reviewAt:new Date(Date.now()+60000).toISOString()});
  await assert.rejects(service.propose(commercial,{changes:[change],reason:'Commercial actor cannot quarantine security'},await options()),isCode('forbidden_action'));
  const before=await service.current(maker),proposal=await propose([change]);const simulated=await preview(proposal.id,[{context,asOf:new Date(Date.now()+120000).toISOString()}]);assert.equal(simulated.decisions[0]?.allowed,false);assert.ok(simulated.decisions[0]?.reasonCodes.includes('quarantine_review_overdue'));
  await assert.rejects(service.approve(commercial,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:proposal.expectedRevision,reason:'Ordinary checker cannot approve an incident'}),isCode('forbidden_action'));
  await service.approve(checker,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:proposal.expectedRevision,reason:'Independent incident-authorized checker approval'});
  await assert.rejects(decision(),isCode('security_quarantine'));assert.equal((await decision({purpose:'reconciliation',environment:'sandbox'})).allowed,true);
  await assert.rejects(service.proposeRollback(maker,before.revision,'Rollback cannot bypass explicit incident recovery',await options()),isCode('quarantine_recovery_required'));
  const rules=await service.listRules(maker,{limit:100}),quarantine=rules.items.find(rule=>rule.key==='security.quarantine')!;
  await assert.rejects(propose([allow('security.quarantine',{ruleId:quarantine.id,incidentRef:change.incidentRef,reviewAt:change.reviewAt,scope:{channel:'b2c'}})]),isCode('quarantine_recovery_required'));
  await assert.rejects(propose([allow('security.quarantine',{ruleId:quarantine.id,incidentRef:change.incidentRef,reviewAt:new Date(Date.now()+120000).toISOString(),effectiveFrom:new Date(Date.now()+60000).toISOString()})]),isCode('quarantine_recovery_required'));
  await assert.rejects(propose([allow('security.quarantine',{ruleId:quarantine.id,incidentRef:randomUUID(),reviewAt:change.reviewAt})]),isCode('quarantine_recovery_required'));
  await publish([allow('security.quarantine',{ruleId:quarantine.id,enabled:false,incidentRef:change.incidentRef,remediationRef:'synthetic-verified-remediation-v1'})]);assert.equal((await decision()).allowed,true);
});
test('accepted reservation completion preserves A05 while expiry/quarantine and rule pagination stay current',async()=>{
  const expires=new Date(Date.now()+60000).toISOString(),reservation:ControlContext={...context,purpose:'reservation_completion',reservationReference:randomUUID(),reservationExpiresAt:expires,acceptedRevision:1};
  await publish([allow('feature.COM-01.enabled',{enabled:false,scope:{organizationId:maker.contextId}})]).catch(error=>{assert.ok(isCode('invalid_control_scope')(error));});
  const rows=await service.listRules(maker,{limit:1});assert.ok(rows.nextCursor);await assert.rejects(service.listRules(checker,{limit:1,cursor:rows.nextCursor!}),isCode('cursor_invalid'));
  await publish([allow('sales.b2c',{enabled:false,scope:{customerId:customer.userId}})]);assert.equal((await decision(reservation)).allowed,true);await assert.rejects(decision({...reservation,reservationExpiresAt:start}),isCode('capability_disabled'));
  await assert.rejects(service.listRules(maker,{limit:1,cursor:rows.nextCursor!}),isCode('cursor_invalid'));
});
