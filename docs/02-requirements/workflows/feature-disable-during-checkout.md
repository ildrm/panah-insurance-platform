---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-FEATURE-DISABLE-DURING-CHECKOUT",
  "title": "Feature disable during checkout",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "CHN-01",
    "CHN-02",
    "CHN-05"
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

# Feature disable during checkout

## Preconditions and authority
Feature proposal has authorized approver and effective revision; commercial disable and security quarantine are separate controls.

## Exact sequence
```mermaid
sequenceDiagram
  participant Buyer
  participant API
  participant Admin
  participant DB
  participant Provider
  participant Worker
  participant Carrier
  Buyer->>API: Begin checkout under current sales revision
  Admin->>API: Publish new sales-disable revision
  API->>DB: Serialize revision activation and purchase check
  Provider->>API: Deliver payment callback possibly after disable
  API->>Provider: Verify actual receipt regardless of sales flag
  API->>DB: Apply reservation policy or finance exception; preserve money
  Worker->>DB: Load committed purchase snapshot
  Worker->>Carrier: Continue authorized pre-disable commitment unless quarantined
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
New direct commitments after linearization fail mode_disabled. Existing drafts read-only; policy downloads/installments/claims remain. For payment reservation already authorized before disable, only its fixed expiry and immutable accepted terms permit completion; otherwise receipt stays unallocated pending refund review. Never silently extend a reservation.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-FLAG: A purchase committed before B2C-off and delivered afterward continues issuance; new direct purchase fails; B2B and insurer access remain independent; audit contains both revisions.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
