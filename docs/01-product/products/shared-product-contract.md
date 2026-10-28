---
{
  "id": "PRODUCT-COMMON",
  "title": "Shared product contract",
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
    "INS-02",
    "INS-03",
    "INS-05",
    "INS-11",
    "COM-01",
    "COM-06",
    "SVC-04"
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

# Shared product contract

## Authority and implementation boundary

This contract is normative within the proposed design, pending the reviews recorded in metadata. The brief establishes desired product families, not their market availability. Field bounds below are input-safety constraints; they are not insurer eligibility rules. No real rate, waiting period, benefit guarantee, legal obligation, carrier access or payout authority is established by this document. Product specifications add differences and may not weaken the security, financial or relationship invariants in the [SRS](../../02-requirements/software-requirements-specification.md).

Every product has independently evaluated discovery, quote, purchase, assisted-sale and servicing capabilities. `product.PRD-NN.new_sales` defaults to `false` for live environments until product/carrier/channel certification is recorded. Local synthetic simulation can explicitly enable it. A product flag never authorizes a person or implies the carrier supports an operation. The authoritative decision also requires channel configuration, valid membership/resource relationship, carrier capability, plan validity and rule version. Each child operation evaluates the effective configuration in the transaction that commits it. Prior committed purchases continue under servicing and partner-delivery controls; a distinct security quarantine can stop unsafe transmission.

## Canonical application fields

The public contract contains these fields plus the family risk fields. Unknown properties are rejected. Client-supplied prices, tenant ownership, approval status and provider references are rejected, not trusted.

| Field | Type and required condition | Bounds, normalization and example | Sensitivity / validation message |
|---|---|---|---|
| applicationId | UUID, server-generated | Immutable opaque identifier; example `00000000-0000-4000-8000-000000000101` | Internal reference / `APPLICATION_REFERENCE_INVALID` |
| version | integer, required for a mutation | >= 1; `If-Match` must match current record | Internal / `APPLICATION_CHANGED_RELOAD` |
| productId | enum, required | One of PRD-01…PRD-24; immutable after first quote | Public taxonomy / `PRODUCT_NOT_SUPPORTED` |
| channel | enum, required | `b2c`, `corporate`, `commercial`, `reseller` or `b2b2c`; server verifies entry point; display labels map below | Internal / `CHANNEL_UNAVAILABLE` |
| organizationContextId | UUID, conditional | Required for organization purchase; forbidden as a grant of personal access | Confidential / `ORGANIZATION_CONTEXT_REQUIRED` |
| parties | array of role/reference pairs, required | Buyer, payer, policyholder and insured are explicit; beneficiary/distributor/requester/approver when applicable; role count <= 100 per bounded interactive application, bulk schedules use separate upload | Confidential / `PARTY_ROLE_OR_CONSENT_INVALID` |
| effectiveDate | ISO date, required before binding | Valid calendar date stored with product timezone and calendar source; never infer midnight UTC from a local date | Confidential / `EFFECTIVE_DATE_INVALID` |
| termCode | string, required before quote | 1–40 ASCII code points, offered by versioned plan configuration; no free-text duration assumptions | Public / `TERM_NOT_OFFERED` |
| currency | ISO currency code, required | Proposed IRR when applicable; amount serialized as integer minor-unit string, never float; UI labels any toman conversion | Financial / `CURRENCY_OR_UNIT_MISMATCH` |
| declarations | versioned answers, conditional | Required declarations from product/form snapshot; boolean acknowledgment is tied to text version and actor/time | Restricted / `DECLARATION_INCOMPLETE` |
| documentRefs | array of UUIDs, conditional | <= 100 per application; only same-resource clean-scanned uploads with permitted purpose; group evidence is a separate batch | Restricted / `DOCUMENT_UNAVAILABLE_OR_UNSAFE` |
| consentRefs | array of versioned references, conditional | Explicit authority to act for another person and transmit fields; no blanket consent inferred from employment | Restricted / `CONSENT_OR_AUTHORITY_REQUIRED` |

String inputs use Unicode NFC, trim surrounding whitespace and reject control characters. Human names remain Unicode; identifiers are never silently transliterated or zero-stripped. Persian/Arabic digits may be normalized to ASCII for defined numeric fields, with the submitted source retained in the audit context when necessary. Dates accept explicit calendar metadata then canonicalize to ISO dates; timestamps use UTC. Integer money strings match `^(0|[1-9][0-9]{0,17})$`; technical maximum is transport safety, not an insurable-value promise. Arrays are versioned lists with stable item IDs. File fields hold upload references, not untrusted URLs. Errors identify a field and stable code without echoing medical, identity or financial values. Nest validation is authoritative; frontend validation is explanatory.

## Relationships and authorization

An application owns its party-role assignments, not the identities themselves. Reference reuse requires both resource access and permission for the current purpose. A payer may see the payable amount and receipt without seeing medical declarations or beneficiary information. A seller's delegated mandate permits only enumerated sales actions and expires independently of a policy. Carrier projections include only the fields the selected contract requires. Employee/beneficiary access follows coverage relationship and does not grant access to employer billing, coworkers or unrelated personal policies. Corporate health administrators manage enrollment and aggregate contract metrics; they cannot inspect diagnoses, individual claims or private declarations. Proposed employer-report minimum cohort is 10, with complementary suppression and restrictions on repeated differencing queries; this is a privacy design proposal, not a legal safe harbor.

## Versioned pricing and comparison

A quote stores immutable product/form/plan/rate/underwriting/mapping/consent versions, normalized coverage, original carrier response reference, explicit currency/unit, premium, fees, taxes, financing costs, total payable, validity instant and assumptions. Missing mandatory rule versions block binding. Actual prices and eligibility come only from an authorized contract-backed source. Local fixtures use fictional offer amounts and explicitly synthetic rules. Comparison never substitutes a missing limit or exclusion with zero. Incomparable benefits show a reason and carrier wording reference. Sponsored ranking is labeled and never hides the ranking criterion.

Expiry is `min(carrier validUntil, permitted plan/rate window)` when both are known. If the carrier supplies no reliable binding validity, the quote is indicative and requires requotation/manual confirmation. A technical UI display lifetime is not a guarantee. Price/evidence/party changes invalidate affected quotes; server revalidates eligibility, evidence freshness, declaration versions, availability and price before purchase commitment.

## Workflow, state and external boundaries

Draft validation → quote requested → partial/complete/indicative offer → accepted application → payment pending or approved B2B credit commitment → committed purchase → carrier submission → underwriting/issuance → confirmed policy → delivery. These are separate records and state machines; a successful payment does not make insurance active. Family-specific review may happen before quote or issuance. Payment verification uses authoritative server evidence and creates the purchase event with the application/payment update in one database transaction. Credit purchases emit an explicit invoiced/credit commitment without asserting cash receipt.

Applications use optimistic version checks; commitment serializes the chosen quote/application and stable idempotency key. Repeating the same key and body returns the original result; changing body under the key returns a conflict. Outbox/inbox records support at-least-once transport. Unknown submission outcomes remain `external_outcome_unknown`; a carrier lacking idempotency or authoritative lookup requires operator reconciliation before replay, cancellation or refund. Manual assistance records actor, reason, source document, approved offer revision and checker where financial/coverage decisions require it; it never bypasses carrier authority.

Policy effective status requires carrier confirmation plus effective-date semantics. Endorsements create versions with effective dates and independent premium/refund effects. Cancellation requests do not cancel coverage until authorized confirmation. Renewal starts a new application with fresh rates, evidence and declarations; prior data is prefilled only with permission. Claims intake, assessment and settlement are separate; the platform may guide or transmit when it lacks authority to decide/pay.

## Evidence, operations and retention

Uploads are constrained by approved MIME signature, size, malware scanning and access-scoped retrieval; URLs are short-lived and not stored in analytics. The UI offers a mobile upload retry that resumes the same upload session instead of duplicating evidence. Requests for supplementary evidence explain the requested category, reviewer and due date. Family documents specify additional evidence. Medical and beneficiary documents receive restricted roles and access audit. Retention periods and deletion/legal-hold obligations remain contract/jurisdiction review blockers; absent a reviewed policy, production collection is disabled and synthetic fixtures remain clearly labeled.

Operators use scoped underwriting, inspection, submission and reconciliation queues. Queue assignment never confers a decision permission. A timeout case contains application/order references, last verified state, masked provider correlation, next permissible action and responsible owner. Customers see honest pending, action-required or reconciliation messages without invented coverage promises. Transactional messages refer to case IDs via authenticated links, not sensitive diagnoses or full identifiers in SMS/email. Promotional communication requires independent preferences and consent.

## Common interaction, telemetry and release evidence

Product routes are `/insurance/PRD-NN`, `/applications/:id`, `/quotes/:id/compare`, `/orders/:id` and `/policies/:id`; organization forms retain an explicit context banner. Loading preserves labels and keyboard focus, empty explains no eligible offers, partial shows completed/pending/timed-out carriers, expired blocks purchase, forbidden reveals no resource existence, read-only exposes permitted servicing, disabled distinguishes new sales from existing obligations, and success distinguishes submission from issuance. Errors preserve safe entered values and identify the correction. RTL uses logical layout properties, LTR isolates identifiers, and date/currency controls expose explicit units. Avoid local persistence of medical, financial or identity drafts; server drafts require authorization on resume.

Budgets are referenced from the [central registry](../../_meta/performance-budgets.yaml): PERF-READ for bounded drafts/policy reads, PERF-WRITE for local mutations, PERF-QUOTE for insurer aggregation, PERF-DISPATCH for committed submission, PERF-WEB and PERF-JS for user routes. Provider duration is measured separately. No private application/quote/policy enters a shared public cache. Analytics record product/channel, coarse outcome and elapsed bucket with pseudonymous journey references; never risk answers, diagnoses, policy numbers or documents. Measure draft-to-quote, quote-to-commit, commit-to-issue, evidence rework and claim handoff outcomes, distinguishing external dependency failures.

Each product acceptance suite must test own/other person, two organizations, payer versus insured visibility, revoked seller mandate, expired evidence/quote, feature changes at commitment, duplicate payment/callback, unknown external outcome and servicing with new sales disabled. Synthetic fixture acceptance is not carrier certification. Human R02/R19 commercial/legal review, R11 privacy review, R12 financial review, R13 execution evidence and R20 operational acceptance remain pending. An implementation is not done until its versioned contract, field validation, negative authorization, state transitions and measured budgets pass; this documentation contains planned tests, not passing application results.

## Channel labels and canonical codes

Human-facing channel labels in these specifications map to the wire/domain codes below. API requests, events, persisted context and synthetic canonical examples use the canonical code; labels are display vocabulary, not extra enum values. `B2B` is an umbrella sales mode, not a sixth purchasable channel. A carrier/supplier organization is a commercial relationship, not a channel. An employee's separate personal purchase uses `b2c`; existing beneficiary servicing retains its coverage relationship independently of new-sales availability.

| Display/document label | Canonical code | Parent mode |
|---|---|---|
| B2C | `b2c` | B2C new sales |
| B2B.commercial | `commercial` | B2B plus commercial subchannel |
| B2B.corporate | `corporate` | B2B plus corporate subchannel |
| B2B.reseller | `reseller` | B2B plus reseller subchannel |
| B2B2C | `b2b2c` | B2B plus B2B2C new enrollment; contracted servicing evaluated separately |

Role/context selection never manufactures a channel entitlement. Unknown or display-label values at a strict canonical API boundary are rejected with a typed validation error rather than silently guessed. Import/adapters may translate an explicitly versioned label mapping before canonical validation and record the mapping version.
