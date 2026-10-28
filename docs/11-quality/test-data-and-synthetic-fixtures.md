---
{
  "id": "DOC-11-QUALITY-TEST-DATA-AND-SYNTHETIC-FIXTURES",
  "title": "Test data and synthetic fixtures",
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

# Test data and synthetic fixtures

Fixtures use fabricated identities and opaque UUIDs, synthetic carrier names and `.invalid` endpoints; no copied customer records. Product fixtures distinguish incompatible risk dimensions, ages/dates, riders and evidence. Monetary numbers demonstrate arithmetic only and are not offered rates.

Security seed: User A owns personal policy P1 and employee record E1 in organization O1; User B owns P2/E2 in O2; User C belongs to both O1/O2; carrier K1 sees only its transactions; seller S1 has a revocable delegation for P1. Add separate requester/checker/finance accounts and revoked-session variants. Test anonymous guessed IDs, cross-context exports, small-cohort health reports and stale client caches.

Performance seed follows the central workload registry and deterministic seed. Include expired/future/cancelled policies, duplicate external references, incomplete uploads, unknown outcomes, zero remaining refunds and stale approvals. Retain schema versions and fixture hashes so a changed fixture cannot silently improve benchmark results.
