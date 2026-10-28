---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-BULK-IMPORT-EXPORT",
  "title": "Bulk import/export",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ORG-04",
    "ORG-02",
    "DSH-06"
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

# Bulk import/export

## Preconditions and authority
Requester has organization and field scope; import/export quota and purpose recorded; uploaded source is scanned.

## Exact sequence
```mermaid
sequenceDiagram
  participant Requester
  participant Storage
  participant API
  participant DB
  participant Worker
  participant Approver
  Requester->>Storage: Upload synthetic CSV/XLSX using scoped grant
  API->>DB: Create durable job with schema/effective-date version
  Worker->>DB: Validate rows and produce permission-filtered preview
  Requester->>API: Accept exact preview digest and failure policy
  Approver->>API: Approve required membership/financial changes
  Worker->>DB: Apply bounded chunks with row idempotency and checkpoints
  Requester->>API: Request authorized asynchronous export
  Worker->>Storage: Write filtered encrypted export with short-lived grant
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
CSV formula cells are escaped in exports; parser bombs/oversized files are rejected. All-or-nothing applies to approved logical group if configured; partial policy must list applied/rejected rows. Revoked permissions cancel export access even if file already generated.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-BULK: Concurrent 20,000-row import cannot exhaust checkout pool; restarting a chunk applies each effective membership change once and preserves explicit row failures.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
