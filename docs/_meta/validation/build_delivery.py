#!/usr/bin/env python3
"""Write root-owned workflow, quality and delivery documentation."""
from build_root import ROOT, doc, write_json

workflows = [
('direct-quote-to-policy','Direct quote to policy',['INS-05','COM-01','COM-03','COM-06'], 'Buyer owns the risk subjects; eligible product/carrier and B2C discovery/quote/purchase are enabled; official inquiries require consent and provider authority.',
 [('Buyer','Web','Submit versioned risk answers and declarations'),('Web','API','Start quote with product/schema/risk revision'),('API','Carrier','Bounded eligible quote requests'),('Carrier','API','Progressive offers, provenance and expiry'),('Buyer','API','Select offer and accept immutable terms'),('API','DB','Reserve order/payment attempt under current controls'),('Buyer','Provider','Complete payment redirect'),('Provider','API','Notify payment result'),('API','Provider','Verify merchant, amount, currency and reference'),('API','DB','Atomically record receipt, committed purchase and outbox'),('Worker','Carrier','Send recipient projection with stable key'),('Carrier','Worker','Confirm issued reference and effective interval'),('Worker','DB','Persist issuance, document reference and delivery event')],
 'Quote expires before reservation: obtain fresh offers and consent. Carrier timeout after possible acceptance: external_outcome_unknown, no blind replay. Payment receipt with ineligible uncommitted order: finance exception and refund review, never discard money.',
 'AC-WF-DIRECT: Given a verified synthetic payment and accepted offer, when the callback repeats concurrently, then one receipt, one commitment and one business submission identity exist; payment success alone never shows active coverage.'),
('corporate-negotiated-group-purchase','Corporate negotiated/group purchase',['GRW-07','ORG-04','ORG-03'], 'An organization buyer has scoped requester and independent approver; census evidence is permitted, health fields separated, group product and negotiated carrier authority present.',
 [('Requester','API','Upload census/asset schedule with effective dates'),('API','DB','Create import job and encrypted source reference'),('Worker','DB','Validate rows, identities and overlapping periods'),('Requester','API','Review row errors and approved preview digest'),('API','Carrier','Send permitted aggregate/schedule proposal'),('Carrier','API','Return negotiated offer version and terms'),('Approver','API','Approve exact offer/census digest within delegation'),('API','DB','Reserve budget/credit or create payment order'),('Worker','Carrier','Submit committed group and per-member recipient data')],
 'Negotiated offer changes invalidate prior approval. Partial row acceptance requires explicit approved policy; no silent dropping of dependents. Employer does not receive private health claims or underwriting evidence.',
 'AC-WF-GROUP: Given a changed census after approval, when purchase is attempted, then version conflict requires renewed approval and no carrier submission occurs.'),
('maker-checker-invoice-credit','Maker-checker and invoice/credit commitment',['ORG-03','INT-03','COM-09'], 'Executed credit terms, current organization limit and distinct requester/checker grants are required. No agreement means credit new sales off.',
 [('Requester','API','Submit order terms, cost center and requested credit'),('API','DB','Save approval request with immutable proposal digest'),('Approver','API','Approve within delegated limit and reason'),('API','DB','Lock approval, organization limit and order'),('API','DB','Reserve limit, create receivable and commitment outbox atomically'),('Worker','Carrier','Submit credit-backed commercial commitment'),('Payer','Provider','Pay invoice later'),('Provider','API','Notify receipt for independent verification'),('API','DB','Allocate verified money to receivable without second purchase')],
 'Self-approval returns forbidden. Concurrent orders competing for remaining limit serialize and one may fail. Later payment reduces receivable; it must not reissue. A disputed invoice does not erase an issued policy.',
 'AC-WF-CREDIT: Given available credit 100 synthetic units and two concurrent 80-unit proposals, at most one commits; committed event says approved_credit and payment remains unpaid.'),
('reseller-assisted-sale','Reseller-assisted sale',['GRW-06','INS-12','COM-01'], 'Active seller contract, enabled reseller subchannel and customer-specific delegation are required. Seller cannot consent to undisclosed terms for the customer.',
 [('Seller','API','Create lead with customer permission and assignment'),('Seller','API','Prepare quote/risk draft within delegated scope'),('API','Carrier','Obtain permitted offer or manual proposal'),('Customer','API','Confirm relationships, declarations and payer'),('API','DB','Freeze seller attribution and accepted proposal'),('Provider','API','Send payment notification for verification'),('API','DB','Commit order and pending commission attribution'),('Worker','Carrier','Transmit purchase under normal durable path')],
 'Delegation revocation immediately prevents new viewing/editing. Lead reassignment cannot rewrite historical commission. Refund reverses eligible accrual by linked entries. No customer-wide access from phone-number search.',
 'AC-WF-SELLER: Given seller access to customer A, requesting customer B policy by known ID returns indistinguishable not-found and no data appears in exports.'),
('dependent-enrollment-change','Dependent enrollment/change',['ORG-04','DSH-03','SVC-04'], 'Employee owns beneficiary relationship; enrollment window/rules are contract versions; proof files are scanned and accessed only by authorized reviewers.',
 [('Employee','API','Propose dependent relationship and effective date'),('API','DB','Validate overlapping coverage and proof references'),('Reviewer','API','Approve eligible change with reason/version'),('API','Carrier','Request effective-dated enrollment amendment'),('Carrier','API','Confirm or reject revised schedule'),('API','DB','Create new coverage version and certificate job'),('Employee','API','Retrieve own/dependent certificate')],
 'Backdated changes require carrier authority. Carrier rejection leaves previous effective coverage intact. Employer sees enrollment outcome/billing fields, not diagnosis or private evidence.',
 'AC-WF-DEPENDENT: Given two overlapping effective changes for one dependent, concurrent approval produces one authorized interval and a version conflict, preserving prior certificates.'),
('vehicle-inspection','Vehicle inspection',['INS-09','INS-08'], 'Product requires a versioned inspection checklist; owner authorizes inspection; in-person providers or self-media are allowed only by carrier rules.',
 [('Buyer','API','Select self-inspection or available appointment'),('API','DB','Reserve slot/checklist version and expiry'),('Buyer','Storage','Upload evidence using scoped short-lived grant'),('Worker','Storage','Scan file and validate evidence manifest'),('Reviewer','API','Assess checklist and request explicit retakes'),('Buyer','API','Submit retake as new immutable evidence'),('Reviewer','API','Approve inspection with expiry and scope'),('API','DB','Unblock eligible underwriting transition')],
 'Malformed or malware files remain quarantined. Lost slot race returns alternatives. Expired evidence cannot authorize a later policy without reinspection. Media metadata is minimized while preserving required provenance.',
 'AC-WF-INSPECTION: Given approved evidence that expires before underwriting, commitment is blocked or sent for authorized reinspection; an uploaded file alone is never approval.'),
('payment-verification-refund','Payment verification/refund',['COM-03','COM-09','SVC-08'], 'Provider contract and approved merchant destination; refund request references remaining original verified allocation; payout authority is independently granted.',
 [('Provider','API','Send signed callback reference'),('API','Provider','Verify authoritative receipt and amount'),('API','DB','Deduplicate receipt and journal allocation'),('Requester','API','Request refund with reason and original receipt'),('Approver','API','Approve remaining refundable amount'),('API','DB','Reserve refundable balance and durable payout work'),('Worker','Provider','Submit refund with stable business key'),('Provider','API','Return verified result or unknown outcome'),('API','DB','Post reversal only upon confirmed refund')],
 'Never trust browser redirects or callback amount alone. Duplicate callbacks are inert. Unknown refund result freezes that reservation; no second payout. Original payer mismatch requires reviewed exception, not arbitrary bank change.',
 'AC-WF-REFUND: Two concurrent refunds cannot exceed unrefunded verified money; duplicate payout status produces one reversal journal.'),
('asynchronous-issuance','Asynchronous issuance',['COM-06','INT-03','INT-08'], 'Purchase committed with immutable form, consent, carrier mapping and recipient projection; current security policy permits transmission.',
 [('Worker','DB','Lease outbox row and persist per-order attempt'),('Worker','Carrier','Submit stable business idempotency key'),('Carrier','Worker','Acknowledge asynchronous reference'),('Worker','DB','Persist acknowledgment and next poll time'),('Worker','Carrier','Poll authoritative status'),('Carrier','API','Send verified issuance callback'),('API','DB','Inbox dedupe and serialize order transition'),('Worker','Storage','Store scanned policy document'),('Worker','DB','Publish policy.issued.v1 and delivery work')],
 'Polling and callbacks may race: compare observation identity/version and apply legal transition once. A stale pending observation cannot downgrade issued. Crash after external acceptance before DB ack requires status reconciliation.',
 'AC-WF-ASYNC: Given callback and poll both report issuance, exactly one policy-version record and one business delivery obligation exist; transport events may be duplicated.'),
('ambiguous-carrier-timeout','Ambiguous carrier timeout',['INT-07','INT-08'], 'Carrier submit was attempted and response was not conclusively received. Determine capability matrix before choosing recovery.',
 [('Worker','Carrier','Submit request with persisted request identity'),('Carrier','Carrier','May accept before connection loss'),('Worker','DB','Persist external_outcome_unknown and exception'),('Worker','Carrier','Lookup status only if authoritative capability exists'),('Operator','API','Attach verified partner reconciliation evidence'),('Checker','API','Approve resolution and any safe replay/refund'),('API','DB','Record resolution, successor action and audit')],
 'If carrier supports neither idempotency nor authoritative status, automatic retry is prohibited. Keep paid/unissued visible. Operator cannot equate no response with rejection. Refund requires ensuring no conflicting issued obligation or approved documented remediation.',
 'AC-WF-UNKNOWN: Given timeout-after-acceptance and no status/idempotency capability, retries stop, exception persists and changing sales flags does not replay the order.'),
('digital-claims-payment','Digital claims/payment',['SVC-06','SVC-07','SVC-08'], 'Claimant relationship and policy eligibility are checked; settlement requires explicit insurer/contract authority. Otherwise intake is advisory/referral only.',
 [('Claimant','API','Submit incident, parties, evidence and consent'),('API','DB','Persist private claim and evidence manifest'),('Assessor','API','Review loss, request supplement or record decision'),('Approver','API','Approve contract-authorized amount and beneficiary'),('API','DB','Reserve payout, audit dual control and enqueue'),('Worker','Provider','Pay approved verified beneficiary with stable key'),('Provider','API','Confirm or report unknown payout result'),('API','DB','Reconcile money and claimant-safe status')],
 'Employer reporting excludes individual health details. Rejected claim supports documented review rights without overwriting decision history. Unknown payout freezes further attempts; bank changes invalidate old approval.',
 'AC-WF-CLAIM: Given a corporate employee claim, employer admin cannot view incident/evidence/diagnosis, while claimant and assigned carrier assessor can access their allowed projection.'),
('endorsement-cancellation','Endorsement/cancellation',['SVC-04','COM-09'], 'Authorized policy relationship, product-specific change eligibility and carrier capability; request does not itself change coverage.',
 [('Holder','API','Request amendment/cancellation with effective date'),('API','DB','Validate policy version and bind request evidence'),('Worker','Carrier','Submit allowed endorsement/cancellation request'),('Carrier','API','Confirm revised policy version and financial adjustment'),('API','DB','Append endorsement and authorized effective interval'),('Approver','API','Approve any resulting refund or extra premium'),('Worker','Provider','Execute verified finance adjustment')],
 'Unknown carrier outcome leaves previous authoritative policy projection with pending notice. No coverage cancellation from local refund button. Negative premium adjustment is not permission to pay twice.',
 'AC-WF-ENDORSE: Duplicate carrier response creates one version; rejection retains old coverage and all request history.'),
('renewal','Renewal',['SVC-02','INS-10'], 'Expiry detection uses carrier dates and customer contact preferences; old policy data may prefill only with appropriate relationship and consent.',
 [('Worker','DB','Find eligible expiring policy cohort'),('Worker','Provider','Send permitted deduplicated reminder'),('Customer','API','Review prefilled risk and changed facts'),('API','Carrier','Obtain fresh eligible quotes including switching'),('Customer','API','Accept new offer and terms'),('API','DB','Create new purchase linked to predecessor/attribution'),('Worker','Carrier','Issue committed renewal as new policy')],
 'Do not reuse expired prices or automatically renew without authority. Group/fleet schedules require new effective-date review. Disabling new sales retains current policy download and claims; renewal quote/purchase obey current controls.',
 'AC-WF-RENEW: Given changed vehicle value and a new carrier, renewal requires fresh pricing/inspection rules and retains the original policy history.'),
('feature-disable-during-checkout','Feature disable during checkout',['CHN-01','CHN-02','CHN-05'], 'Feature proposal has authorized approver and effective revision; commercial disable and security quarantine are separate controls.',
 [('Buyer','API','Begin checkout under current sales revision'),('Admin','API','Publish new sales-disable revision'),('API','DB','Serialize revision activation and purchase check'),('Provider','API','Deliver payment callback possibly after disable'),('API','Provider','Verify actual receipt regardless of sales flag'),('API','DB','Apply reservation policy or finance exception; preserve money'),('Worker','DB','Load committed purchase snapshot'),('Worker','Carrier','Continue authorized pre-disable commitment unless quarantined')],
 'New direct commitments after linearization fail mode_disabled. Existing drafts read-only; policy downloads/installments/claims remain. For payment reservation already authorized before disable, only its fixed expiry and immutable accepted terms permit completion; otherwise receipt stays unallocated pending refund review. Never silently extend a reservation.',
 'AC-WF-FLAG: A purchase committed before B2C-off and delivered afterward continues issuance; new direct purchase fails; B2B and insurer access remain independent; audit contains both revisions.'),
('bulk-import-export','Bulk import/export',['ORG-04','ORG-02','DSH-06'], 'Requester has organization and field scope; import/export quota and purpose recorded; uploaded source is scanned.',
 [('Requester','Storage','Upload synthetic CSV/XLSX using scoped grant'),('API','DB','Create durable job with schema/effective-date version'),('Worker','DB','Validate rows and produce permission-filtered preview'),('Requester','API','Accept exact preview digest and failure policy'),('Approver','API','Approve required membership/financial changes'),('Worker','DB','Apply bounded chunks with row idempotency and checkpoints'),('Requester','API','Request authorized asynchronous export'),('Worker','Storage','Write filtered encrypted export with short-lived grant')],
 'CSV formula cells are escaped in exports; parser bombs/oversized files are rejected. All-or-nothing applies to approved logical group if configured; partial policy must list applied/rejected rows. Revoked permissions cancel export access even if file already generated.',
 'AC-WF-BULK: Concurrent 20,000-row import cannot exhaust checkout pool; restarting a chunk applies each effective membership change once and preserves explicit row failures.'),
('maintenance-booking-parts-fulfillment','Maintenance booking/parts fulfillment',['AUTO-05','AUTO-06'], 'Authorized provider/seller, inventory or appointment availability and disclosed price/fee/return policy; compatibility data carries source version.',
 [('Customer','API','Choose vehicle-compatible item or service slot'),('API','Provider','Reserve inventory/slot with explicit expiration'),('API','DB','Persist cart/booking and accepted terms'),('Provider','API','Verify payment or approved pay-at-service terms'),('Worker','Provider','Confirm fulfillment and shipment/appointment'),('Provider','API','Send signed completion/delivery status'),('Customer','API','Request cancellation/return/complaint within terms'),('API','DB','Hold or release settlement according to dispute state')],
 'Lost reservation requires explicit alternative or refund, not silent substitution. Parts fitment mismatch permits governed return. Provider no-show and incomplete job create disputes; settlement does not follow payment alone. Booking, shipping and policy issuance are distinct states.',
 'AC-WF-AUTO: Two purchases of last inventory unit produce one reservation; expired reservations release stock; refunded item reverses eligible commission without issuing an insurance policy.'),
('vehicle-transaction-referral','Vehicle transaction and financial referral',['AUTO-07','ECO-01'], 'Each valuation/listing/auction/contract/debt-settlement and financial-referral capability has its own reviewed authority, provider and feature control; all direct regulated execution remains off absent approval.',
 [('Customer','API','Choose separately enabled transaction/referral service'),('API','Provider','Request authorized valuation/history or eligibility'),('Customer','API','Accept disclosure and recipient-specific data consent'),('API','DB','Record consent/version and permitted referral attribution'),('Worker','Provider','Send minimal referral or authorized transaction request'),('Provider','API','Return signed outcome/reference'),('API','DB','Update boundary status without claiming platform execution')],
 'Referral click is not investment execution or loan approval. Auction acceptance requires independent contract and settlement design; debt settlement unknown results block replay. Withdrawal of optional consent prevents future sharing but retains required audit references under reviewed retention.',
 'AC-WF-REFERRAL: Enabling valuation never enables auctions or escrow; absent provider authority the operation rejects before data transmission and explains unavailable service.')]

