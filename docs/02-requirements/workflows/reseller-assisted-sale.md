---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-RESELLER-ASSISTED-SALE",
  "title": "Reseller-assisted sale",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "GRW-06",
    "INS-12",
    "COM-01"
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

# Reseller-assisted sale

## Preconditions and authority
Active seller contract, enabled reseller subchannel and customer-specific delegation are required. Seller cannot consent to undisclosed terms for the customer.

## Exact sequence
```mermaid
sequenceDiagram
  participant Seller
  participant API
  participant Carrier
  participant Customer
  participant DB
  participant Provider
  participant Worker
  Seller->>API: Create lead with customer permission and assignment
  Seller->>API: Prepare quote/risk draft within delegated scope
  API->>Carrier: Obtain permitted offer or manual proposal
  Customer->>API: Confirm relationships, declarations and payer
  API->>DB: Freeze seller attribution and accepted proposal
  Provider->>API: Send payment notification for verification
  API->>DB: Commit order and pending commission attribution
  Worker->>Carrier: Transmit purchase under normal durable path
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Delegation revocation immediately prevents new viewing/editing. Lead reassignment cannot rewrite historical commission. Refund reverses eligible accrual by linked entries. No customer-wide access from phone-number search.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-SELLER: Given seller access to customer A, requesting customer B policy by known ID returns indistinguishable not-found and no data appears in exports.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
