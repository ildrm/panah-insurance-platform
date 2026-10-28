---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-RENEWAL",
  "title": "Renewal",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "SVC-02",
    "INS-10"
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

# Renewal

## Preconditions and authority
Expiry detection uses carrier dates and customer contact preferences; old policy data may prefill only with appropriate relationship and consent.

## Exact sequence
```mermaid
sequenceDiagram
  participant Worker
  participant DB
  participant Provider
  participant Customer
  participant API
  participant Carrier
  Worker->>DB: Find eligible expiring policy cohort
  Worker->>Provider: Send permitted deduplicated reminder
  Customer->>API: Review prefilled risk and changed facts
  API->>Carrier: Obtain fresh eligible quotes including switching
  Customer->>API: Accept new offer and terms
  API->>DB: Create new purchase linked to predecessor/attribution
  Worker->>Carrier: Issue committed renewal as new policy
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Do not reuse expired prices or automatically renew without authority. Group/fleet schedules require new effective-date review. Disabling new sales retains current policy download and claims; renewal quote/purchase obey current controls.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-RENEW: Given changed vehicle value and a new carrier, renewal requires fresh pricing/inspection rules and retains the original policy history.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
