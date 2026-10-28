#!/usr/bin/env python3
"""Build metadata registries from authored feature/product fragments."""
from build_root import ROOT, DATE, doc, write_json
import json,re,csv,hashlib

brief=(ROOT/'_meta/input/st-docs.md').read_text()
baseline=[{'id':i,'title':t,'source_text':s} for i,t,s in re.findall(r'^- \*\*([A-Z]{3,4}-\d{2}) — (.*?):\*\* (.*)$',brief,re.M)]
parents=[r for r in baseline if not r['id'].startswith('PRD-')]
products=[r for r in baseline if r['id'].startswith('PRD-')]
assert len(parents)==74 and len(products)==24,(len(parents),len(products))
write_json('_meta/baseline.json',dict(version='1.0.0',source='S00',sha256=hashlib.sha256(brief.encode()).hexdigest(),parents=parents,products=products))

def reg(name,entries,**kw):
    data=dict(id='REG-'+name.upper(),version='1.0.0',status='draft',updated=DATE,entries=entries,**kw)
    write_json('_meta/'+name+'.yaml',data)
    return data

role_names=['Product lead','Insurance domain specialist','Business systems analyst','UX accessibility localization','Solution architect','Performance engineer','Next.js frontend engineer','NestJS domain engineer','Partner integration engineer','Database engineer','Security privacy engineer','Payments accounting specialist','Quality engineer','Platform SRE','Analytics engineer','Content SEO growth','Documentation engineer','Delivery release lead','Regulatory legal reviewer','Insurance operations specialist','Mobile PWA engineer']
reg('roles-and-raci',[dict(id=f'R{i:02}',title=n,accountable_for=n,review_state='human-review-pending',assignment='unassigned-human',consulted_roles=['R01','R18'] if i not in [1,18] else ['R17'],informed_roles=['R17']) for i,n in enumerate(role_names,1)])

assumptions=[
('A01','Localization and market defaults','Iran-focused product context, Persian-first RTL, English identifiers, canonical IRR where applicable, explicitly labeled toman conversion, Jalali presentation where selected, UTC events. Jurisdiction/residency/deployment region are not inferred.','R01','Qualified market/legal decision and user acceptance'),
('A02','Architecture proposal','Modular Nest backend, separate API/worker scaling, Next storefront/portal/admin, PostgreSQL durable outbox, object storage; exact supported dependencies await compatibility/security evidence.','R05','ADR review and pinned dependency lock'),
('A03','Workload proposal','Synthetic 200rps steady and 500rps burst plus 20,000-row concurrent import; not known business demand.','R06','Measured demand and representative benchmark'),
('A04','Privacy aggregation','Proposed minimum cohort 10 plus complementary suppression for employer health aggregates; privacy review may require stricter suppression.','R11','Disclosure-risk analysis'),
('A05','Payment reservation transition','A fixed-expiry reservation accepted before a sales disable may complete only its immutable accepted terms; absent a valid reservation, verified money enters refund review without new commitment.','R12','Commercial/legal and implementation race review'),
('A06','Native applications','Native iOS/Android requirement and stack are undecided; responsive web/PWA does not satisfy native scope.','R21','Explicit product scope decision')]
reg('assumptions',[dict(id=i,title=t,proposal=p,owner_role=o,resolution_evidence=e,status='proposed',reversible=True) for i,t,p,o,e in assumptions])