for slug,title,scopes,pre,steps,recovery,acceptance in workflows:
    actors=[]
    for a,b,_ in steps:
        for p in (a,b):
            if p not in actors:actors.append(p)
    diagram='sequenceDiagram\n'+''.join(f'  participant {a}\n' for a in actors)+''.join(f'  {a}->>{b}: {label}\n' for a,b,label in steps)
    body=f'''## Preconditions and authority
{pre}

## Exact sequence
```mermaid
{diagram}```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
{recovery}
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
{acceptance}
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.'''
    doc('02-requirements/workflows/'+slug+'.md',title,body,'R03',scopes)

quality={
'risk-based-test-strategy':'''Prioritize monetary integrity, tenant/health-data isolation, authorization revocation, irreversible insurer operations and servicing continuity. Risk is impact × likelihood × detectability; R13 records justification rather than treating line coverage as correctness. Critical invariants require property/integration tests and adversarial failure cases; low-impact content changes use focused checks.

Test layers: pure domain rules with injected clocks/IDs; PostgreSQL transactions and constraints; provider contract simulators; browser journeys across seven dashboards; manual accessible interaction; load/soak/recovery; certified sandbox then approved live smoke tests. Never promote synthetic coverage to real connectivity. Release evidence binds commit, fixture digest, environment and exact dependency lock.

Exit requires stable child acceptance mapping, all critical tests passing, no unresolved material data/money defect and operational ownership. Deferred noncritical findings require explicit risk disposition. Unknown external authority blocks only the affected real operation, but must remain visible in readiness.''',
'requirements-to-test-matrix':'''[Traceability CSV](../_meta/traceability.csv) is the machine-readable source linking parent, child, product, persona/channel, screen, permission, flag, business rule, entity, API, event, integration, test, budget, docs, planned implementation and slice. Multiple acceptance IDs in a cell are semicolon-separated; no blank cell counts as coverage. Inapplicable fields begin `N/A:` with the specific reason.

R03 owns requirement semantics, R13 owns test design and R17 checks references. A path existing does not prove its cited requirement is addressed. Review every compound capability against S00 and every material product variation against its fixture. If an operation or acceptance ID is only planned, mark the row partial and retain the exact missing contract/test behavior.

Gate: compare registry parent/product sets against immutable baseline and require child IDs and acceptance references. Perform substantive review of missing fields, state transitions, denial, concurrency and provider failure cases. Record structural and semantic completion separately.''',
'test-data-and-synthetic-fixtures':'''Fixtures use fabricated identities and opaque UUIDs, synthetic carrier names and `.invalid` endpoints; no copied customer records. Product fixtures distinguish incompatible risk dimensions, ages/dates, riders and evidence. Monetary numbers demonstrate arithmetic only and are not offered rates.

Security seed: User A owns personal policy P1 and employee record E1 in organization O1; User B owns P2/E2 in O2; User C belongs to both O1/O2; carrier K1 sees only its transactions; seller S1 has a revocable delegation for P1. Add separate requester/checker/finance accounts and revoked-session variants. Test anonymous guessed IDs, cross-context exports, small-cohort health reports and stale client caches.

Performance seed follows the central workload registry and deterministic seed. Include expired/future/cancelled policies, duplicate external references, incomplete uploads, unknown outcomes, zero remaining refunds and stale approvals. Retain schema versions and fixture hashes so a changed fixture cannot silently improve benchmark results.''',
'unit-property-and-integration-testing':'''Unit tests cover eligibility, normalization, coverage compatibility, flag precedence, date intervals and permission predicates with deterministic clocks. Property tests generate balanced monetary allocations, refund sequences, concurrent budget reservations and state-event sequences; assert nonnegative remaining balances, conservation and no illegal transition.

Integration tests use actual PostgreSQL transaction behavior: unique receipt/source keys, row locks, outbox atomicity, leases, migration constraints and tenant filtering. Simulate failure between every transaction write and commit. A rollback must expose neither purchase nor event; a successful commit must survive worker restart.

Do not mock the component whose invariant is being claimed. Keep provider I/O outside transactions, and test timeout/cancellation separately from local rollback. Test deadlock retry only where business idempotency permits it. Evidence includes SQL constraint errors and resulting journal/state, not merely HTTP 200.''',
'contract-and-adapter-testing':'''Validate canonical request/response fixtures against versioned schemas before testing carrier mappings. Run all three [fictional simulator](../07-integrations/simulated-carriers/) contracts: synchronous REST, asynchronous SOAP/polling, signed custom callbacks. Disable XML external entities; reject unsigned/replayed callbacks before state mutation.

Scenarios include duplicate callback, malformed response, timeout-after-acceptance, missing idempotency/status, throttling, token expiry, partial outage and mapping-version change. Distinguish permanent business rejection from mapping error, transient transport failure and unknown external outcome. Assertions inspect durable state, stable business key, event order and recipient-only fields.

Real sandbox certification requires actual documentation, credentials and provider evidence; it is blocked in this task. Contract syntax validity alone does not prove actual provider compatibility. Keep local, sandbox and live-certification statuses separate.''',
'e2e-dashboard-and-channel-matrix':'''Execute customer, corporate buyer, employee, seller, carrier, admin and staff workflows with B2C/B2B On/On, On/Off, Off/On and Off/Off. For B2B-on test each corporate/commercial/reseller/B2B2C subchannel individually and in mixed settings. Employee servicing remains independently available; insurer transport does not depend on the B2B buyer flag.

Exercise direct sale, negotiated group/credit approval, seller delegation, dependent enrollment, underwriting, asynchronous issuance, policy access, claims and finance exceptions. Assert disabled menu and direct API behavior; hidden navigation is not authorization. Every dashboard tests loading, empty, error, forbidden, read-only, disabled, partial, expired and success states.

Switch organization during a loaded table/detail/export, revoke role on another replica and return via browser back. No previous-context private response may remain visible after the transition. Bulk actions reauthorize each object and report per-row outcome without leaking inaccessible IDs.''',
'tenant-permission-and-cache-isolation-tests':'''Negative matrix: two users in two tenants; dual-membership user; carrier staff; seller delegate; employer HR; finance-only staff; anonymous client; revoked role. For each private GET/command/export/document grant try replacing resource, subject, organization, carrier and seller IDs independently. Assert property-level projection, not only HTTP status.

Cache probes: prime as A then request as B; switch organization in same tab; revoke role and reuse ETag/router navigation; log out then browser back; rotate permission revision; route requests across two replicas; replay expired document URL. Private response must not become shared cache content. Public catalog cache must exclude negotiated pricing.

Employer health reporting tests cohort threshold, complementary suppression, repeated filters and exports to prevent differencing. Audit sensitive access without writing medical payloads. Fail release on any cross-context disclosure regardless of measured latency.''',
'accessibility-localization-and-mobile-tests':'''Target WCAG 2.2 AA; automated checks supplement manual keyboard and screen-reader review. Test focus order, error summary association, accessible names, status announcements, contrast, zoom/reflow, modal trapping/return and non-color state labels. Compare plan tables and approval forms need full keyboard paths.

Persian RTL tests isolate Latin policy/plate/IBAN-like identifiers and amounts, preserve meaningful DOM order, use logical layout properties and avoid mirrored numeric meaning. Test digit input normalization without changing identifiers, explicit rial/toman labels and leap/effective-date boundaries. Record calendar and timezone in tests rather than trusting host locale.

Mobile tests include camera permission denied, upload retry, slow connection, background/resume, deep link while signed out and notification permission revoked. Offline shell never presents stale claim/payment/policy coverage as authoritative. PWA installability is separate from native application acceptance.''',
'performance-and-failure-injection-tests':'''Use the exact operation mix, arrival model, dataset and environment in [performance budgets](../_meta/performance-budgets.yaml). Test warm/cold public caches, sensitive cache isolation, one carrier outage, ten-carrier fan-out, callback duplication, queue catch-up, cache loss and noisy-neighbor import. Capture p50/p95/p99, error types, query count/time, pool waits, event-loop lag, heap, queue age and paid-unissued age.

Record load generator saturation and achieved throughput; failed operations cannot disappear from denominator. Provider latency is separate from own-service boundary. Use representative quote/checkout/portal workloads, never a health endpoint as a substitute. Run burst, steady, soak and recovery with complete fixture/lock/config provenance.

R06 must approve regressions against the central baseline; no existing benchmark result is claimed here. Performance release gate requires measured evidence plus correct money/authorization behavior during injected faults.''',
'financial-and-state-machine-tests':'''FIN-01: for every journal/currency, debits equal credits and every source key posts once. FIN-02: duplicate verified callbacks preserve one receipt and one purchase commitment. FIN-03: concurrent refunds cannot exceed verified refundable amount and cannot turn promo credit into cash. FIN-04: credit commitments reserve limit atomically and do not mark payment paid. FIN-05: seller/insurer settlement uses approved allocation and independent checker.

STATE-01: payment verified does not imply issued/active. STATE-02: poll/callback races cannot downgrade issued. STATE-03: unknown submit/payout blocks automatic non-idempotent replay. STATE-04: pre-disable commitment continues authorized servicing. STATE-05: historical rule/consent/mapping versions remain resolvable after publication of new versions.

Use model-based event sequences including crash/restart and duplicate/reordered delivery. Compare DB state and journal projection to a reference model after each step. Invalid commands leave no partial monetary effect; compensations are linked new records, never deleted history.''',
'documentation-contract-validation':'''Run `python3 docs/_meta/validation/validate.py` from the repository root using the pinned documentation validation environment. The validator checks registry JSON Schemas, frontmatter, unique identifiers, internal links, manifest paths, baseline counts, child/acceptance references and contract references. OpenAPI validation uses a standards-aware validator when available; the report states unavailable validators explicitly.

The metadata YAML files use JSON syntax, a valid YAML subset, for deterministic parsing. Contract schemas use JSON Schema 2020-12, OpenAPI 3.1.0 and AsyncAPI 3.0.0. Complete generated-artifact checks compare inputs and outputs; manual changes must be reflected in the owning generator/data or regeneration will overwrite them.

Structural pass is necessary but insufficient. R03/R13/R17 review content for lost compound scope, generic cloned semantics, missing operation-specific fields, fake acceptance coverage and unsupported completion claims. Keep partial status until these are resolved. The [review findings](../_meta/review-findings.md) and [continuation ledger](../_meta/continuation.md) are authoritative for remaining work.''',
'release-quality-gates':'''G0 documentation: baseline preserved; substantive requirements and contracts reviewed; all schema/link/reference checks pass or precise missing validation recorded. G1 local: strict TypeScript/lint/import rules; unit/property/integration/contract tests; no app implementation exists yet. G2 sandbox: actual provider certification, security-negative matrix and representative performance workload. G3 recovery: restore, migration rollback, queue recovery and unknown-outcome incident rehearsal. G4 production: authorized contracts/licensing, human risk sign-offs, staffed on-call and rollback plan.

No gate can be passed by plans or generated text alone. A pending insurer agreement blocks affected live operations; a missing money or authorization invariant blocks release across affected channels. Feature flags restrict exposure but cannot compensate for absent server authorization.

R18 records owner, evidence digest, test environment/version, reviewer and decision for each gate. Quality waivers require explicit approver authority and expiration; no waiver may fabricate external authority or redefine a successful payment as coverage.'''}
for slug,body in quality.items():doc('11-quality/'+slug+'.md',slug.replace('-',' ').capitalize(),body,'R13')

