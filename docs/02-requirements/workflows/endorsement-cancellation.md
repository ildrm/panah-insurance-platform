---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-ENDORSEMENT-CANCELLATION",
  "title": "Endorsement/cancellation",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "SVC-04",
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

# Endorsement/cancellation

## Preconditions and authority
Authorized policy relationship, product-specific change eligibility and carrier capability; request does not itself change coverage.

## Exact sequence
```mermaid
sequenceDiagram
  participant Holder
  participant API
  participant DB
  participant Worker
  participant Carrier
  participant Approver
  participant Provider
  Holder->>API: Request amendment/cancellation with effective date
  API->>DB: Validate policy version and bind request evidence
  Worker->>Carrier: Submit allowed endorsement/cancellation request
  Carrier->>API: Confirm revised policy version and financial adjustment
  API->>DB: Append endorsement and authorized effective interval
  Approver->>API: Approve any resulting refund or extra premium
  Worker->>Provider: Execute verified finance adjustment
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Unknown carrier outcome leaves previous authoritative policy projection with pending notice. No coverage cancellation from local refund button. Negative premium adjustment is not permission to pay twice.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-ENDORSE: Duplicate carrier response creates one version; rejection retains old coverage and all request history.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
