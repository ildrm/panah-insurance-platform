---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-DIGITAL-CLAIMS-PAYMENT",
  "title": "Digital claims/payment",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "SVC-06",
    "SVC-07",
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

# Digital claims/payment

## Preconditions and authority
Claimant relationship and policy eligibility are checked; settlement requires explicit insurer/contract authority. Otherwise intake is advisory/referral only.

## Exact sequence
```mermaid
sequenceDiagram
  participant Claimant
  participant API
  participant DB
  participant Assessor
  participant Approver
  participant Worker
  participant Provider
  Claimant->>API: Submit incident, parties, evidence and consent
  API->>DB: Persist private claim and evidence manifest
  Assessor->>API: Review loss, request supplement or record decision
  Approver->>API: Approve contract-authorized amount and beneficiary
  API->>DB: Reserve payout, audit dual control and enqueue
  Worker->>Provider: Pay approved verified beneficiary with stable key
  Provider->>API: Confirm or report unknown payout result
  API->>DB: Reconcile money and claimant-safe status
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Employer reporting excludes individual health details. Rejected claim supports documented review rights without overwriting decision history. Unknown payout freezes further attempts; bank changes invalidate old approval.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-CLAIM: Given a corporate employee claim, employer admin cannot view incident/evidence/diagnosis, while claimant and assigned carrier assessor can access their allowed projection.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
