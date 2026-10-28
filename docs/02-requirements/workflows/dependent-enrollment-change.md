---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-DEPENDENT-ENROLLMENT-CHANGE",
  "title": "Dependent enrollment/change",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ORG-04",
    "DSH-03",
    "SVC-04"
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

# Dependent enrollment/change

## Preconditions and authority
Employee owns beneficiary relationship; enrollment window/rules are contract versions; proof files are scanned and accessed only by authorized reviewers.

## Exact sequence
```mermaid
sequenceDiagram
  participant Employee
  participant API
  participant DB
  participant Reviewer
  participant Carrier
  Employee->>API: Propose dependent relationship and effective date
  API->>DB: Validate overlapping coverage and proof references
  Reviewer->>API: Approve eligible change with reason/version
  API->>Carrier: Request effective-dated enrollment amendment
  Carrier->>API: Confirm or reject revised schedule
  API->>DB: Create new coverage version and certificate job
  Employee->>API: Retrieve own/dependent certificate
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Backdated changes require carrier authority. Carrier rejection leaves previous effective coverage intact. Employer sees enrollment outcome/billing fields, not diagnosis or private evidence.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-DEPENDENT: Given two overlapping effective changes for one dependent, concurrent approval produces one authorized interval and a version conflict, preserving prior certificates.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
