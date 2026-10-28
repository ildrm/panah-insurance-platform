---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-MAKER-CHECKER-INVOICE-CREDIT",
  "title": "Maker-checker and invoice/credit commitment",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ORG-03",
    "INT-03",
    "COM-09"
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

# Maker-checker and invoice/credit commitment

## Preconditions and authority
Executed credit terms, current organization limit and distinct requester/checker grants are required. No agreement means credit new sales off.

## Exact sequence
```mermaid
sequenceDiagram
  participant Requester
  participant API
  participant DB
  participant Approver
  participant Worker
  participant Carrier
  participant Payer
  participant Provider
  Requester->>API: Submit order terms, cost center and requested credit
  API->>DB: Save approval request with immutable proposal digest
  Approver->>API: Approve within delegated limit and reason
  API->>DB: Lock approval, organization limit and order
  API->>DB: Reserve limit, create receivable and commitment outbox atomically
  Worker->>Carrier: Submit credit-backed commercial commitment
  Payer->>Provider: Pay invoice later
  Provider->>API: Notify receipt for independent verification
  API->>DB: Allocate verified money to receivable without second purchase
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Self-approval returns forbidden. Concurrent orders competing for remaining limit serialize and one may fail. Later payment reduces receivable; it must not reissue. A disputed invoice does not erase an issued policy.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-CREDIT: Given available credit 100 synthetic units and two concurrent 80-unit proposals, at most one commits; committed event says approved_credit and payment remains unpaid.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
