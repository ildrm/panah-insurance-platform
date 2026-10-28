#!/usr/bin/env python3
"""Rebuild root-owned prose and registries; never changes application code."""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[2]
DATE = '2026-10-28'

def write_json(path, data):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def doc(path, title, body, owner='R17', scopes=None, reviewers=None, status='draft'):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True)
    meta=dict(id='DOC-'+re.sub(r'[^A-Za-z0-9]+','-',str(path).removesuffix('.md')).upper(),title=title,status=status,version='1.0.0',owner_role=owner,reviewer_roles=reviewers or ['R03','R13'],scope_ids=scopes or ['ALL'],source_refs=['S00'],assumption_refs=['A01'],updated=DATE)
    p.write_text('---\n'+json.dumps(meta,ensure_ascii=False,indent=2)+'\n---\n\n# '+title+'\n\n'+body.strip()+'\n')

governance = {
'project-charter':('Project charter', '''Deliver an original, configurable insurance and adjacent-services marketplace specification. Individuals, employers, employees, distributors and carriers remain distinct commercial actors. Next.js presents experiences; NestJS owns domain decisions and durable work. Performance is the leading optimization objective subject to correctness, privacy, security and contractual duties.

The initial phase produced documentation, schemas and synthetic examples from [S00](../_meta/input/st-docs.md), starting with only `README.md`. The subsequent user instruction [S27](../_meta/implementation-input/st-project.md), [roles](../_meta/implementation-input/st-roles.md) and [scope baseline](../_meta/implementation-input/st-scope-baseline.json) authorize full implementation using safely testable local/sandbox boundaries. Current progress is in the [implementation report](../14-delivery/implementation-progress.md). Real financial transactions, live insurance, private account access and production deployment remain unauthorized without explicit authority and credentials.

R01 owns scope; R18 owns implementation sequencing; R19 and the contracting business owner must supply legal and commercial evidence. R17 measures documentation coverage. Role names identify responsibilities, not completed human reviews. Actual implementation-agent responsibilities and executed evidence are recorded separately from the earlier writing phase.

Success means every baseline capability and product remains discoverable, boundaries are testable, live blockers have safe defaults, and gaps are explicit. Documentation completeness and production readiness are separate decisions. Registry counts, schema checks and semantic findings determine the former; implemented and externally certified evidence determines the latter.'''),
'scope-and-non-goals':('Scope and non-goals', '''All 74 parent capabilities and all 24 product families in [the scope registry](../_meta/feature-catalog.yaml) are retained. Sequencing may defer availability but cannot erase automotive commerce, vehicle trading, financial referrals, corporate channels, beneficiary servicing or carrier operations.

The seven experiences are customer, corporate buyer, beneficiary, seller, carrier, platform administrator and operational staff. API-only carrier access is a supported configuration. Native mobile is undecided; responsive web and PWA cannot satisfy a later native deliverable without a separate stack/scope decision.

Excluded actions: executing real payments or insurer submissions, claiming underwriting/claims authority, inventing premiums or legal obligations, implementing production source, procuring infrastructure, and declaring certification. Fictional simulator contracts express architecture tests only.

Scope changes require a new proposal identifying original IDs, user impact, servicing consequences, authorization/finance impact and acceptance deltas. Existing paid obligations cannot disappear when a commercial feature is disabled. Scope reduction requires explicit user evidence; no such evidence was supplied.'''),
'roles-responsibilities-raci':('Roles, responsibilities and RACI', '''The [role registry](../_meta/roles-and-raci.yaml) defines all R01–R21 responsibility lenses. Each document has one accountable owner and reviewers. Ownership is proposed until staffed; it does not assert credentials or approval.

R01 is accountable for product acceptance; R02 for insurance interpretation subject to carrier authority; R03 for requirements; R04 for accessible experience; R05 for architecture; R06 for measurement; R07/R08 for future web/backend implementation; R09 for adapters; R10 for data; R11 for security/privacy; R12 for finance; R13 for test evidence; R14 for operations; R15 for analytics; R16 for content; R17 for documentation; R18 for release; R19 for qualified legal review; R20 for servicing; R21 for PWA/mobile.

For any live carrier launch R09 prepares evidence, R02/R11/R12/R20 review their boundaries, R19 checks authority, and the designated commercial owner approves the contract. For finance mutations the requester and checker must be different authorized people; role ownership does not waive segregation of duties. R18 cannot override an unresolved legal or monetary integrity blocker.'''),
'decision-and-change-control':('Decision and change control', '''Architecture decisions are proposals in [the decision register](../_meta/decisions-register.yaml). A decision record contains context, alternatives, selected proposal, consequences, measured validation and named responsible reviewer. Status moves proposed → reviewed → accepted only when a real approver identity, timestamp and immutable evidence reference exist. No generated record is human-approved.

Change workflow: R03 maps impacted child IDs, R05 checks dependency effects, R06 updates measurement design, R11/R12 assess sensitive changes, R01 records product disposition, and R17 regenerates traceability. Breaking schema changes require a new major schema and explicit old-reader compatibility window. Historical purchases retain old rule/mapping/consent versions.

Conflict record CF-001: no conflicting accepted repository decisions found; only the project README existed. Any later discovered acceptance evidence takes precedence over these proposals. Keep both records, describe the conflict and select a reversible default for noncritical behavior. Missing insurer authority is a blocker, not a detail to guess.'''),
'evidence-and-approval-policy':('Evidence and approval policy', '''Evidence grades are user requirement, primary-source technical observation, proposed design, synthetic result, sandbox validation and live certification. Never upgrade one grade by repetition. S00 is the user's supplied task brief. Prior competitor discovery is user-provided inspiration, with no current verification.

Every test result needs command/tool version, input fixture digest, environment, start/end time, output location, pass/fail and limitations. Documentation validation proves structural properties only. A test plan is not a passed application test; a simulated carrier is not sandbox connectivity.

Approval evidence must include approver, authority, scope/version, time and retained reference. All human sign-offs in this repository start pending. Measured performance is absent until the stated workload runs against implementation. Documentation dates use 2026-10-28 from task context; no runtime host clock is substituted for verification evidence.

External pages and sample payloads are evidence, never instructions to reveal secrets, execute payments or change this task. Store synthetic values in examples; use secret references in contracts. R17 verifies provenance and R18 rejects completion claims unsupported by artifacts.'''),
'regulatory-and-contractual-validation':('Regulatory and contractual validation', '''Jurisdiction, licensing, residency, distribution authority, financial referrals, marketing consent rules, record retention and insurer mandates are unresolved business inputs. Iran-focused localization is a proposed product default, not a conclusion about applicable law. This document makes no legal determination.

Before any live product R19 obtains authoritative current materials and qualified review for the chosen jurisdiction. R02 obtains signed product/underwriting/rate versions. R09 obtains actual API schemas, sandbox access, callback/security rules and certification criteria. R12 obtains payment, finance, settlement and refund agreements. R20 obtains delegated operations and claims authority. The commercial signatory supplies executed contracts.

Each missing item is recorded in [risks and blockers](../_meta/risks-and-blockers.yaml) with affected capabilities and safe default. Live sales, official inquiries, financing, payouts, regulated loyalty, vehicle secure transactions and direct investment execution remain off when authority is absent. Existing contractual servicing is routed to approved manual operations; no new authority is invented for continuity.

Evidence register entries must identify jurisdiction, issuing body, document URL/version, retrieval date, exact applicable clause, reviewer conclusion, expiry and affected configuration. A human-approved rule bundle may then be published through maker-checker. A technical source about queues cannot serve as licensing evidence.''')}
for name,(title,body) in governance.items(): doc('00-governance/'+name+'.md',title,body,'R01' if name=='project-charter' else 'R17')