source_rows=[
('S00','User supplied full documentation brief','_meta/input/st-docs.md','user-requirement','All baseline parents, product families, invariants and output contract.','provided'),
('S01','Next.js production checklist','https://nextjs.org/docs/app/guides/production-checklist','primary-technical','Production measurements and rendering guidance; current docs identify v16.4.3, not an installed/locked version.','retrieved'),
('S02','Next.js use cache','https://nextjs.org/docs/app/api-reference/directives/use-cache','primary-technical','Version-dependent public caching directive; never authority to cache private insurance data.','retrieved'),
('S03','Next.js self-hosting','https://nextjs.org/docs/app/guides/self-hosting','primary-technical','Multi-instance hosting/cache coordination requires explicit design.','retrieved'),
('S04','Nest HTTP adapters','https://docs.nestjs.com/techniques/performance','primary-technical','Supported adapter abstraction and alternatives; representative performance choice remains unmeasured.','retrieved'),
('S05','Nest queues','https://docs.nestjs.com/techniques/queues','primary-technical','Queue integration concepts; does not supply atomic DB/broker guarantees.','retrieved'),
('S06','Google Web Vitals','https://web.dev/articles/vitals','primary-technical','p75 LCP2.5s, INP200ms, CLS0.1 thresholds; field/lab distinction.','retrieved'),
('S07','OWASP ASVS overview','https://asvs.owasp.org/','primary-technical','Stable ASVS5.0.0 published May30 2025. Verification target only.','retrieved'),
('S08','WCAG2.2','https://www.w3.org/TR/WCAG22/','primary-technical','WCAG2.2 W3C recommendation Dec12 2024; target AA; manual verification required.','retrieved'),
('S09','AWS transactional outbox','https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html','primary-technical','Local atomic outbox and duplicate-message/idempotency concerns.','retrieved'),
('S10','OpenAI prompting starting point','https://developers.openai.com/api/docs/guides/prompt-engineering','brief-reference','Not relied upon for architecture or coverage; not reverified in this task.','not-retrieved'),
('S11','ASVS5 authorization','https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x17-V8-Authorization.md','primary-technical','Exact V8 IDs used by security matrix; L2 target with selected L3.','retrieved-by-engineering-agent'),
('S12','ASVS5 authentication','https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md','primary-technical','V6.3.3 authentication target conflict with OTP-only retained as pending decision.','retrieved-by-engineering-agent'),
('S13','ASVS5 sessions','https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md','primary-technical','Session-control mappings in security matrix.','retrieved-by-engineering-agent'),
('S14','ASVS5 data protection','https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x23-V14-Data-Protection.md','primary-technical','Data protection mappings in security matrix.','retrieved-by-engineering-agent')]
for sid,title,file,claim in [
('S15','ASVS5 encoding and sanitization','0x10-V1-Encoding-and-Sanitization.md','Exact SQL, SSRF and XXE control references in product threat map'),
('S16','ASVS5 validation and business logic','0x11-V2-Validation-and-Business-Logic.md','Trusted input, atomicity/locking and maker-checker references'),
('S17','ASVS5 API and web service','0x13-V4-API-and-Web-Service.md','Content type, proxy header and framing references'),
('S18','ASVS5 file handling','0x14-V5-File-Handling.md','Upload, validation, storage and download control references'),
('S19','ASVS5 cryptography','0x20-V11-Cryptography.md','Key lifecycle, inventory, cryptographic implementation and integrity controls'),
('S20','ASVS5 secure communication','0x21-V12-Secure-Communication.md','mTLS and TLS validation control references'),
('S21','ASVS5 configuration','0x22-V13-Configuration.md','Egress and secret control references'),
('S22','ASVS5 security logging and errors','0x25-V16-Security-Logging-and-Error-Handling.md','Security event, protection and safe error control references')]:
    source_rows.append((sid,title,'https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/'+file,'primary-technical',claim,'retrieved-by-engineering-agent'))
source_rows.extend([
('S23','JSON Schema validator release','https://pypi.org/project/jsonschema/','primary-technical','jsonschema4.26.0 release and draft2020-12 support; package download failed locally','retrieved'),
('S24','OpenAPI validator release','https://pypi.org/project/openapi-spec-validator/','primary-technical','openapi-spec-validator0.9.0 release and OpenAPI3.1 support; not installed successfully','retrieved'),
('S25','AsyncAPI parser release','https://github.com/asyncapi/parser-js/releases','primary-technical','@asyncapi/parser3.6.6 stable release selected for proposed documentation tooling','retrieved')])
source_rows.append(('S26','ECMAScript Internationalization DateTimeFormat','https://tc39.es/ecma402/#sec-intl.datetimeformat','primary-technical','Calendar formatting API semantics; concrete simulator conversion separately observed with Node/ICU execution','retrieved-by-engineering-agent'))
source_rows.extend([
('S27','User supplied implementation prompt','_meta/implementation-input/st-project.md','user-requirement','Full implementation scope, authority restrictions, evidence and continuation requirements.','provided'),
('S28','User supplied implementation roles','_meta/implementation-input/st-roles.md','user-requirement','R01–R21 responsibility lenses; no human sign-off inferred.','provided'),
('S29','User supplied immutable scope baseline','_meta/implementation-input/st-scope-baseline.json','user-requirement','Baseline IDs and full-scope preservation for implementation.','provided')])
source_rows.extend([
('S30','OpenAPI standards validator official package','https://registry.npmjs.org/@apidevtools/swagger-parser/13.1.0','primary-technical','Exact13.1.0 metadata and installed implementation support OpenAPI3.1 schema validation; local static-contract result is recorded separately.','retrieved'),
('S31','Ajv JSON Schema validator official package','https://registry.npmjs.org/ajv/8.20.0','primary-technical','Exact locked Ajv2020 constructor plus ajv-formats used for full Draft2020-12 schema/example validation.','retrieved')])
reg('source-registry',[dict(id=i,title=t,location=url,kind=k,supports=c,retrieval_status=s,checked_on=DATE if s not in ['provided','not-retrieved'] else None,limitations='No insurer product, legal authority, actual performance or human approval established.') for i,t,url,k,c,s in source_rows])

