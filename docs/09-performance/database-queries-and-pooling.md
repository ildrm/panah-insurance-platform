---
{
  "id": "DOC-09-DATABASE-QUERIES-AND-POOLING",
  "title": "Database queries and connection pooling",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R06",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INS-05",
    "COM-03",
    "INT-07",
    "ORG-04"
  ],
  "source_refs": [
    "S00",
    "S06"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Database queries and connection pooling

Before load tests, assign a global database connection budget across API replicas, workers, migrations, monitoring and emergency administration. Replica scaling must divide that budget, not multiply it accidentally. Pool acquisition has a deadline and reports overload explicitly. Separate foreground and background pools so imports/reports cannot consume all checkout connections.

Collect per-operation query count, cumulative SQL time, rows scanned/returned, pool wait and lock wait; correlate with sampled traces. Use the indexing plan and synthetic scale/skew. Parameterized bounded reads and keyset pagination are mandatory. Repeated per-row lookups in list endpoints are flagged as N+1 and replaced by authorized batch queries/projections where measured.

Finance, commitment, approvals and authorization reads use authoritative primary state. A read replica may serve an approved stale report with visible as-of time; it cannot approve credit based on lagging balances. Track replica lag and stop stale protected reads according to the registry policy. Query cancellation cannot interrupt an already committed monetary effect.

DB-PERF-01 replays cold/warm plans; DB-PERF-02 runs a locked-order hotspot; DB-PERF-03 adds replicas without connection exhaustion; DB-PERF-04 restores a dataset and verifies plans/statistics before reopening. PERF-DB supplies proposed pool/query/transaction bounds; measured tuning must update that registry rather than introduce competing budgets.