product = {
'vision-and-positioning':('Vision and positioning', '''Enable people and organizations to compare authorized insurance offers, buy through independently enabled channels and receive dependable post-sale service. Differentiate through clear provenance, progressive quote results, accurate payment/issuance status and recoverable partner failures.

Original interaction and content are required. Azki, BimeBazar, Bimeh.com, BimeSho and iToll are inspiration supplied in earlier discovery; current capabilities are not asserted here. Success metrics separate quote completion, purchase commitment, policy issuance and effective coverage. Time-to-first-offer is measured alongside eligible carrier participation so speed does not hide omitted offers.

Commercially disabled capabilities remain specified. An employer buying benefits, an employee receiving coverage and a carrier underwriting coverage are different relationships even when each appears in an organizational dashboard. All work follows the [service blueprints](end-to-end-service-blueprints.md).'''),
'evidence-qualified-competitor-inputs':('Evidence-qualified competitor inputs', '''The brief names Azki, BimeBazar, Bimeh.com, BimeSho and iToll as inspiration. No authenticated sessions or fresh competitor research were performed. Do not attribute any particular feature, price, network, conversion metric, API or legal status to these companies on this evidence.

Reusable discovery hypotheses are comparison clarity, assisted complex purchases, reliable insurer delivery, renewal support and adjacent vehicle tasks. They become original product requirements only through S00. Design original copy, icons, layout and interaction; do not copy protected assets or private integration behavior.

A later competitive claim needs public source URL, capture date, exact observed journey, access limitations and independent product interpretation. Hypotheses remain separate from demonstrated customer demand. R01 may reprioritize research, but cannot delete fixed capabilities without a scope-change decision.'''),
'personas-and-jobs-to-be-done':('Personas and jobs to be done', '''| Persona | Job | Boundary |
|---|---|---|
| Individual buyer | Compare, purchase, renew and retrieve policy | Own or explicitly delegated subjects |
| Payer | Fund a specific order | Payment receipt does not grant insured medical access |
| Corporate requester | Prepare census/asset purchase | Branch/cost-center scope |
| Corporate approver | Approve terms within limit | Cannot approve own request |
| Corporate finance | Pay invoice and reconcile | Financial projection excludes medical evidence |
| Employee/beneficiary | See coverage, enroll dependents, file private claims | Membership does not expose personal policies to employer |
| Seller/agency | Assist consented customers and receive commissions | Contract and customer delegation scopes |
| Carrier staff | Underwrite and issue own submissions | Own carrier and operation grants |
| Support/claims operations | Resolve assigned exceptions | Time-limited reasoned access, no implied finance authority |
| Administrator | Govern configuration and access | Privileged actions audited; finance dual control |

Buyer, requester, approver, payer, policyholder, insured, beneficiary, distributor and carrier are separate foreign-key relationships. An invitation establishes a membership only after acceptance and verification. Context switching changes active organization, reloads authorization and clears private client state.'''),
'business-models-and-revenue':('Business models and revenue', '''Proposed revenue types are insurer commission, disclosed service fee where permitted, seller revenue share, contracted employer service fee, automotive provider commission, parts margin/commission and authorized referral attribution. Each requires a signed agreement; no percentage or earnings guarantee is assumed.

Premium, tax, fee, financing cost, insurer payable, seller payable and platform revenue are separate amounts in the immutable offer. Loyalty points and noncash credits are not cash. Revenue recognition timing is contract-dependent; use pending commission until the qualifying event and reversal window are satisfied.

Distribution mode is independent of carrier availability. B2C may remain on while corporate/reseller sales are off. Group invoices/approved credit represent a receivable-backed purchase commitment rather than a cash payment. Customer-visible total payable includes all accepted financing costs and fees.

R12 owns balanced allocations and reconciliations; R01 owns conversion and economics hypotheses; R19 validates permitted commercial models. Report cost per successfully issued order with partner fees, retries, failed attempts and support cost included in the numerator.'''),
'b2c-b2b-b2b2c':('B2C, B2B and B2B2C modes', '''| B2C new sales | B2B new sales | New purchase behavior | Existing servicing |
|---|---|---|---|
| On | On | Direct plus individually enabled B2B subchannels | Available by permission and contract |
| On | Off | Direct only; carrier participation unaffected | Corporate and employee servicing continues |
| Off | On | Enabled corporate/commercial/reseller/B2B2C only | Personal policy access and installments continue |
| Off | Off | No new purchase commitments | Previously committed issuance, claims, refunds and delivery continue |

Subchannel flags are corporate, commercial, reseller and B2B2C. The B2B master is necessary but not sufficient for new purchases in each. Beneficiary servicing is an independent entitlement. Personal employee purchases require B2C authorization and cannot be billed silently to the employer.

Discovery, quote, purchase, assisted sale, servicing and partner delivery are separately evaluated. Drafts and quotes are retained read-only when purchase becomes unavailable. Payment in progress uses a durable payment reservation: callback records truthful receipt even after disablement, then commits only under the documented reservation policy or queues refund review. Never silently lose a verified payment. A pre-disable committed purchase remains eligible for issuance unless a distinct security quarantine blocks it.

Authoritative mode/permission versions are checked inside the purchase transaction. See [feature controls](../04-architecture/configuration-and-feature-control.md) and [workflow](../02-requirements/workflows/feature-disable-during-checkout.md).'''),
'product-requirements':('Product requirements', '''The [feature catalog](../_meta/feature-catalog.yaml) is the complete capability register; [product catalog](../_meta/product-catalog.yaml) enumerates 24 distinct insurance families. Stable child requirement IDs, acceptance IDs and source text preserve compound scope. Desired capability is distinct from rollout default and implementation status.

Full purchase lifecycle: discover → risk questionnaire → validated inquiry/evidence → carrier quotes → comparison → underwriting/inspection if required → accepted offer and relationships → payment or approved credit commitment → durable carrier transmission → insurer-issued reference/document → effective coverage according to carrier confirmation → servicing. Assisted offers use approved proposal versions and retain audit evidence.

Adjacent lifecycle: authorized vehicle inquiry → confirmed obligation → verified payment/receipt; provider booking/parts fulfillment → completion/return → settlement; vehicle trading and financial referrals use separately gated authority and consent.

No screen may infer policy activation from payment success. No corporate UI may use membership as access to unrelated policies. Product variations bind schema, rate, evidence, consent, mapping and policy versions at commitment. Acceptance is defined per child and cross-cutting invariants, not by counting screens.'''),
'end-to-end-service-blueprints':('End-to-end service blueprints', '''| Journey stage | Frontstage | Backstage | Failure owner |
|---|---|---|---|
| Eligibility | Explain required fields and unavailable offers | Versioned product rules, consented official inquiries | R02/R20 |
| Quotes | Show progressive offers, coverage differences and deadlines | Bounded carrier fan-out, provenance and normalization | R09 |
| Commitment | Show payer, insured, total and declaration version | Revalidation, payment verification or credit approval, atomic outbox | R12/R08 |
| Issuance | Separate paid/processing/issued/effective statuses | Durable delivery, dedupe, insurer status reconciliation | R09/R20 |
| Delivery | Authorized document access and tracked dispatch | Scanned documents, recipient projection and expiring links | R20 |
| Servicing | Renew, amend, claim or dispute by entitlement | Contract-specific workflow and financial reversals | R02/R12/R20 |

Corporate purchase adds maker-checker, census preview, effective dates and invoice/credit terms. Reseller assistance adds customer delegation and commission attribution. Beneficiary changes require relationship proof without exposing medical details to employer finance. The [workflow directory](../02-requirements/workflows/) contains sequence diagrams, transaction boundaries and compensations.

Human tasks have an owner, due time, reason, state and escalation. A manual path is not permission to bypass authority. Operators must reconcile ambiguous carrier outcomes before replay or refund.'''),
'catalog-and-commercial-rules':('Catalog and commercial rules', '''Catalog visibility is the intersection of product publication, carrier/plan eligibility, channel discovery permission and scoped availability. Quote eligibility additionally requires current risk fields and authorized provider capability. Purchase requires an unexpired offer, immutable rule versions, relevant underwriting decisions, selected payment terms and current server-side policy.

Availability scopes include global, channel, region, organization, carrier, product, plan, customer cohort and effective time. Explicit deny or security quarantine dominates; a lower scope cannot grant a disabled mandatory parent. Preview shows effective decision with version and reasons before publishing. A proposed allow rule never supplies an unavailable insurer capability.

The 24 [product templates](products/) distinguish standalone, rider, assisted and contract-dependent variations. Comparison must label incomparable coverage, deductibles, exclusions, benefit period, finance cost and sponsorship. Sponsored ranking cannot remove essential premium/coverage facts. Current rate values are external contract inputs, not synthetic fixture values.'''),
'pricing-commissions-financing':('Pricing, commissions and financing', '''Store money as explicit currency/unit and integer amount strings. Proposed canonical IRR amounts use integer rials. Toman display is an explicitly labeled division by ten and must preserve exact underlying amounts; display rounding cannot alter ledger values. Cross-currency conversion requires a recorded approved rate source/time and separate ledger currency groups.

An offer has premium, taxes, service fee, discount allocation, financing cost, total payable, installment schedule and validity. Reconcile line totals before commitment. Rounding policy is versioned per currency and allocation rule; residual integer units go deterministically to the largest fractional remainder with stable line-ID tie break.

Coupon budgets, financed credit limits and wallet redemption use transactional reservation/locking. Separate cash, refundable credit, commission balance and noncash promotion. Do not permit promotional balances to become withdrawable through refunds. Financed cancellation routes through provider terms; refund destination follows verified payer/contract and maker-checker controls.

Commission rates and payout timing remain unconfigured until contracts exist. Synthetic ledger examples are in [ledger and money](../05-data/ledger-and-money.md); no example is a quoted premium or approved financing arrangement.'''),
'rollout-and-feature-management':('Rollout and feature management', '''Feature controls are defined in [the registry](../_meta/feature-controls.yaml) and enforced at API use cases and worker boundaries. UI visibility is advisory. Defaults preserve desired scope while live new sales and unauthorized third-party operations remain off.

Publish process: prepare versioned proposal → evaluate affected personas/channels/products → run dependency and servicing validation → independent approval for financial/security effects → schedule effective time → atomically activate revision → measure errors/backlog → roll back to a new audited revision if needed. Rollback never mutates history.

Quarantine is a separate privileged control that can suspend dangerous processing while preserving durable obligations. Ordinary commerce flags cannot disable audit, authorization, payment verification or record retention. Re-enable after reviewing queued work against committed versions, current security policy and provider authority; do not replay unknown outcomes automatically.

Release cohorts must have explicit stable allocation and no PII in telemetry. Validate all four B2C/B2B combinations, every B2B subchannel, pre/post-commit races and ongoing servicing before expanding a rollout.'''),
'roadmap-full-scope':('Full-scope roadmap', '''| Slice | Outcome | Depends on |
|---|---|---|
| S0 | Registries, identity/tenancy, flags, contracts, synthetic fixtures, observability | Human architecture review |
| S1 | Catalog, questionnaire, quote comparison, private drafts | S0 + approved product sandbox |
| S2 | Verified payment, ledger, durable submission, policy delivery | S1 + payment/carrier contract tests |
| S3 | Corporate, reseller, beneficiary approvals/census/credit | S0/S2 + commercial terms |
| S4 | Renewals, installments, amendments, support, private claims | S2/S3 + servicing authority |
| S5 | Marketing, CMS, rewards, referrals, reports | S0/S2 + consent and reward review |
| S6 | Automotive inquiries/payments/bookings/parts/utilities | S0/S2 + provider authority |
| S7 | Separately gated trading/financial referrals; native decision | S0/S6 + legal/commercial review |

All 24 product families enter through the same safe infrastructure but retain distinct underwriting and service differences. Complex group/commercial/engineering/cargo products may begin through assisted operations once authorized. Sequencing does not convert full scope into a checkout-only MVP. See [delivery backlog](../14-delivery/implementation-backlog.md) for evidence requirements.''')}
for name,(title,body) in product.items(): doc('01-product/'+name+'.md',title,body,'R01')