terms=[('buyer','Party entering the purchase relationship; may differ from payer.'),('payer','Party providing funds or owing the approved invoice.'),('requester','Actor preparing a purchase or privileged action.'),('approver','Independent authorized checker within delegated limits.'),('policyholder','Party holding the insurance contract.'),('insured','Person, asset or exposure covered by the policy.'),('beneficiary','Party entitled to specified benefits, distinct from employer visibility.'),('distributor','Authorized seller/referrer/agency relationship.'),('carrier','Insurer/provider assuming contract-defined coverage obligations.'),('tenant','Administrative isolation boundary, not synonym for insurer or sales channel.'),('channel','B2C or explicit B2B commercial entry/servicing context.'),('commitment','Durable commercial acceptance backed by verified payment or approved credit terms.'),('issuance','Carrier-confirmed policy creation, separate from payment and activation.'),('external_outcome_unknown','Request may have succeeded externally; replay requires status/idempotency or verified reconciliation.'),('outbox','Durable event rows inserted in the same local transaction as business state.'),('inbox','Receiver deduplication record for consumed external/internal messages.'),('servicing','Contracted post-sale policy, payment, claim and support operations.'),('quarantine','Separate privileged security suspension preserving durable obligations.'),('IRR','Proposed canonical rial currency; integer amount with explicit unit.'),('toman','Display unit equal to ten rials; explicitly labeled and not an accounting currency substitution.'),('effective_date','Contract-specific coverage date with explicit calendar/timezone semantics, not event ingestion time.')]
reg('glossary',[dict(id='TERM-'+t.upper(),term=t,definition=d) for t,d in terms])

blockers=[
('BLK-01','Jurisdiction, licensing and residency','R19',['ALL'],'Chosen jurisdiction, authoritative legal sources and qualified review','Live regulated operations off; only synthetic local boundaries','No production launch in an unvalidated jurisdiction'),
('BLK-02','Carrier contracts and rules','R02',['INS-01','INS-04','INS-05','INS-11','COM-06','INT-02'],'Executed agreements, actual rate/forms/risk/coverage/eligibility/schema versions','Live quote/submit/issue off; fictional simulators only','Affected products cannot sell or claim carrier connectivity'),
('BLK-03','Payment/refund/payout authority','R12',['COM-03','COM-09','SVC-08','AUTO-03'],'Provider contracts, merchant configuration, refund/settlement authority and reconciliation files','No live money movement','No purchase funding, refund, settlement or claim payout activation'),
('BLK-04','Credit and financing agreements','R12',['COM-04','ORG-03','ECO-01'],'Credit limits, financing terms, accounting and collections rules','Credit/financing new sales off','Only contract-backed payment alternatives may later be enabled'),
('BLK-05','Claims and servicing delegation','R20',['SVC-04','SVC-05','SVC-06','SVC-07','SVC-08'],'Carrier-approved intake, assessment, cancellation and settlement rights','Advisory-only synthetic workflows','Cannot represent claims decision/payout authority'),
('BLK-06','Official inquiry authority','R09',['INS-04','AUTO-02'],'Permitted data access, consent/retention terms, provider schemas and credentials','Official inquiries off; manual documented alternative','No unsupported official-data claims'),
('BLK-07','Automotive and logistics providers','R20',['AUTO-03','AUTO-05','AUTO-06','AUTO-08','COM-07'],'Authorized endpoints, inventory/booking/receipt/shipping/return/settlement contracts','Simulated bookings/commerce only','No live fulfillment/purchases'),
('BLK-08','Trading, referral and regulated rewards','R19',['AUTO-07','ECO-01','GRW-03'],'Capability-specific legal authority, agreements, disclosures and consent','Each capability individually off','Valuation cannot implicitly enable auctions, escrow, direct investment or prize draws'),
('BLK-09','Infrastructure, exact dependencies and performance','R14',['ALL'],'Region/residency approval, cost quotes, exact supported package lock, middleware compatibility, security scan and measured budgets','Deployment region unselected; build compatibility gate pending','No production readiness or measured performance claim'),
('BLK-10','Native application scope','R21',['GRW-10'],'Explicit iOS/Android scope, stack and acceptance decision','PWA specified; native status undecided','Native deliverable cannot be marked complete'),
('BLK-11','ASVS authentication decision','R11',['GRW-01'],'Resolve OTP-only customer flow against ASVS5 L2 MFA expectation and sensitive-action step-up','No L2 compliance claim; privileged MFA required','Security approval required before L2 readiness assertion')]
reg('risks-and-blockers',[dict(id=i,title=t,owner_role=o,scope_ids=s,missing_input=m,safe_default=d,launch_consequence=c,status='open',kind='external-blocker',resolution_evidence=None) for i,t,o,s,m,d,c in blockers])

