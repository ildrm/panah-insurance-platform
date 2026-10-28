---
{
  "id": "DOC-04-TRANSACTIONS-EVENTS-WORKFLOWS",
  "title": "Transactions, events and workflows",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-01",
    "CHN-02",
    "CHN-05",
    "INT-01",
    "INT-07"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S02",
    "S03",
    "S04",
    "S09"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Transactions, events and workflows

Direct commitment requires an authoritative verified payment and commercial acceptance. Credit or invoiced commitment requires approved organization terms, commercial-limit reservation and maker-checker evidence; it creates a receivable, never a cash receipt. All emit `purchase.committed.v1` with `commitmentKind=verified_payment|approved_credit|approved_invoice`, immutable application/offer/rule references and recipient-scoped identifiers.

Within one database transaction, lock the aggregate/version, validate state and policy, write effects, audit and outbox. Do not contact a provider while holding the transaction. A worker claims an outbox record, creates a delivery attempt, calls the adapter and durably records acknowledgment. Crashes can repeat delivery; consumer inbox uniqueness on `(consumer,eventId)` and business-key constraints protect local effects. [Outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) supports the atomic-write/duplicate-handling pattern, not exactly-once external effects.

Submission states distinguish pending, sending, acknowledged, rejected, external_outcome_unknown and reconciled; issuance independently records not_started, pending, issued, failed or external_outcome_unknown. A timeout after bytes may have left the process becomes unknown unless the contract proves rejection. Status lookup or stable provider idempotency resolves it. Otherwise quarantine automatic replay and assign reconciliation. Late callbacks update only allowed monotonic transitions under the per-order lock.

Compensations are new commands/events: refund request, reservation release or endorsement. They never delete a verified payment or policy issuance. State details are in [state machines](../02-requirements/state-machines.md). TX-01 kills processes before/after each commit and asserts no lost committed event and no duplicate ledger posting.