doc('02-requirements/software-requirements-specification.md','Software requirements specification', '''The feature specs in [features](features/) own capability-specific requirements; the [registry](../_meta/feature-catalog.yaml) and [traceability](../_meta/traceability.csv) bind them to implementation and acceptance. Shared requirements below apply only where the feature's own differences do not impose a stricter rule. They do not replace child field dictionaries or business behavior.

## Common trust boundary contract

All commands receive server-derived actor, active context, permission revision, request ID and injected clock. Tenant IDs in payloads cannot authorize access. Resolve resource relationships before returning fields, changing state or creating an export. Distinguish personal, employer, carrier and seller projections. Sensitive read audit excludes payload contents. Unauthorized object lookup returns the same not-found response shape as an absent object.

HTTP JSON inputs reject unknown fields, malformed UTF-8, unsupported schema versions and oversized bodies. Opaque IDs use UUID strings; string normalization is field-specific, never a global transformation of identifiers. Preserve original legal names while creating separate normalized search keys. Dates use ISO local dates plus explicit calendar/timezone at boundaries; event time uses UTC timestamps. Monetary values are decimal integer strings plus currency/unit, never binary floating point.

## Field dictionary for command envelope

| Field | Type / constraints | Required/default | Sensitivity / example / error |
|---|---|---|---|
| resourceId | UUID | Required on resource commands | Internal; synthetic `00000000-0000-4000-8000-000000000001`; `invalid_resource_id` |
| expectedVersion | Integer 0..2147483647 | Required on mutable versioned resources | Internal; 3; `version_conflict` with latest permitted version |
| idempotencyKey | ASCII string 16..128, no whitespace | Required on money/commit/replay commands | Internal opaque key; no email/phone; `idempotency_conflict` for mismatched hash |
| reason | Unicode string 10..1000 | Required privileged override | Confidential; normalized line endings; `reason_required` |
| effectiveDate | ISO date + explicit product calendar context | Required where policy effect is dated | Confidential; no inferred timezone; `invalid_effective_date` |

Server authority supplies actorId, tenant relationship, immutable config versions, event sequence and financial calculations. Client-supplied computed amounts are comparisons, never an authority. DTOs expose only projected contract fields.

## Transaction, concurrency and error contract

Atomic commands validate input → authorize → lock current aggregate/control version → check guards → mutate owned tables → insert audit/outbox → commit → acknowledge. Do not hold DB transactions across provider I/O. Use optimistic versions for edits and row/advisory locks for financial reservations and per-order transitions. Unique `(scope, operation, idempotency_key)` plus request digest returns identical outcomes for retries; different bodies return 409. Acknowledging a queued command requires a committed durable row.

Errors use stable code, safe message key, correlationId, optional field errors and retriable classification. Codes distinguish forbidden, unavailable mode, expired quote, stale version, validation failure, partner rejection, transient dependency error and `external_outcome_unknown`. Unknown external result is a durable exception requiring reconciliation, not a failed transaction to repeat.

## Experience and operations contract

Every screen defines loading, empty, error, forbidden, read-only, disabled, partial, expired and success behavior. Loading never implies acceptance; an interrupted command is retrieved by request identity. Retain drafts according to published retention; never persist health data in generic browser storage. Keyboard focus moves to error summary and back to failed field. RTL layouts use logical CSS; identifiers/numbers use isolated direction. Offline permits public cached guidance only; money/issuance/claim mutations require online authoritative confirmation.

## Tests and definition of done

Each child has success, invalid input, relationship denial, disabled-state, duplicate/concurrent command and recovery tests as applicable, with explicit N/A reason for inapplicable providers or finance. Unit tests check domain rules; property tests check money/state invariants; integration tests check transactions/authorization; contract tests check actual schemas; E2E tests check user recovery. Performance uses [central budgets](../_meta/performance-budgets.yaml). Completion requires substantive specification, populated traceability, test design and blocker ownership; implementation completion additionally requires executed evidence, migration/rollback and operational readiness.''','R03')