environment=dict(id='ENV-PERF-01',status='proposed-unprovisioned',api={'replicas':2,'vcpu_each':4,'ram_gib_each':8},worker={'replicas':2,'vcpu_each':4,'ram_gib_each':8},postgres={'vcpu':8,'ram_gib':32,'storage':'SSD, actual IOPS recorded before run'},region='unselected; single-region test with declared API-DB RTT',network='record provider latency profile separately; proposed same-region API/DB',browser='Pinned Chromium build plus real midrange Android and iOS device models recorded per run',load_generator='separate host; record CPU/RAM/network and saturation',dependency_versions='exact lock and container digests required before measurement')
workload=dict(id='WL-01',arrival_model='open-loop constant arrival, no hidden coordinated omission',steady_rps=200,steady_minutes=30,burst_rps=500,burst_minutes=5,mix_percent={'authorized_reads':65,'quote_start_update':20,'bounded_writes':10,'callback_status':5},operations={'authorized_reads':'40% policy list/detail,15% dashboard,10% catalog of total traffic','quote_start_update':'5% starts,15% status/update of total traffic','bounded_writes':'4% drafts,3% order/approval,2% enrollment,1% refund request','callback_status':'3% callback,2% reconciliation status'},policies=1000000,people=500000,organizations=50000,carrier_simulators=10,concurrent_import_rows=20000,max_read_response_kib=64,max_command_kib=32,max_quote_response_kib=128,quote_provider_fanout_max=10,active_connections=1000,think_time='open-loop arrivals; separate E2E session model uses 2–10s seeded think time',provider_profile='Fictional: nine healthy eligible endpoints; one injected outage; p95 healthy response <=1500ms for conditional first-result target',variants=['warm public cache','cold public cache','one-carrier outage','duplicate callbacks','cache loss','queue restart/recovery','tenant noisy neighbor','private cache isolation'])
rows=[
('PERF-READ','Own-service bounded reads',{'p95_ms':250,'p99_ms':750},'API ingress after complete request bytes','last response byte','auth, validation, DB and serialization included; external provider work excluded','CI representative performance stage; release baseline'),
('PERF-WRITE','Own-service bounded writes',{'p95_ms':500,'p99_ms':1500},'API ingress after complete request bytes','committed transaction and complete response','validation, authorization, audit and outbox included; provider I/O separate','CI representative performance stage; release baseline'),
('PERF-QUOTE','Quote aggregation',{'first_eligible_p95_ms':2000,'aggregation_deadline_ms':8000},'accepted quote request','first eligible result; separately final partial/complete/timeout','first target conditional on at least one healthy eligible provider meeting dependency profile; never fabricate offers','Release load/outage gate; report end-to-end and each provider'),
('PERF-DISPATCH','Purchase first outbound attempt',{'p95_ms':5000},'durable purchase.committed transaction timestamp','first outbound attempt start','healthy worker/queue; report backlog and outage recovery separately','Release with queue crash/restart'),
('PERF-WEB','Field Web Vitals',{'LCP_p75_ms':2500,'INP_p75_ms':200,'CLS_p75':0.1},'navigation lifecycle or interaction start','metric-specific Web Vitals endpoint','mobile and desktop per key journey; field evidence separate from lab','RUM 28-day rolling window once sufficient traffic; synthetic prelaunch cannot establish field pass'),
('PERF-JS','Transferred route JavaScript',{'landing_initial_gzip_kib':180,'purchase_initial_gzip_kib':280,'dashboard_initial_gzip_kib':400,'full_purchase_journey_gzip_kib':750},'empty-cache production route navigation','initial execution dependencies; journey includes lazy chunks','shared runtime included; gzip explicit; source maps excluded','Production build budget gate'),
('PERF-AVAIL','Own-service availability',{'monthly_success_percent':99.9},'eligible valid authenticated/platform request ingress','successful non-5xx completion with correct durable result','denominator includes platform failures and maintenance; invalid auth/input separated; external journey failure reported alongside','Monthly SLO/error budget review'),
('PERF-FLAG','Feature decision freshness',{'cosmetic_staleness_max_ms':5000,'purchase_commit_staleness_ms':0},'authoritative configuration revision commit','presentation reflects revision; business commit checks serialized revision','commercial reservations use A05; security revocation checked independently','Concurrency/property and multi-replica tests'),
('PERF-DB','Database resource bounds',{'ordinary_read_queries_max':6,'bounded_write_queries_max':12,'api_pool_max_per_process':20,'worker_pool_max_per_process':10,'db_connections_max':100,'operational_reserved_connections':20,'transaction_soft_deadline_ms':250},'request DB span/connection request','last DB span/connection release','no provider I/O within transactions; target exceptions require profiled ADR','Explain analyze and pool-wait gate under WL-01'),
('PERF-BULK','Bulk fairness',{'import_chunk_rows_max':500,'export_page_rows_max':1000,'per_tenant_active_jobs_max':2,'import_20000_rows_target_seconds':600},'durable job accepted','all validated/applied/rejected rows accounted for','partial policy explicit; checkout budgets still pass','Release concurrent import/checkout gate'),
('PERF-QUEUE','Queue recovery',{'normal_oldest_ready_age_seconds':30,'catchup_target_seconds':300,'retry_attempts_max':5,'retry_backoff_seconds':[1,5,30,120,300]},'work becomes eligible; restart clock separately','attempt or all recovered eligible jobs completed','unknown non-idempotent operations excluded from automatic retry and reported; max age is alert threshold','Queue crash/recovery exercise with measured backlog volume'),
('PERF-CACHE','Public data freshness',{'public_catalog_max_age_seconds':60,'public_editorial_max_age_seconds':300,'private_shared_cache_allowed':False},'authoritative content publication','last stale public response','purge/version propagation across replicas; no private negotiated data','Cache isolation/invalidation gate'),
('PERF-COST','Cost reporting',{'provider_price_baseline':'unpriced','currency':'unselected','production_cost_target':'pending business budget'},'monthly resource/provider billing window','successful issued-order count for same cohort','include unsuccessful attempts, callbacks, egress, storage, support and committed shared capacity','R01/R06 approve priced baseline before infrastructure commitment')]
budget_entries=[dict(id=i,title=t,status='proposed-unmeasured',target=v,start=start,end=end,dependency_boundary=b,workload='WL-01',environment='ENV-PERF-01',dataset='WL-01 synthetic seeded fixture with digest',tools=['k6 or equivalent pinned load generator','OpenTelemetry','PostgreSQL EXPLAIN ANALYZE','browser performance trace','web-vitals RUM for PERF-WEB'],sampling='All synthetic requests and failures; RUM consent/minimization with declared sample rate; sufficient sample/CI reported, never silently discard slow failures',gate=g,owner_role='R06') for i,t,v,start,end,b,g in rows]
budget_entries.append(dict(id='PERF-OPS',title='Proposed recovery and incident targets',status='proposed-unmeasured',target={'database_RPO_seconds':300,'database_RTO_seconds':3600,'object_RPO_seconds':3600,'object_RTO_seconds':14400,'paid_unissued_alert_age_seconds':900,'unknown_outcome_alert_delay_seconds':0,'oncall_acknowledge_seconds':900},start='RPO: fault point; RTO: declared recovery start; alert: durable exception or committed paid purchase; acknowledgment: alert delivery',end='RPO: latest restorable durable point; RTO: integrity-verified service available; alert: delivered to duty owner; acknowledgment: named owner accepts',dependency_boundary='Backup/WAL/object-version availability and staffed on-call required; targets do not confer contractual SLA',workload='WL-01 restore/recovery fixture with all monetary/outbox and representative document data',environment='ENV-PERF-01 isolated restore target; actual disaster deployment region pending',dataset='Seeded database and object manifests with hashes; injected loss point recorded',tools=['database restore logs','object version manifest verifier','synthetic integrity probes','incident exercise log'],sampling='Every recovery drill; verify payment/outbox/ledger invariants and document access before RTO stop',gate='R14/R12/R11 review successful isolated restore and incident rehearsal before production',owner_role='R14'))
for entry in budget_entries:
    if entry['id'] in ['PERF-WEB','PERF-AVAIL']:
        entry.update(workload='WL-FIELD-01',environment='ENV-PRODUCTION-PENDING',dataset='Consented/minimized actual route sessions for Web Vitals; all eligible platform request outcomes for availability. Production does not exist yet.')
    if entry['id']=='PERF-QUEUE':
        entry['recovery_fixture']='Stop workers for60s at40 eligible jobs/s, yielding2400 durable jobs; restore while40/s arrivals continue. Catchup target requires >=48/s surplus plus arrival capacity; measure provider permits. Repeat with unknown-effect jobs held outside retry set and report them separately.'
