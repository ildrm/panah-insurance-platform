---
{
  "id": "DOC-09-WORKLOADS-DATA-AND-CAPACITY-ASSUMPTIONS",
  "title": "Workloads, data and capacity assumptions",
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

# Workloads, data and capacity assumptions

Use WL-01 in the [central performance registry](../_meta/performance-budgets.yaml) as the authoritative operation mix, response-size bounds, connection count, think-time model and resource profile. The registry's operation breakdown must sum to its parent percentages; adjust only through versioned workload approval. No alternate narrative mix is valid.

Arrival model is open-loop scheduled arrivals, with dropped/late arrivals counted as failures. A separate closed-loop browser scenario includes recorded think time and abandonment; never compare the two as identical throughput. Use ten logical fictional carrier instances drawn from the three protocols, explicit eligibility distribution and one-outage variant. Save the exact random seed and distributions with each run.

Propose bounded JSON responses: list fixtures with 20 rows, detail fixtures with documented payload size, quotes with three eligible providers median and ten maximum. Record actual compressed/uncompressed p50/p95 bytes and active connections in run evidence; they cannot be left implicit. The simultaneous employee import uses the central dataset and runs throughout foreground load.

Environment profile is a planning proposal: independent load generator, two API and two worker replicas, private database, fixed network delay, and isolated synthetic providers. Exact resources are centralized. No real demand estimate, hardware result or production scaling claim exists.
