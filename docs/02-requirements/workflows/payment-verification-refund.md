---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-PAYMENT-VERIFICATION-REFUND",
  "title": "Payment verification/refund",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "COM-03",
    "COM-09",
    "SVC-08"
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

# Payment verification/refund

## Preconditions and authority
Provider contract and approved merchant destination; refund request references remaining original verified allocation; payout authority is independently granted.

## Exact sequence
```mermaid
sequenceDiagram
  participant Provider
  participant API
  participant DB
  participant Requester
  participant Approver
  participant Worker
  Provider->>API: Send signed callback reference
  API->>Provider: Verify authoritative receipt and amount
  API->>DB: Deduplicate receipt and journal allocation
  Requester->>API: Request refund with reason and original receipt
  Approver->>API: Approve remaining refundable amount
  API->>DB: Reserve refundable balance and durable payout work
  Worker->>Provider: Submit refund with stable business key
  Provider->>API: Return verified result or unknown outcome
  API->>DB: Post reversal only upon confirmed refund
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Never trust browser redirects or callback amount alone. Duplicate callbacks are inert. Unknown refund result freezes that reservation; no second payout. Original payer mismatch requires reviewed exception, not arbitrary bank change.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-REFUND: Two concurrent refunds cannot exceed unrefunded verified money; duplicate payout status produces one reversal journal.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