reg('performance-budgets',budget_entries,environment=environment,workload=workload,observational_workload={'id':'WL-FIELD-01','environment':'ENV-PRODUCTION-PENDING','traffic':'actual production eligible requests/sessions; no synthetic demand substitution','sampling':'record device/route cohorts, consent/minimization, sample size and confidence; do not infer field pass from lab','availability_denominator':'all eligible platform requests including planned maintenance failures, plus separately reported external journey outcomes'})

ops=['quote','reserve','submit','status','issue','retrieve_document','endorse','cancel','claim','claim_status','claim_payout']
reg('integration-capabilities',[dict(id='CAP-'+o.upper(),operation=o,negotiation='explicit per carrier/product/channel/environment and mapping version',default='unsupported',requires_authority=True,unsupported_behavior='Do not invoke; show supported alternate or assigned assisted task; no fabricated result',ambiguity_rule='If external effect may have happened, status/idempotency or verified reconciliation required before retry',recipient_scope='minimal permitted canonical projection') for o in ops])

def fragment(name):
    p=ROOT/('_meta/fragments/'+name+'.json')
    return json.loads(p.read_text()) if p.exists() else []

features=fragment('features')
if isinstance(features,dict):features=features.get('parents',features.get('features',features.get('entries',[])))
if features:
    for p in features:
        p.setdefault('source_refs',['S00']);p.setdefault('desired_capability',p.get('source_text',p['title']))
        p.setdefault('rollout_default','off-live');p.setdefault('implementation_expectation','Full capability required; current execution state is maintained separately in implementation-status.json')
        if p['id'] in ['GRW-01','ORG-02','CHN-01','CHN-02','CHN-03','CHN-04','CHN-05','INT-01','INT-04','INT-05','INT-07','INT-10']:
            p['rollout_default']='mandatory-foundation; live-provider operations remain separately disabled'
        p.setdefault('specification_paths',[p['spec_path']]);p.setdefault('completion_status','draft-written')
        p.setdefault('acceptance_ids',[a for c in p['children'] for a in c.get('acceptance_ids',[])])
        for c in p['children']:
            c.setdefault('source_refs',['S00']);c.setdefault('rollout_default','off-live');c.setdefault('implementation_expectation','implement and execute acceptance before enablement');c.setdefault('specification_paths',[p['spec_path']]);c.setdefault('dependencies',p.get('dependencies',[]));c.setdefault('channels',p.get('channels',[]));c.setdefault('dashboards',p.get('dashboards',[]))
            if p['rollout_default'].startswith('mandatory-foundation'):c['rollout_default']=p['rollout_default']
    reg('feature-catalog',features,native_app_status='undecided separate scope/stack; PRD scope retained',baseline_count=74)