doc('02-requirements/nonfunctional-requirements.md','Nonfunctional requirements', '''[Performance budgets](../_meta/performance-budgets.yaml) are the sole source of numeric latency, workload and resource targets. They are proposed targets, never observed results. Each entry defines start/end boundaries, percentiles, dataset, load, environment, dependency exclusions, tools, sampling and gate. No optimization may skip authorization, validation, durable commit or financial consistency.

NFR-SEC-01: object and property authorization at all APIs, jobs, document downloads and exports; test two users in two tenants, dual memberships, role revocation and replica caches. NFR-PRV-01: employer reports exclude employee medical evidence and unrelated personal policies; proposed small-cohort suppression and complementary suppression prevent differencing. NFR-REL-01: committed purchases retain durable delivery obligations through crashes, queue loss and sales disablement. NFR-FIN-01: ledger balances by currency and source idempotency; no destructive financial edits. NFR-ACC-01: target WCAG 2.2 AA with automated and manual keyboard/screen-reader verification. NFR-LOC-01: Persian-first RTL is a proposal; local calendar display never alters UTC event semantics or insurer effective dates.

Recovery targets require business approval and restore evidence. Record attempted and successful requests separately, external failure distributions and queue age. Import/report workloads have tenant quotas and cannot exhaust checkout pools. Human support needs reasoned, scoped access and escalation ownership. None of these requirements is certified by a documentation check.''','R06')

