---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-CORPORATE-NEGOTIATED-GROUP-PURCHASE",
  "title": "Corporate negotiated/group purchase",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "GRW-07",
    "ORG-04",
    "ORG-03"
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

# Corporate negotiated/group purchase

## Preconditions and authority
An organization buyer has scoped requester and independent approver; census evidence is permitted, health fields separated, group product and negotiated carrier authority present.

## Exact sequence
```mermaid
sequenceDiagram
  participant Requester
  participant API
  participant DB
  participant Worker
  participant Carrier
  participant Approver
  Requester->>API: Upload census/asset schedule with effective dates
  API->>DB: Create import job and encrypted source reference
  Worker->>DB: Validate rows, identities and overlapping periods
  Requester->>API: Review row errors and approved preview digest
  API->>Carrier: Send permitted aggregate/schedule proposal
  Carrier->>API: Return negotiated offer version and terms
  Approver->>API: Approve exact offer/census digest within delegation
  API->>DB: Reserve budget/credit or create payment order
  Worker->>Carrier: Submit committed group and per-member recipient data
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Negotiated offer changes invalidate prior approval. Partial row acceptance requires explicit approved policy; no silent dropping of dependents. Employer does not receive private health claims or underwriting evidence.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-GROUP: Given a changed census after approval, when purchase is attempted, then version conflict requires renewed approval and no carrier submission occurs.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