prod=fragment('products')
if isinstance(prod,dict):prod=prod.get('products',prod.get('entries',[]))
for product_row in prod:
    product_row['display_channels']=product_row['channels'][:]
    product_row['channels']=[{'B2C':'b2c','B2B.corporate':'corporate','B2B.commercial':'commercial','B2B.reseller':'reseller','B2B2C':'b2b2c'}.get(c,c) for c in product_row['channels']]
if prod:reg('product-catalog',prod,baseline_count=24,live_rule_status='blocked by actual carrier agreements')
dashboards=fragment('dashboards')
if isinstance(dashboards,dict):dashboards=dashboards.get('dashboards',dashboards.get('entries',[]))
if dashboards:reg('dashboard-catalog',dashboards)

permissions=[]
for p in features:
    for kind in ['read','write']:
        permissions.append(dict(id='feature.'+p['id']+'.'+kind,feature_id=p['id'],action=kind,scope='resource relationship + active tenant/subject + field projection',roles=p.get('dashboards',[]),enforcement='Nest use case; workers and exports reauthorize',denial='404 for inaccessible object;403 for permitted resource with forbidden action',segregation='Independent checker required for finance, delegated limits, sensitive configuration and claim payouts',revocation='authoritative permission revision checked at action; clear client context'))
    known={x['id'] for x in permissions}
    for child in p['children']:
        for key in child.get('permission_ids',[]):
            if key in known:continue
            known.add(key)
            permissions.append(dict(id=key,feature_id=p['id'],action=child['api_operation'],scope=p['boundary'],roles=p.get('dashboards',[]),enforcement='Specific operation grant AND general read/write grant; Nest resource/property policy',denial='404 inaccessible object;403 forbidden action',segregation='Feature-specific guard and independent checker for monetary/privileged approval',revocation='current permission revision on action and export retrieval'))
