---
{
  "id": "DOC-04-SCALABILITY-AND-CAPACITY",
  "title": "Scalability and capacity",
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

# Scalability and capacity

Scale stateless API and workers independently; concurrency is limited by database pools and partner quotas rather than process count alone. Keep aggregate writes serialized and avoid distributing an individual order across uncontrolled concurrent workers. A second worker replica must not increase permitted provider throughput without a shared permit mechanism.

Use the synthetic baseline in [workloads](../09-performance/workloads-data-and-capacity-assumptions.md). Model quote amplification as admitted quote starts multiplied by eligible carriers, refreshes and retries. Model imports as row validations plus approved commits, not a single request. Capacity reports include own-service latency and provider-bound end-to-end latency separately.

Extraction triggers are sustained measured queue isolation needs, storage access conflicts or independent ownership requiring release separation. A feature count alone is not a trigger. Before extracting, profile query plans, serialization, pool wait, event-loop lag and per-tenant work share. PostgreSQL durable queue and outbox remain proposed until soak tests establish their impact; broker adoption requires its own recovery/idempotency evidence.

CAP-01 records maximum sustainable arrival rate while all central SLOs hold; CAP-02 increases replicas without exceeding the global connection/provider budgets; CAP-03 demonstrates controlled rejection under overload and backlog recovery with no data loss. Neither local throughput nor a health-route benchmark is production capacity evidence.
