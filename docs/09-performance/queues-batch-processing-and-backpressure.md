---
{
  "id": "DOC-09-QUEUES-BATCH-PROCESSING-AND-BACKPRESSURE",
  "title": "Queues, batch processing and backpressure",
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

# Queues, batch processing and backpressure

Prioritize committed purchase transmission and payment reconciliation separately from new quote work, bulk imports, reports and notifications. Use durable jobs with leases, bounded retries and tenant/provider fairness. Queue length alone is insufficient: observe oldest age, age by obligation class, processing time, expired leases, retries and unknown external outcomes.

Backpressure stops accepting excess new work before responsibility is acknowledged. Accepted durable work is never dropped to meet latency. A paused provider leaves owed work visible and alerts operators; safe reconciliation/status jobs may continue under separate capability controls. Recovery drains at provider-permitted throughput rather than flooding a recently recovered endpoint.

Batch size is a tunable bounded configuration validated against transaction time, memory and foreground latency. Imports checkpoint row groups and preserve partial failure semantics. Reports use read projections; document rendering and exports use separate process resources. Repeatedly failing poison messages move to reviewed dead-letter state with evidence.

QUEUE-PERF-01 restarts workers with outstanding leases; QUEUE-PERF-02 floods one tenant while another commits purchases; QUEUE-PERF-03 restores queue access after outage and measures backlog clearance; QUEUE-PERF-04 verifies no unknown issuance is replayed during recovery. PERF-DISPATCH applies under healthy conditions; outages and recovery ages are separately reported.
