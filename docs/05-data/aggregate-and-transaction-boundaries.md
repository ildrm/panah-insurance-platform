---
{
  "id": "DOC-05-AGGREGATE-AND-TRANSACTION-BOUNDARIES",
  "title": "Aggregate and transaction boundaries",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
  ],
  "source_refs": [
    "S00"
  ],
  "assumption_refs": [
    "A01",
    "A05"
  ],
  "updated": "2026-10-28"
}
---

# Aggregate and transaction boundaries

The order aggregate owns immutable commercial snapshots and one commitment. Payment attempts are separate aggregates because retries and verification can occur independently. A finance use case acquires the payment and order locks in deterministic order, checks provider-reference uniqueness, posts allocation and emits the verified/commit event within a bounded transaction. Payment verification after an expired/disabled order records captured funds and opens remediation without fabricating commitment unless A05's still-valid pre-disable reservation explicitly authorizes completion under fixed terms.

Ledger transaction and postings commit together and balance by currency/unit. Refund reservation locks the original payment allocation and remaining refundable amount. Credit approval locks organization credit/budget and approval version; simultaneous checkers cannot reserve the same capacity twice. Inventory reservations, coupon budgets and wallet debits use guarded atomic updates under their owning modules.

Submission state serializes per order/provider operation. Callback and polling updates use inbox uniqueness plus expected version; valid late confirmations may resolve unknown outcome, but cannot silently undo a refund. Such conflicts enter operator reconciliation. Enrollment changes are effective-dated; overlapping intervals for the same coverage/member are rejected unless the contract allows them.

Transactions contain database work only; no provider calls, uploads, notifications or report rendering. BATCH-TX-01 interleaves approval/withdrawal/refund actions and proves all invariants; BATCH-TX-02 kills the process after commit before publish and finds the outbox event. A transaction timeout returns an uncertain client result only until the idempotency record is queried.
