---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-DIRECT-QUOTE-TO-POLICY",
  "title": "Direct quote to policy",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "INS-05",
    "COM-01",
    "COM-03",
    "COM-06"
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

# Direct quote to policy

## Preconditions and authority
Buyer owns the risk subjects; eligible product/carrier and B2C discovery/quote/purchase are enabled; official inquiries require consent and provider authority.

## Exact sequence
```mermaid
sequenceDiagram
  participant Buyer
  participant Web
  participant API
  participant Carrier
  participant DB
  participant Provider
  participant Worker
  Buyer->>Web: Submit versioned risk answers and declarations
  Web->>API: Start quote with product/schema/risk revision
  API->>Carrier: Bounded eligible quote requests
  Carrier->>API: Progressive offers, provenance and expiry
  Buyer->>API: Select offer and accept immutable terms
  API->>DB: Reserve order/payment attempt under current controls
  Buyer->>Provider: Complete payment redirect
  Provider->>API: Notify payment result
  API->>Provider: Verify merchant, amount, currency and reference
  API->>DB: Atomically record receipt, committed purchase and outbox
  Worker->>Carrier: Send recipient projection with stable key
  Carrier->>Worker: Confirm issued reference and effective interval
  Worker->>DB: Persist issuance, document reference and delivery event
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Quote expires before reservation: obtain fresh offers and consent. Carrier timeout after possible acceptance: external_outcome_unknown, no blind replay. Payment receipt with ineligible uncommitted order: finance exception and refund review, never discard money.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-DIRECT: Given a verified synthetic payment and accepted offer, when the callback repeats concurrently, then one receipt, one commitment and one business submission identity exist; payment success alone never shows active coverage.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