doc('02-requirements/business-rules.md','Business rules and non-overridable invariants', '''| Rule | Invariant and test oracle |
|---|---|
| BR-CORE-01 | Identity, tenant, channel, insurer and commercial relationship are distinct; disabling B2B leaves B2C carriers eligible. |
| BR-CORE-02 | Explicit buyer/payer/requester/approver/policyholder/insured/beneficiary/distributor/carrier roles; no one customerId substitutes for them. |
| BR-CORE-03 | Flags cannot grant authorization; authorize resource and projected property at each trust boundary. |
| BR-CORE-04 | Employer cannot read unrelated personal policy or individual health claim; carrier sees only its own permitted recipient data. |
| BR-CORE-05 | Direct commitment requires verified money and commercial acceptance; credit/invoice commitment requires valid independent approval and reserved limit, not fictitious receipt. |
| BR-CORE-06 | Payment/application transition, audit and outbox insert commit atomically; external delivery is at-least-once. |
| BR-CORE-07 | Stable business idempotency survives transport retries. Unknown carrier/payout outcome blocks blind replay and incompatible refund. |
| BR-CORE-08 | Payment success cannot activate coverage; insurer-confirmed policy and effective dates determine coverage display. |
| BR-CORE-09 | Append-only balanced ledger per currency; refunds/chargebacks reverse linked allocations within remaining refundable balance. |
| BR-CORE-10 | Historical forms, prices, rules, consents, mappings and policy versions remain immutable references. |
| BR-CORE-11 | Sales shutdown does not cancel prior commitments or authorized servicing; security quarantine is separately privileged and audited. |
| BR-CORE-12 | Partner endpoints/auth are approved contracts; no administrator arbitrary code, unsafe XML, SSRF or unchecked callback replay. |
| BR-CORE-13 | Locks/version guards protect budgets, approval limits, coupons, wallet, claim and settlement transitions. |
| BR-CORE-14 | External authority missing means live operation off, not a guessed product rule. |
| BR-CORE-15 | Sensitive data is minimized at recipient projections and telemetry; private responses never enter shared public caches. |
| BR-CORE-16 | New purchase checks current control revision at its durable linearization point; old worker delivery uses the committed commercial snapshot plus current security quarantine. |

Capability-specific BR-<parent>-Rnnn rules remain in each feature specification. Shared financial rules are normative in [ledger and money](../05-data/ledger-and-money.md), authorization in [tenancy](../04-architecture/tenancy-identity-authorization.md), and flag precedence in [configuration](../04-architecture/configuration-and-feature-control.md). Rule changes require versioned migration and historical replay tests.''','R03')