for d in dashboards:
    for key in d.get('permissions',[]):
        permissions.append(dict(id=key,feature_id='DSH-06',action=key.rsplit('.',1)[-1],scope='Active context plus resource/property grant; role menu is not authorization',roles=d['roles'],enforcement='Nest query/mutation/export and current retrieval authorization',denial='404 inaccessible object;403 forbidden action',segregation='No self-approval or employer medical access',revocation='immediate current revision check; clear private route state'))
for key in ['payment.verify','corporate.credit.commit','command.read-own','purchase.snapshot.read','carrier.callback.own','integration.replay','integration.check','feature.propose','feature.approve']:
    permissions.append(dict(id=key,feature_id='INT-01',action=key.rsplit('.',1)[-1],scope='Dedicated principal and allowed object relationship; internal path not exposed to browser',roles=['authorized-internal-or-privileged-role'],enforcement='Nest application boundary and worker recipient policy',denial='403 action or404 inaccessible resource',segregation='Requester/checker different actors for replay, credit and publication',revocation='current authorization revision'))
reg('permissions',permissions)
controls=[]
for key,kind in [('sales.b2c','new_sales'),('sales.b2b','new_sales'),('sales.b2b.corporate','new_sales'),('sales.b2b.commercial','new_sales'),('sales.b2b.reseller','new_sales'),('sales.b2b.b2b2c','new_sales'),('servicing.enabled','servicing'),('partner_delivery.enabled','partner_delivery'),('security.quarantine','security')]:
    controls.append(dict(id=key,type='boolean',default=kind in ['servicing','partner_delivery'],scope=['global','channel','organization','product','plan','carrier','region','cohort','effective_time'],precedence='quarantine/deny dominates; mandatory parent grants required; narrower scope cannot override deny',dependencies=['sales.b2b'] if key.startswith('sales.b2b.') else [],authority='commercial checker; security quarantine privileged R11; flags never grant permissions',effective_time='UTC revision serialized with authoritative purchase transaction',recovery='new audited revision; preserve historical commitments, reconcile unknown outcomes',servicing='preserve permitted obligations independently of new sales'))
for p in features:
    ids={x for c in p['children'] for x in c.get('flag_ids',[])} or {'feature.'+p['id']+'.enabled'}
    mandatory=p['id'] in ['GRW-01','ORG-02','CHN-01','CHN-02','CHN-03','CHN-04','CHN-05','INT-01','INT-04','INT-05','INT-07','INT-10']
    for i in sorted(ids): controls.append(dict(id=i,type='boolean',default=mandatory,scope=['global','channel','organization','product','plan','carrier','region','cohort','effective_time'],precedence='deny/security quarantine dominates; parent modes and dependencies must permit',dependencies=[],authority='mandatory noncommercial foundation: ordinary feature administration cannot set false' if mandatory else 'versioned approved admission control plus resource permissions',effective_time='serialized authoritative commit revision',recovery='new audited revision; revalidate uncommitted drafts; do not replay unknown effects',servicing='existing obligations remain available by independent servicing control; callbacks, reconciliation and committed delivery never gated by admission flag',enforcement_phase='mandatory-foundation' if mandatory else 'new-admission-only',commercially_disableable=not mandatory))
