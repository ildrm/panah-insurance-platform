---
{
  "id": "DOC-02-REQUIREMENTS-WORKFLOWS-MAINTENANCE-BOOKING-PARTS-FULFILLMENT",
  "title": "Maintenance booking/parts fulfillment",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "AUTO-05",
    "AUTO-06"
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

# Maintenance booking/parts fulfillment

## Preconditions and authority
Authorized provider/seller, inventory or appointment availability and disclosed price/fee/return policy; compatibility data carries source version.

## Exact sequence
```mermaid
sequenceDiagram
  participant Customer
  participant API
  participant Provider
  participant DB
  participant Worker
  Customer->>API: Choose vehicle-compatible item or service slot
  API->>Provider: Reserve inventory/slot with explicit expiration
  API->>DB: Persist cart/booking and accepted terms
  Provider->>API: Verify payment or approved pay-at-service terms
  Worker->>Provider: Confirm fulfillment and shipment/appointment
  Provider->>API: Send signed completion/delivery status
  Customer->>API: Request cancellation/return/complaint within terms
  API->>DB: Hold or release settlement according to dispute state
```

## Commit boundaries and concurrency
Each DB mutation shown is a bounded local transaction. External provider calls occur outside it, with a persisted stable business operation identity and immutable schema/mapping version. Reauthorize resources and field projections on every read, callback application and operator action. Lock the relevant aggregate and use expectedVersion to prevent stale decisions. Money, audit and outbox writes belonging to one decision commit together. The [canonical state machines](../state-machines.md) govern payment/purchase/issuance separately; product-specific insurer state maps must retain provenance.

## Failure, disablement and compensation
Lost reservation requires explicit alternative or refund, not silent substitution. Parts fitment mismatch permits governed return. Provider no-show and incomplete job create disputes; settlement does not follow payment alone. Booking, shipping and policy issuance are distinct states.
New activity follows current discovery/quote/purchase controls. A committed obligation follows its accepted commercial version plus current security quarantine. Retry only classified transient, idempotent work. Record unknown external outcomes and owner before any replay. Notification failure never rolls back money or reissues a policy.

## Testable acceptance
AC-WF-AUTO: Two purchases of last inventory unit produce one reservation; expired reservations release stock; refunded item reverses eligible commission without issuing an insurance policy.
Run with two users, two organizations and one dual-membership user. Revoke the initiating grant before a later asynchronous action and verify current access without losing the durable business obligation. Repeat the callback and crash after local commit; confirm no lost event or duplicate financial effect. Expected evidence: request identities, immutable event sequence, redacted audit trail and ledger/coverage assertions.

## Operations and performance
R20 owns customer-facing exceptions; R09 owns partner transport; R12 owns money exceptions; R11 owns suspected disclosure. Escalate unresolved outcomes with preserved partner references and request hashes. Apply PERF-READ/PERF-WRITE to own-service calls and PERF-QUOTE/PERF-DISPATCH only to their named boundaries in [central budgets](../../_meta/performance-budgets.yaml). No provider-dependent delay is hidden in an internal latency claim. These are specified tests, not executed application evidence.