doc('11-quality/acceptance-scenarios/critical-invariants.md','Critical acceptance scenarios','''## AC-CORE-FLAG
Given a committed paid order before B2C is disabled, when delivery worker consumes its event later, then issuance continues unless a separate security quarantine applies; a new direct commitment fails, personal policy access/installments remain and control revisions are audited.

## AC-CORE-UNKNOWN
Given carrier submission may have succeeded and carrier supports neither idempotency nor authoritative status, when timeout occurs, then state is external_outcome_unknown, paid/unissued remains visible, automatic replay stops and verified reconciliation is required before resubmission/refund.

## AC-CORE-TENANT
Given one user belongs to two employers and owns personal health insurance, when switching employer context and exporting, then only the active employer's permitted nonmedical projection is present; previous context data and private policies are absent.

## AC-CORE-CREDIT
Given an approved invoice-backed purchase, when commitment is recorded, then receivable and credit reservation exist without a cash receipt; later invoice payment creates no duplicate issuance event.

## AC-CORE-ATOMIC
Given injected crash before purchase/outbox transaction commits, neither is visible; given crash after commit, durable recovery dispatches the obligation using the original business identity. Duplicate delivery may occur but cannot duplicate business effect.

## AC-CORE-REFUND
Given verified funds and two concurrent refund requests, lock/constraint enforcement ensures total approved and confirmed refunds never exceeds refundable funds; uncertain payout blocks replay and bank change invalidates previous approval.

These are acceptance designs awaiting application execution. Stable feature and product cases live in their own specs; no passed result is implied.''','R13')