for p in prod:
    controls.append(dict(id='product.'+p['id']+'.new_sales',type='boolean',default=False,scope=['global','channel','organization','carrier','region'],precedence='parent sales mode, feature grants, contract entitlement and security deny dominate',dependencies=['feature.INS-11.enabled'] if any(c['id']=='feature.INS-11.enabled' for c in controls) else [],authority='R02 product/carrier evidence plus independent publication approval',effective_time='authoritative purchase commit version',recovery='new audited revision; retain old servicing terms',servicing='separate contracted servicing control'))
reg('feature-controls',controls)

if features:
    caps={c['integration'] for p in features for c in p['children'] if isinstance(c.get('integration'),str) and c['integration'] not in ['none','internal'] and not c['integration'].startswith('N/A')}
    existing=read_caps=json.loads((ROOT/'_meta/integration-capabilities.yaml').read_text())['entries']
    have={e['operation'] for e in existing}
    existing.extend(dict(id='CAP-'+cap.upper(),operation=cap,negotiation='explicit per provider/product/channel/environment contract',default='unsupported',requires_authority=True,unsupported_behavior='approved assisted path or visible unavailability; no invented provider result',ambiguity_rule='potential external effect requires status/idempotency or verified reconciliation before retry',recipient_scope='minimal purpose-authorized projection') for cap in sorted(caps-have))
    reg('integration-capabilities',existing)

decisions=[]
for p in sorted((ROOT/'04-architecture/adr').glob('*.md')):
    raw=p.read_text();m=re.search(r'\{.*?\}',raw,re.S)
    try: meta=json.loads(m.group()) if m else {}
    except json.JSONDecodeError:meta={}
    decisions.append(dict(id=p.stem,title=meta.get('title',p.stem),status='proposed',owner_role=meta.get('owner_role','R05'),reviewer_roles=meta.get('reviewer_roles',['R06','R11']),spec_path=p.relative_to(ROOT).as_posix(),approval_evidence=None))
reg('decisions-register',decisions)

if features:
    headers=['parent_feature','child_requirement','product','persona_channel','screen','permission','feature_flag','business_rule','entity','api_operation','event','integration_capability','test_acceptance','performance_budget','documentation_path','planned_implementation_path','release_slice','source_assumption','completion_status']
    with (ROOT/'_meta/traceability.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=headers);w.writeheader()
        for p in features:
            for c in p['children']:
                def cell(v,why):return ';'.join(map(str,v)) if isinstance(v,list) and v else (str(v) if v else 'N/A: '+why)
                w.writerow(dict(parent_feature=p['id'],child_requirement=c['id'],product=cell(c.get('product_scope'),'cross-product platform capability; individual product contracts define variations'),persona_channel=cell(p.get('channels'),'internal platform operation'),screen=cell(c.get('screen'),'background-only task with operator exception visibility'),permission=cell(c.get('permission_ids'),'system principal under scoped operation grant'),feature_flag=cell(c.get('flag_ids'),'mandatory security foundation cannot be disabled commercially'),business_rule=cell(c.get('business_rule_ids'),'shared BR-CORE invariants only'),entity=cell(c.get('entity'),'stateless permitted projection'),api_operation=cell(c.get('api_operation'),'background worker contract'),event=cell(c.get('event'),'read-only operation emits audit only'),integration_capability=cell(c.get('integration'),'internal operation with no external provider'),test_acceptance=cell(c.get('acceptance_ids'),'MISSING ACCEPTANCE - gap'),performance_budget=cell(c.get('performance_budget'),'offline design governance'),documentation_path=p['spec_path'],planned_implementation_path=cell(c.get('implementation_path'),'documentation-only governance'),release_slice=cell(c.get('release_slice'),'scheduling decision pending'),source_assumption='S00;A01',completion_status='draft-specified;implementation-not-started'))

print(f'Metadata: baseline={len(parents)}, products={len(products)}, authored_features={len(features)}, authored_products={len(prod)}')
