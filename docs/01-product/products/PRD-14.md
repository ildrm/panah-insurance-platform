---
{
  "id": "PRODUCT-PRD-14",
  "title": "PRD-14 — Sports",
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
    "PRD-14",
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

# PRD-14 — Sports

## Identity, scope and dependencies

`PRD-14` is a desired capability from S00, owned by R02, with R01/R19/R20 review pending. Product classification: **participant/activity cover through authorized issuer**. This specification adds family-specific rules to the [shared product contract](shared-product-contract.md); all canonical fields, authorization, versioning, payment/issuance boundaries, input normalization, UI states and release tests there apply. It does not establish availability, eligibility or a rate for any real carrier.

Subject and relationships: Named participants in a declared sport, activity or event. Club/organizer purchaser is distinct from participant and guardian.

Proposed channels: `B2C`, `B2B.corporate`, `B2B.commercial`, `B2B.reseller`, `B2B2C`. B2B2C means beneficiary access/enrollment under a group relationship; any separate personal purchase still requires B2C availability. Channel availability and carrier participation are independent. Dependencies are INS-02/03/05/07/08/10/11, COM-01/02/03/06/08 and SVC-01/02/04/05; additional inspection, group or claim dependencies follow the differences below.

## Family field dictionary and server validation

Fields below extend the canonical application. No field has an implicit business default; omitted conditional fields are accepted only when the versioned form predicate is false. Types `money`, `date`, `UUID`, code and evidence reference use the shared contract's exact rules. Required-before-issue fields may be absent in a draft but block the relevant transition. Examples are synthetic; SYNTH codes are deliberately not real carrier identifiers.

| Field | Type | Required condition | Constraint / authority | Synthetic example | Sensitivity | Validation code |
|---|---|---|---|---|---|---|
| `participantRefs` | `array<UUID>` | required | 1–100 authorized refs; larger rosters use bulk | `[00000000-0000-4000-8000-000000000214]` | restricted | `PARTICIPANT_AUTHORITY_REQUIRED` |
| `sportCode` | `string` | required | carrier/issuer classification <= 60 | `SYNTH-SPORT-A` | internal | `SPORT_UNMAPPED` |
| `activityLevelCode` | `string` | required | offered recreational/competition classification | `SYNTH-RECREATIONAL` | internal | `ACTIVITY_LEVEL_UNAVAILABLE` |
| `eventRef` | `UUID` | optional | authorized event/organizer reference | `00000000-0000-4000-8000-000000000314` | confidential | `EVENT_AUTHORITY_REQUIRED` |
| `periodStart` | `date` | required | explicit activity-local date | `2027-04-01` | confidential | `PERIOD_INVALID` |
| `periodEnd` | `date` | required | not before start | `2027-04-02` | confidential | `PERIOD_INVALID` |
| `issuerPlanCode` | `string` | required | authorized issuer plan/version | `SYNTH-SPORT-PLAN` | internal | `ISSUER_NOT_AUTHORIZED` |

## Rating, eligibility, evidence and underwriting

**Rating inputs.** Sport, activity level, participant ages where required, period and benefit plan. A general accident plan cannot be presented as an authorized sports membership or certificate unless contract supports it.

**Evidence.** Participant/guardian authority, event/club relationship and contract-required eligibility evidence. Health data is requested only where underwriting requires it.

**Eligibility and review.** High-risk activity and competition eligibility are issuer-specific. Coverage/certificate authority must be verified; no invented official federation relationship.

`RULE-PRD-14-01`: the active form/plan/underwriting contract must map every mandatory risk field without dropping information. Unsupported risk or missing authority becomes a typed unavailable/manual-review outcome, never a fabricated eligible quote. Carrier rules must state required evidence freshness, eligibility, applicable exclusions and inspection requirements; these commercial values remain external dependencies.

## Plans, riders, comparison and quote validity

Align sport/activity level, dates, benefit basis, excluded activities and certificate/issuer purpose; distinguish insurance from membership service.

`RULE-PRD-14-02`: a plan records base cover, selected riders, dependencies, limits, deductible basis, exclusion wording references, evidence conditions and versioned premium breakdown. Bindable validity must be supported by carrier evidence; otherwise label the offer indicative. A changed risk/evidence/party/schedule version invalidates affected offers and requires a new comparison confirmation. Do not convert missing benefits into zero-valued comparable limits.

## Purchase, issuance and documents

The product detail explains classification, eligibility information, evidence needs and assisted alternatives before collecting a full application. The draft page saves server-authorized values; the comparison page presents only compatible offers. At review, buyer and payer confirm their roles, risk/declaration version, precise total payable and insurer terms. Direct purchase requires verified payment plus commercial acceptance; an approved corporate credit/invoice path requires the distinct commitment event. Both persist commitment and outbox atomically.

Carrier submission uses the frozen application/offer/mapping versions. Await underwriting and confirmed policy reference/document; payment success, submission acknowledgment and coverage activation remain separate. Unknown provider outcomes enter reconciliation without automatic non-idempotent replay. Required outputs are the accepted application/declaration record, offer/terms snapshot, financial receipt or invoice/credit record, insurer policy/certificate and relevant schedule/riders; only contract-authorized documents are labeled insurer-issued. The product's evidence and classification differences above determine additional documents.

## Endorsements, renewal, cancellation and claims

Participant substitution or activity/date changes require approval. Renewal checks current activity and issuer rules. Claims capture incident/activity evidence with private medical intake.

`RULE-PRD-14-03`: an amendment or cancellation request does not itself change coverage or entitle a refund. Keep requested/approved/effective dates, insurer acknowledgment and financial adjustments distinct. All reversals are append-only ledger effects after authorized decisions. Where this family has no renewal or a different continuation mechanism, the UI uses the contract-specific term rather than inventing an annual renewal.

## Product controls, operational handling and privacy

`product.PRD-14.new_sales` is a boolean proposed live default `false`, scoped by channel/carrier/plan/organization/region/effective time under the central precedence rules. Visibility may show editorial information while quote/purchase remain disabled. A separate `product.PRD-14.servicing` control preserves contracted policy access, claims, installments and endorsements; ordinary sales toggles cannot suppress committed delivery. Security quarantine is a separately authorized incident action. Enabling a product requires verified contracts, authority, forms/rates, adapter mapping and executed tests. Missing prerequisites keep real operations off.

Sports program operator verifies issuer authority and roster; organizer sees enrollment outcome, not participants' diagnoses.

This family handles health/beneficiary information: the payer, employer and seller receive no medical or beneficiary-detail projection by default. Member/guardian authority is evaluated separately from purchase authority.

Support sees masked references and an actionable reason category; restricted evidence requires assigned role and purpose. Notifications disclose product/case status through an authenticated link, without full risk answers or documents. Analytics uses product/channel, coarse decision and latency bucket only. Export authorization is repeated at generation and download, including organization and relationship changes.

## Interaction and performance consequences

Routes `/insurance/PRD-14` and `/applications/:id` select this versioned form; authenticated detail and comparison routes are private/no-store. Display distinct loading, empty, error, forbidden, read-only, disabled, partial, expired and success states from the shared contract. A partial quote never implies all carriers replied. Preserve draft data after a correctable field error, but do not persist restricted values in browser storage. Mobile forms use single-column steps and resumable secure upload; RTL layouts retain logical reading order and isolate identifiers/currency units. Calendar input states the chosen calendar and coverage date semantics.

Performance gates are PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS in the [budget registry](../../_meta/performance-budgets.yaml). Bounded views paginate schedules; large evidence processing and exports run as jobs. Quote telemetry separates first result, deadline/partial completion and provider duration. Product/risk fields never become metric labels. The fixtures below are a correctness input, not benchmark evidence.

## Measurable acceptance and fixture

| Acceptance ID | Given / When / Then and evidence |
|---|---|
| AC-PRD-14-RISK | Given the synthetic fixture and a matching fictional carrier form, when validating and mapping, then all required fields survive with exact types/units and version references; compare canonical and provider projections. |
| AC-PRD-14-VARIANT | Given the family-specific change below, when attempting the next transition, then apply the stated family result and preserve old-version audit history. |
| AC-PRD-14-DENY | Given another user/organization or a payer lacking insured-data authority, when reading or exporting this application/evidence, then deny without leaking the protected fields or resource existence. |
| AC-PRD-14-DISABLE | Given a quote and a sales disable before commit, when committing, then reject new purchase; given a previously committed order, then servicing/submission continues unless separately quarantined. |
| AC-PRD-14-RACE | Given two edits or commitments using one version/idempotency key, when processed concurrently, then exactly one logical state transition and allocation occur; the loser receives original result or version conflict. |
| AC-PRD-14-PROVIDER | Given an unavailable carrier or timeout after possible acceptance, when retry processing runs, then show partial/unavailable or external_outcome_unknown appropriately and require authoritative reconciliation before unsafe replay. |
| AC-PRD-14-SERVE | Given a confirmed policy and new sales off, when the entitled person requests documents/claim guidance or an approved servicing operation, then the relationship checks still apply and servicing is not blocked by the sales flag. |

Family-specific scenario: **A recreational quote is reused for a competition event: server rejects the mismatched activity and requires a permitted plan or assisted review.**

Fixture: [`fixtures/PRD-14.json`](fixtures/PRD-14.json). Its riskExample validates against [`schemas/PRD-14.risk.schema.json`](schemas/PRD-14.risk.schema.json). A test harness combines it with canonical party/date/consent fixtures and the fictional carrier rule set; schema validation alone does not decide conditional underwriting or cross-field eligibility. Unit tests validate every field and rule; property tests preserve money/role/schedule invariants; integration tests exercise transaction/outbox and version conflicts; contract tests prove mapping/protocol errors; E2E tests exercise the family scenario and accessible states; security tests cover cross-relationship export; performance tests run the referenced workload. None has been executed against an application in this documentation task.

## Readiness and unresolved inputs

R02 supplies actual product/rate/underwriting/exclusion documents; R09 supplies capability/mapping/credential certification; R19 obtains qualified jurisdiction/licensing/contract review; R12 verifies payment/financing/settlement terms; R20 accepts manual queues and communication content. Each missing item blocks live operation for its affected product/carrier/channel. Safe default: simulated fixtures and editorial/assisted information only where permitted, with no live charge, bind or payout. Documentation remains draft; human approval and application test evidence are pending.