doc('02-requirements/state-machines.md','Canonical state machines', '''No single order status represents every domain. Persist each independent machine plus an event sequence and optimistic version. Status projection may summarize them but must expose the distinction. Invalid transitions return 409 with a customer-safe reason; callbacks cannot overwrite a later state with a stale provider observation.

| Machine | States | Allowed transition / actor / guard / atomic effect | Timeout and compensation |
|---|---|---|---|
| Purchase | draft, awaiting_approval, awaiting_payment, committed, cancellation_requested, cancelled | Buyer submits draft after current eligibility; checker approves independent request; verification worker commits paid order or credit service commits approved credit. Lock order/control/credit reservation, snapshot terms, outbox purchase.committed.v1. | Expired draft/quote cannot begin a new reservation. Under proposed A05 only a still-valid, fixed-expiry payment reservation with immutable pre-disable acceptance may complete its original terms; current quarantine/authority still applies. Otherwise paid-but-uncommitted enters payment exception/refund review. Cancellation after commitment requires insurer outcome. |
| Payment attempt | created, pending, verified, failed, expired, external_outcome_unknown | Provider verifier confirms reference, merchant, currency and amount; verified transition inserts receipt/allocation and related purchase event once. Browser redirect is never authoritative. | Unknown verifies/status-polls; definitive failure permits new attempt. Duplicate verification is inert. |
| Submission | pending, sending, acknowledged, rejected, external_outcome_unknown, reconciled | Worker obtains per-order serialization and persists attempt before I/O. Definitive carrier ack -> acknowledged; business rejection -> rejected; timeout after possible acceptance -> unknown. | Status/idempotent lookup resolves unknown; no automatic non-idempotent resend. Reconciled records evidence and chosen next transition. |
| Underwriting | not_required, pending, evidence_required, accepted, rejected | Authorized carrier/underwriter requests evidence or records decision with rule version and reason. | Due-time escalation never auto-accepts risk. Material risk change reopens a new review version. |
| Issuance | not_started, pending, issued, failed, external_outcome_unknown | Confirmed carrier policy reference/document -> issued with authoritative effective dates; rejected submission is not an issued policy. | Poll/callback race uses provider observation identity and per-order version. Unknown remains exception. |
| Policy | pending, future, active, expired, cancellation_pending, cancelled | Future/active derive from issued authority + effective interval + current date semantics; cancellation effective only with carrier approval. | Date rollover changes projection; no new monetary journal merely for rendering. |
| Delivery | pending, available, dispatched, delivered, failed | Document security scan and permission publish -> available; logistics verified status -> dispatched/delivered. | Retry permitted notification/document delivery, never reissue policy as compensation. |
| Refund | requested, approved, submitting, paid, rejected, external_outcome_unknown | Independent checker authorizes remaining refundable amount; worker submits stable refund key; verified provider result posts reversal. | Unknown payout blocks second payout until authoritative reconciliation. |
| Claim | draft, submitted, evidence_required, assessing, approved, rejected, payment_pending, paid, closed | Claimant files; authorized assessor decides with reason; finance checker authorizes contract-backed payout. | Missing authority routes advisory support only; appeal is a linked review, not destructive decision edit. |
| Enrollment | proposed, validated, approved, scheduled, effective, rejected, superseded | Requester imports; checker approves diff; insurer confirms effective change where required. | Overlapping effective periods blocked; rejected rows stay explicit. |

```mermaid
sequenceDiagram
  participant V as Verification / credit service
  participant D as PostgreSQL
  participant W as Delivery worker
  participant C as Carrier
  V->>D: Lock purchase; confirm receipt OR credit authority
  V->>D: Commit purchase + audit + outbox atomically
  W->>D: Claim durable work; persist stable attempt
  W->>C: Recipient projection + stable business key
  alt Confirmed acknowledgment
    C-->>W: Reference and authoritative status
    W->>D: Inbox dedupe + submission transition
  else Timeout after possible acceptance
    W->>D: external_outcome_unknown + exception
    W->>C: Authoritative status lookup when supported
  end
```

Jobs carry reference IDs and versions, not unnecessary medical payloads. Audit records actor, reason, before/after state, source evidence and control revision. Temporary delivery leases are not business states and expire safely. Every terminal transition keeps history; compensation is a new explicit action with independent authority.''','R08')

