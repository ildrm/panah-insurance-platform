---
{
  "id": "DOC-09-PERFORMANCE-STRATEGY-AND-BUDGETS",
  "title": "Performance strategy and central budgets",
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

# Performance strategy and central budgets

All hard acceptance thresholds live in [performance-budgets.yaml](../_meta/performance-budgets.yaml). Documents refer to PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB, PERF-JS, PERF-AVAIL and PERF-FLAG instead of creating competing numbers. They are proposed targets, not observed results or insurer promises.

Measure own-service reads from ingress after receipt to completed response including authentication, authorization, database and serialization. Writes include durable commit/audit/outbox; provider latency is reported separately. Quote first-result and aggregation completion measure the actual application/provider journey. Dispatch starts at durable commitment and ends at first outbound attempt, while acknowledgment/issuance get separate distributions. Do not omit provider failures from user-journey reporting.

Every result records build/lockfile hashes, environment, seed/dataset, arrival model, operation mix, response-size distribution, concurrency, warm/cold condition, dependency scenario, percentile histogram, sample count and errors. Run production builds with tracing/authorization enabled. Lab, synthetic load and real-user evidence are labeled separately; no local or Lighthouse result is field evidence.

R06 reviews regressions; R13 rejects runs with dropped arrivals or hidden failed requests. Correctness/privacy/security invariants remain gates even when latency improves. Initial baseline, restore and outage evidence are unexecuted. A budget exception requires measured cause, user impact, owner, expiry and acceptance, not an unexplained threshold increase.