delivery={
'dependency-map-and-vertical-slices':'''```mermaid
flowchart LR
  S0[Identity, tenancy, flags, contracts, audit] --> S1[Catalog and quote]
  S1 --> S2[Payment, ledger, delivery, issuance]
  S0 --> S3[Corporate and seller controls]
  S2 --> S3
  S2 --> S4[Servicing and claims]
  S3 --> S4
  S0 --> S5[Growth and reporting]
  S2 --> S5
  S2 --> S6[Automotive providers and commerce]
  S6 --> S7[Separately gated trading and referrals]
```

S0 includes testable privilege revocation and all four sales-mode combinations. S1 demonstrates progressive offers with one provider unavailable. S2 must survive payment callback duplication and crash-after-commit, and retain unknown insurer outcomes. S3 tests employer/employee privacy and maker-checker credit semantics. S4 adds product-specific endorsements, renewal and claims with authority restrictions. S5 cannot expose transactional data through analytics. S6 distinguishes bookings/stock/receipts from insurance issuance. S7 requires separate regulatory/provider decisions; native applications remain an independent scope decision.

Every slice includes a vertical path through presentation, Nest use case, owned persistence, tests, telemetry and operator recovery. No stage is considered done by adding routes alone. Deferred products remain in registry and backlog.''',
'implementation-backlog':'''The canonical work-item rows are [traceability](../_meta/traceability.csv): one child requirement per row with planned module, contract operation, acceptance test, budget and release slice. IDs remain stable through scheduling; child refinements append IDs rather than renumbering delivered work.

For each work item implement domain rules/DTO validation/authorization in its assigned Nest module, a typed contract client and allowed screen in Next, migrations/indexes with bounded backfill, synthetic fixtures and failure tests. Default flag remains off until evidence passes. Rollback disables new entry, preserves committed servicing and reverts only compatible app changes; migrations use expand/contract. R13 requires unit/property/integration/contract/E2E/security/performance evidence according to risk.

S0 foundation tasks additionally require strict TS/package lock, boundary lint, schema generation, full documentation validators, immutable configuration and audit, ledger constraints, per-order serialization and receiver inbox/outbox. Build contracts before UI mutation paths. Work item completion requires exact changed files, test commands/results, performance/security gate, migration/flag strategy and reviewer evidence; all are currently planned application work.''',
'milestone-acceptance-gates':'''M0: docs structurally valid and substantive gaps explicitly closed; R17/R03 own evidence. M1: identity/tenancy/flags plus synthetic quote journey; R11 checks isolation and R06 measures first/partial results. M2: verified payment to issued policy through simulator crashes/unknown outcomes; R12/R09 verify financial and delivery invariants. M3: corporate credit, reseller and beneficiary flows; R02/R20 validate operations and health privacy. M4: servicing, claims, growth, automotive and all product-family variants with contracts/authority as applicable.

Every milestone has separate documentation-ready, local-test-ready, sandbox-certified and production-enabled status. Do not label a feature live because its mock endpoint returns success. Scope completeness includes disabled features and native-app uncertainty.

Release requires security/accessibility review, restore and rollback evidence, representative performance results and staffed incident ownership. No such application evidence exists in this documentation task. R18 records human decisions in the approval register when supplied.''',
'integration-and-commercial-blockers':'''[Risks and blockers](../_meta/risks-and-blockers.yaml) contains the missing inputs, owner, affected scope, safe default and launch consequence. At minimum: jurisdiction/licensing/residency; carrier agreements/rates/schemas; payment/refund authority; credit/financing terms; claims delegation; official inquiry rights; automotive/logistics contracts; regulated rewards/trading/referrals; infrastructure and capacity budgets; native scope.

R09 may implement fictional/local boundaries and contract tests without credentials. Only executed agreements and actual provider sandbox evidence can move a connection from simulated to sandbox-validated; live certification is separate. Secret values never enter documentation, examples or logs.

Unknown outcomes require provider reconciliation mechanisms; if neither status nor idempotency exists, the commercial/operating agreement must define manual evidence and remediation. An integration without this procedure cannot be production-enabled even if happy-path transport works.''',
'definition-of-ready-and-done':'''Ready: stable requirement/acceptance IDs; product/carrier variation understood; API/schema and field permissions reviewable; state/transaction boundary and failure behavior specified; test fixtures and budgets chosen; missing authority isolated behind disabled live operations; owner assigned.

Done for documentation: substantive sections, resolvable contracts and links, preserved compound scope, honest metadata/status, structural checks and semantic review. Done for implementation additionally requires actual code, compatibility lock, passing risk-based tests, measured budget evidence, migration/rollback and runbook rehearsal. Done for live capability additionally requires real contracts/certification and human approval.

No unreviewed generated artifact is accepted. A blocked production integration may have documentation done if its sandbox interface and operational restriction are complete. A missing field contract or acceptance behavior is a documentation gap, not an external dependency.''',
'implementation-handoff':'''Start at [documentation status](../_meta/documentation-status.json), [continuation](../_meta/continuation.md) and [review findings](../_meta/review-findings.md). They distinguish written artifacts, validation evidence and exact outstanding gaps. No application has been implemented, tested or deployed.

R05 reviews proposed ADRs before scaffolding. R07/R08 then pin exact supported package versions and commit a lockfile with compatibility/security evidence, keeping Next presentation and Nest domain ownership. R13 builds synthetic and contract tests before real provider integration. R09/R19/R12 secure actual contract/authority evidence without placing secrets in repository.

Implement dependency-ordered slices; select a product with authorized contract for first sandbox journey without deleting the other families. Every changed contract regenerates clients/fixtures and updates traceability. Preserve existing unrelated work. Run documentation checks after changes and record real test evidence before any readiness claim.'''}
for slug,body in delivery.items():doc('14-delivery/'+slug+'.md',slug.replace('-',' ').capitalize(),body,'R18')
print('Wrote 16 workflows, quality specifications and delivery handoff.')
