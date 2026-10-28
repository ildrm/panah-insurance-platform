---
{
  "id": "PRODUCT-PRD-06",
  "title": "PRD-06 — Individual / family supplementary health",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R02",
  "reviewer_roles": [
    "R02",
    "R04",
    "R11",
    "R13",
    "R20"
  ],
  "scope_ids": [
    "PRD-06",
    "INS-11"
  ],
  "source_refs": [
    "S00"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# PRD-06 — Individual / family supplementary health

## Identity, scope and dependencies

`PRD-06` is a desired capability from S00, owned by R02, with R01/R19/R20 review pending. Product classification: **standalone or contract-dependent supplementary plan**. This specification adds family-specific rules to the [shared product contract](shared-product-contract.md); all canonical fields, authorization, versioning, payment/issuance boundaries, input normalization, UI states and release tests there apply. It does not establish availability, eligibility or a rate for any real carrier.

Subject and relationships: One person or a family schedule. Applicant, each adult member, guardian of a dependent, payer, policyholder and benefit recipient have distinct access relationships.

Proposed channels: `B2C`, `B2B.reseller`, `B2B2C`. B2B2C means beneficiary access/enrollment under a group relationship; any separate personal purchase still requires B2C availability. Channel availability and carrier participation are independent. Dependencies are INS-02/03/05/07/08/10/11, COM-01/02/03/06/08 and SVC-01/02/04/05; additional inspection, group or claim dependencies follow the differences below.

## Family field dictionary and server validation

Fields below extend the canonical application. No field has an implicit business default; omitted conditional fields are accepted only when the versioned form predicate is false. Types `money`, `date`, `UUID`, code and evidence reference use the shared contract's exact rules. Required-before-issue fields may be absent in a draft but block the relevant transition. Examples are synthetic; SYNTH codes are deliberately not real carrier identifiers.

| Field | Type | Required condition | Constraint / authority | Synthetic example | Sensitivity | Validation code |
|---|---|---|---|---|---|---|
| `memberRefs` | `array<UUID>` | required | 1–100 stable authorized person refs; batch above this | `[00000000-0000-4000-8000-000000000206]` | restricted | `MEMBER_AUTHORITY_REQUIRED` |
| `relationshipCodes` | `map` | required | one carrier-compatible relationship per member | `{SYNTH-M1: dependent}` | restricted | `RELATIONSHIP_INVALID` |
| `birthDates` | `map<date>` | required by rating | valid dates, not future; restricted projection | `{SYNTH-M1: 2000-01-01}` | restricted | `BIRTH_DATE_INVALID` |
| `baseCoverageRefs` | `map<UUID>` | conditional by plan | verified evidence and current status | `{SYNTH-M1: SYNTH-BASE}` | restricted | `BASE_COVERAGE_REQUIRED` |
| `healthDeclarationRefs` | `map<UUID>` | conditional by underwriting | member-specific restricted evidence | `{SYNTH-M1: SYNTH-DECL}` | highly restricted | `DECLARATION_REQUIRED` |
| `benefitPlanCode` | `string` | required | carrier plan version <= 40 code points | `SYNTH-HEALTH-A` | internal | `BENEFIT_PLAN_INVALID` |
| `networkCode` | `string` | conditional | offered provider-network revision | `SYNTH-NET-A` | internal | `NETWORK_UNAVAILABLE` |

## Rating, eligibility, evidence and underwriting

**Rating inputs.** Member ages under explicit effective-date semantics, relationship, base coverage, selected limits/network and permitted underwriting answers. No diagnosis is sent to analytics, employer or unrelated family members.

**Evidence.** Identity/guardian authority, dependent relationship, base insurance and requested medical evidence. Adult dependents can supply medical declarations privately; payer visibility excludes their answers.

**Eligibility and review.** Waiting periods, pre-existing condition handling, age eligibility and network participation are contract-owned. An offer pending medical review is marked conditional and cannot imply coverage acceptance.

`RULE-PRD-06-01`: the active form/plan/underwriting contract must map every mandatory risk field without dropping information. Unsupported risk or missing authority becomes a typed unavailable/manual-review outcome, never a fabricated eligible quote. Carrier rules must state required evidence freshness, eligibility, applicable exclusions and inspection requirements; these commercial values remain external dependencies.

## Plans, riders, comparison and quote validity

Compare benefit categories, annual/per-event limits, deductible/copay basis, network version, waiting/eligibility conditions and family member applicability. Missing values remain unknown.

`RULE-PRD-06-02`: a plan records base cover, selected riders, dependencies, limits, deductible basis, exclusion wording references, evidence conditions and versioned premium breakdown. Bindable validity must be supported by carrier evidence; otherwise label the offer indicative. A changed risk/evidence/party/schedule version invalidates affected offers and requires a new comparison confirmation. Do not convert missing benefits into zero-valued comparable limits.

## Purchase, issuance and documents

The product detail explains classification, eligibility information, evidence needs and assisted alternatives before collecting a full application. The draft page saves server-authorized values; the comparison page presents only compatible offers. At review, buyer and payer confirm their roles, risk/declaration version, precise total payable and insurer terms. Direct purchase requires verified payment plus commercial acceptance; an approved corporate credit/invoice path requires the distinct commitment event. Both persist commitment and outbox atomically.

Carrier submission uses the frozen application/offer/mapping versions. Await underwriting and confirmed policy reference/document; payment success, submission acknowledgment and coverage activation remain separate. Unknown provider outcomes enter reconciliation without automatic non-idempotent replay. Required outputs are the accepted application/declaration record, offer/terms snapshot, financial receipt or invoice/credit record, insurer policy/certificate and relevant schedule/riders; only contract-authorized documents are labeled insurer-issued. The product's evidence and classification differences above determine additional documents.

## Endorsements, renewal, cancellation and claims

Dependent additions/removals use effective-dated enrollment and insurer approval. Renewal obtains current consent/declarations. Private health claims are visible to claimant/authorized guardian and assigned claims roles; family payer alone is insufficient.

`RULE-PRD-06-03`: an amendment or cancellation request does not itself change coverage or entitle a refund. Keep requested/approved/effective dates, insurer acknowledgment and financial adjustments distinct. All reversals are append-only ledger effects after authorized decisions. Where this family has no renewal or a different continuation mechanism, the UI uses the contract-specific term rather than inventing an annual renewal.

## Product controls, operational handling and privacy

`product.PRD-06.new_sales` is a boolean proposed live default `false`, scoped by channel/carrier/plan/organization/region/effective time under the central precedence rules. Visibility may show editorial information while quote/purchase remain disabled. A separate `product.PRD-06.servicing` control preserves contracted policy access, claims, installments and endorsements; ordinary sales toggles cannot suppress committed delivery. Security quarantine is a separately authorized incident action. Enabling a product requires verified contracts, authority, forms/rates, adapter mapping and executed tests. Missing prerequisites keep real operations off.

Restricted health underwriting queue; sensitive requests use authenticated inbox, never diagnosis in SMS. Consent revocation affects future sharing while lawful/contractual retention is reviewed.

This family handles health/beneficiary information: the payer, employer and seller receive no medical or beneficiary-detail projection by default. Member/guardian authority is evaluated separately from purchase authority.

Support sees masked references and an actionable reason category; restricted evidence requires assigned role and purpose. Notifications disclose product/case status through an authenticated link, without full risk answers or documents. Analytics uses product/channel, coarse decision and latency bucket only. Export authorization is repeated at generation and download, including organization and relationship changes.

## Interaction and performance consequences

Routes `/insurance/PRD-06` and `/applications/:id` select this versioned form; authenticated detail and comparison routes are private/no-store. Display distinct loading, empty, error, forbidden, read-only, disabled, partial, expired and success states from the shared contract. A partial quote never implies all carriers replied. Preserve draft data after a correctable field error, but do not persist restricted values in browser storage. Mobile forms use single-column steps and resumable secure upload; RTL layouts retain logical reading order and isolate identifiers/currency units. Calendar input states the chosen calendar and coverage date semantics.

Performance gates are PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS in the [budget registry](../../_meta/performance-budgets.yaml). Bounded views paginate schedules; large evidence processing and exports run as jobs. Quote telemetry separates first result, deadline/partial completion and provider duration. Product/risk fields never become metric labels. The fixtures below are a correctness input, not benchmark evidence.

## Measurable acceptance and fixture

| Acceptance ID | Given / When / Then and evidence |
|---|---|
| AC-PRD-06-RISK | Given the synthetic fixture and a matching fictional carrier form, when validating and mapping, then all required fields survive with exact types/units and version references; compare canonical and provider projections. |
| AC-PRD-06-VARIANT | Given the family-specific change below, when attempting the next transition, then apply the stated family result and preserve old-version audit history. |
| AC-PRD-06-DENY | Given another user/organization or a payer lacking insured-data authority, when reading or exporting this application/evidence, then deny without leaking the protected fields or resource existence. |
| AC-PRD-06-DISABLE | Given a quote and a sales disable before commit, when committing, then reject new purchase; given a previously committed order, then servicing/submission continues unless separately quarantined. |
| AC-PRD-06-RACE | Given two edits or commitments using one version/idempotency key, when processed concurrently, then exactly one logical state transition and allocation occur; the loser receives original result or version conflict. |
| AC-PRD-06-PROVIDER | Given an unavailable carrier or timeout after possible acceptance, when retry processing runs, then show partial/unavailable or external_outcome_unknown appropriately and require authoritative reconciliation before unsafe replay. |
| AC-PRD-06-SERVE | Given a confirmed policy and new sales off, when the entitled person requests documents/claim guidance or an approved servicing operation, then the relationship checks still apply and servicing is not blocked by the sales flag. |

Family-specific scenario: **A parent payer opens an adult dependent's claim URL without a health-data mandate: amount/diagnosis/document access is denied while the payer's receipt remains available.**

Fixture: [`fixtures/PRD-06.json`](fixtures/PRD-06.json). Its riskExample validates against [`schemas/PRD-06.risk.schema.json`](schemas/PRD-06.risk.schema.json). A test harness combines it with canonical party/date/consent fixtures and the fictional carrier rule set; schema validation alone does not decide conditional underwriting or cross-field eligibility. Unit tests validate every field and rule; property tests preserve money/role/schedule invariants; integration tests exercise transaction/outbox and version conflicts; contract tests prove mapping/protocol errors; E2E tests exercise the family scenario and accessible states; security tests cover cross-relationship export; performance tests run the referenced workload. None has been executed against an application in this documentation task.

## Readiness and unresolved inputs

R02 supplies actual product/rate/underwriting/exclusion documents; R09 supplies capability/mapping/credential certification; R19 obtains qualified jurisdiction/licensing/contract review; R12 verifies payment/financing/settlement terms; R20 accepts manual queues and communication content. Each missing item blocks live operation for its affected product/carrier/channel. Safe default: simulated fixtures and editorial/assisted information only where permitted, with no live charge, bind or payout. Documentation remains draft; human approval and application test evidence are pending.
