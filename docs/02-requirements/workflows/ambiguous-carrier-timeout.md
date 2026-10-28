---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-AMBIGUOUS-CARRIER-TIMEOUT",
  "title": "Ambiguous carrier timeout",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "INT-07",
    "INT-08"
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

# Ambiguous carrier timeout

## Preconditions and authority
Carrier submit was attempted and response was not conclusively received. Determine capability matrix before choosing recovery.

## Exact sequence
```mermaid
sequenceDiagram
  participant Worker
  participant Carrier
  participant DB
  participant Operator
  participant API
  participant Checker
  Worker->>Carrier: Submit request with persisted request identity
  Carrier->>Carrier: May accept before connection loss
  Worker->>DB: Persist external_outcome_unknown and exception
  Worker->>Carrier: Lookup status only if authoritative capability exists
  Operator->>API: Attach verified partner reconciliation evidence
  Checker->>API: Approve resolution and any safe replay/refund
  API->>DB: Record resolution, successor action and audit
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
If carrier supports neither idempotency nor authoritative status, automatic retry is prohibited. Keep paid/unissued visible. Operator cannot equate no response with rejection. Refund requires ensuring no conflicting issued obligation or approved documented remediation.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-UNKNOWN: Given timeout-after-acceptance and no status/idempotency capability, retries stop, exception persists and changing sales flags does not replay the order.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
