---
{
  "id": "DOC-12-PAYMENT-ISSUANCE-AND-RECONCILIATION-RUNBOOKS",
  "title": "Payment, issuance and reconciliation runbooks",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-05",
    "COM-09",
    "INT-07",
    "INT-09"
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

# Payment, issuance and reconciliation runbooks

Paid-but-unissued case: verify provider evidence and ledger allocation; inspect commitment and outbox; distinguish unsent, acknowledged awaiting underwriting, rejected and unknown outcome; keep customer payment/coverage labels separate; assign R09/R20 or R12 based on discrepancy. Never re-charge to fix a delivery problem.

Amount mismatch case: quarantine fulfillment, preserve provider reference and observed amount/unit, compare accepted price snapshot and mapping version, determine captured funds through authoritative verification, and obtain finance review for correct allocation/refund. No destructive edit to receipt history.

Refund case: validate cancellation/insurer outcome and refundable balance; maker requests, independent checker approves; submit stable refund key; verify provider result before marking paid/posting final reversal. Unknown payout pauses further payout and requires reconciliation. Simultaneous partial refunds lock remaining capacity.

Credit case: inspect approved terms, checker and reserved capacity; create receivable/settlement obligations without a cash receipt; escalate overdue accounts according to approved collection agreement, never invented penalties.

OPS-FIN-01 duplicate callback/worker crash produces one allocation; OPS-FIN-02 refund and late issuance conflict remains explicit; OPS-FIN-03 ledger/provider/insurer settlement totals reconcile or show owned discrepancies. Payout authority, accounting mapping and collection agreements are external launch blockers.