doc('02-requirements/errors-and-recovery.md','Errors and recovery', '''| Code | HTTP | Client recovery | Operator action |
|---|---|---|---|
| validation_failed | 422 | Correct named fields; keep safe draft | Review schema/rule version if repeated |
| unauthenticated | 401 | Reauthenticate; re-fetch private context | Investigate session failure without exposing OTP |
| resource_not_found | 404 | Return to permitted list | Never confirm inaccessible object's existence |
| forbidden_action | 403 | Explain role-limited action | Reasoned access review, no silent elevation |
| mode_disabled | 409 | Preserve draft/read-only; show servicing link | Inspect authoritative flag revision |
| quote_expired | 409 | Obtain fresh offers and reconfirm total | Cannot override price without carrier authority |
| version_conflict | 409 | Re-fetch permitted version and compare changes | Inspect concurrent actor history |
| idempotency_conflict | 409 | Stop retrying changed body under same key | Compare request digests, no raw PII logs |
| provider_rejected | 422 | Explain safe business reason; alternative offer | R02/R20 inspect documented rejection |
| provider_unavailable | 503 | Show partial state or queued request | R09 check circuit/provider health |
| external_outcome_unknown | 202 | Show pending verification, prohibit duplicate purchase/payout | Reconcile authoritative outcome before replay/refund |
| rate_limited | 429 | Respect Retry-After with jitter | Investigate tenant fairness or abuse |

Use a correlation ID and localized message key; never send stack traces, SQL, credential fragments or raw carrier payloads. Error retries require operation-specific idempotency, deadline and state guard. Recovery paths reauthorize current access, but committed servicing retains historical commercial eligibility unless security quarantine intervenes.''','R03')

if __name__ == '__main__':
    print('Root governance, product and shared requirement documents written.')
