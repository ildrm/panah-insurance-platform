---
{
  "id": "DOC-10-TESTING-AND-TESTABILITY-STANDARDS",
  "title": "Testing and testability standards",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Testing and testability standards

Test risk-bearing behavior rather than implementation shape. Unit tests cover domain decisions, property tests cover money/allocations/state invariants, integration tests use real transactional storage boundaries, contract tests cover canonical/partner transformations and E2E tests cover actual personas/channel modes. Accessibility/security/performance tests complement these layers.

Inject clock, randomness, ID provider, partner client and durable-job scheduling so duplicates, expiration and timeout-after-acceptance are reproducible. Synthetic fixture names must never resemble claims of real carrier connectivity. Capture fixture seed, schema version and expected outcome. Avoid sleeps as correctness synchronization; advance a fake clock or await a durable condition.

Each test has stable acceptance/requirement IDs, preconditions, action, observed result and prohibited side effects. Failure tests assert no ledger duplication/data leak, not merely an HTTP code. A mock cannot prove database locking or provider idempotency; those require integration/contract evidence.

TEST-STD-01 mutation testing or deliberate invariant break demonstrates critical tests fail; TEST-STD-02 shuffled callbacks converge; TEST-STD-03 context/role revocation denies stale access; TEST-STD-04 disabled sales preserves contracted servicing. Coverage is risk-based; arbitrary function-size rules and universal 100% line coverage are not delivery evidence.
