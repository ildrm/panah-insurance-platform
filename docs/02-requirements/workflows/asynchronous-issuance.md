---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-ASYNCHRONOUS-ISSUANCE",
  "title": "Asynchronous issuance",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "COM-06",
    "INT-03",
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

# Asynchronous issuance

## Preconditions and authority
Purchase committed with immutable form, consent, carrier mapping and recipient projection; current security policy permits transmission.

## Exact sequence
```mermaid
sequenceDiagram
  participant Worker
  participant DB
  participant Carrier
  participant API
  participant Storage
  Worker->>DB: Lease outbox row and persist per-order attempt
  Worker->>Carrier: Submit stable business idempotency key
  Carrier->>Worker: Acknowledge asynchronous reference
  Worker->>DB: Persist acknowledgment and next poll time
  Worker->>Carrier: Poll authoritative status
  Carrier->>API: Send verified issuance callback
  API->>DB: Inbox dedupe and serialize order transition
  Worker->>Storage: Store scanned policy document
  Worker->>DB: Publish policy.issued.v1 and delivery work
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Polling and callbacks may race: compare observation identity/version and apply legal transition once. A stale pending observation cannot downgrade issued. Crash after external acceptance before DB ack requires status reconciliation.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-ASYNC: Given callback and poll both report issuance, exactly one policy-version record and one business delivery obligation exist; transport events may be duplicated.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
