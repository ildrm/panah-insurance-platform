---
{
  "id": "DOC-11-QUALITY-FINANCIAL-AND-STATE-MACHINE-TESTS",
  "title": "Financial and state machine tests",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Financial and state machine tests

FIN-01: for every journal/currency, debits equal credits and every source key posts once. FIN-02: duplicate verified callbacks preserve one receipt and one purchase commitment. FIN-03: concurrent refunds cannot exceed verified refundable amount and cannot turn promo credit into cash. FIN-04: credit commitments reserve limit atomically and do not mark payment paid. FIN-05: seller/insurer settlement uses approved allocation and independent checker.

STATE-01: payment verified does not imply issued/active. STATE-02: poll/callback races cannot downgrade issued. STATE-03: unknown submit/payout blocks automatic non-idempotent replay. STATE-04: pre-disable commitment continues authorized servicing. STATE-05: historical rule/consent/mapping versions remain resolvable after publication of new versions.

Use model-based event sequences including crash/restart and duplicate/reordered delivery. Compare DB state and journal projection to a reference model after each step. Invalid commands leave no partial monetary effect; compensations are linked new records, never deleted history.
