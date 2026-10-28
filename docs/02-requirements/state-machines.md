---
{
  "id": "DOC-02-REQUIREMENTS-STATE-MACHINES",
  "title": "Canonical state machines",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ALL"
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

# Canonical state machines

No single order status represents every domain. Persist each independent machine plus an event sequence and optimistic version. Status projection may summarize them but must expose the distinction. Invalid transitions return 409 with a customer-safe reason; callbacks cannot overwrite a later state with a stale provider observation.

| Machine | States | Allowed transition / actor / guard / atomic effect | Timeout and compensation |
|---|---|---|---|
| Purchase | draft, awaiting_approval, awaiting_payment, committed, cancellation_requested, cancelled | Buyer submits draft after current eligibility; checker approves independent request; verification worker commits paid order or credit service commits approved credit. Lock order/control/credit reservation, snapshot terms, outbox purchase.committed.v1. | Expired draft/quote cannot begin a new reservation. Under proposed A05 only a still-valid, fixed-expiry payment reservation with immutable pre-disable acceptance may complete its original terms; current quarantine/authority still applies. Otherwise paid-but-uncommitted enters payment exception/refund review. Cancellation after commitment requires insurer outcome. |
| Payment attempt | created, pending, verified, failed, expired, external_outcome_unknown | Provider verifier confirms reference, merchant, currency and amount; verified transition inserts receipt/allocation and related purchase event once. Browser redirect is never authoritative. | Unknown verifies/status-polls; definitive failure permits new attempt. Duplicate verification is inert. |
| Submission | pending, sending, acknowledged, rejected, external_outcome_unknown, reconciled | Worker obtains per-order serialization and persists attempt before I/O. Definitive carrier ack -> acknowledged; business rejection -> rejected; timeout after possible acceptance -> unknown. | Status/idempotent lookup resolves unknown; no automatic non-idempotent resend. Reconciled records evidence and chosen next transition. |
| Underwriting | not_required, pending, evidence_required, accepted, rejected | Authorized carrier/underwriter requests evidence or records decision with rule version and reason. | Due-time escalation never auto-accepts risk. Material risk change reopens a new review version. |
| Issuance | not_started, pending, issued, failed, external_outcome_unknown | Confirmed carrier policy reference/document -> issued with authoritative effective dates; rejected submission is not an issued policy. | Poll/callback race uses provider observation identity and per-order version. Unknown remains exception. |
| Policy | pending, future, active, expired, cancellation_pending, cancelled | Future/active derive from issued authority + effective interval + current date semantics; cancellation effective only with carrier approval. | Date rollover changes projection; no new monetary journal merely for rendering. |
| Delivery | pending, available, dispatched, delivered, failed | Document security scan and permission publish -> available; logistics verified status -> dispatched/delivered. | Retry permitted notification/document delivery, never reissue policy as compensation. |
| Refund | requested, approved, submitting, paid, rejected, external_outcome_unknown | Independent checker authorizes remaining refundable amount; worker submits stable refund key; verified provider result posts reversal. | Unknown payout blocks second payout until authoritative reconciliation. |
| Claim | draft, submitted, evidence_required, assessing, approved, rejected, payment_pending, paid, closed | Claimant files; authorized assessor decides with reason; finance checker authorizes contract-backed payout. | Missing authority routes advisory support only; appeal is a linked review, not destructive decision edit. |
| Enrollment | proposed, validated, approved, scheduled, effective, rejected, superseded | Requester imports; checker approves diff; insurer confirms effective change where required. | Overlapping effective periods blocked; rejected rows stay explicit. |

```mermaid
sequenceDiagram
  participant V as Verification / credit service
  participant D as PostgreSQL
  participant W as Delivery worker
  participant C as Carrier
  V->>D: Lock purchase; confirm receipt OR credit authority
  V->>D: Commit purchase + audit + outbox atomically
  W->>D: Claim durable work; persist stable attempt
  W->>C: Recipient projection + stable business key
  alt Confirmed acknowledgment
    C-->>W: Reference and authoritative status
    W->>D: Inbox dedupe + submission transition
  else Timeout after possible acceptance
    W->>D: external_outcome_unknown + exception
    W->>C: Authoritative status lookup when supported
  end
```

Jobs carry reference IDs and versions, not unnecessary medical payloads. Audit records actor, reason, before/after state, source evidence and control revision. Temporary delivery leases are not business states and expire safely. Every terminal transition keeps history; compensation is a new explicit action with independent authority.
