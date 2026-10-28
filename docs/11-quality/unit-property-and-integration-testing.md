---
{
  "id": "DOC-11-QUALITY-UNIT-PROPERTY-AND-INTEGRATION-TESTING",
  "title": "Unit property and integration testing",
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

# Unit property and integration testing

Unit tests cover eligibility, normalization, coverage compatibility, flag precedence, date intervals and permission predicates with deterministic clocks. Property tests generate balanced monetary allocations, refund sequences, concurrent budget reservations and state-event sequences; assert nonnegative remaining balances, conservation and no illegal transition.

Integration tests use actual PostgreSQL transaction behavior: unique receipt/source keys, row locks, outbox atomicity, leases, migration constraints and tenant filtering. Simulate failure between every transaction write and commit. A rollback must expose neither purchase nor event; a successful commit must survive worker restart.

Do not mock the component whose invariant is being claimed. Keep provider I/O outside transactions, and test timeout/cancellation separately from local rollback. Test deadlock retry only where business idempotency permits it. Evidence includes SQL constraint errors and resulting journal/state, not merely HTTP 200.
