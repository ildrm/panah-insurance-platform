---
{
  "id": "DOC-11-QUALITY-PERFORMANCE-AND-FAILURE-INJECTION-TESTS",
  "title": "Performance and failure injection tests",
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

# Performance and failure injection tests

Use the exact operation mix, arrival model, dataset and environment in [performance budgets](../_meta/performance-budgets.yaml). Test warm/cold public caches, sensitive cache isolation, one carrier outage, ten-carrier fan-out, callback duplication, queue catch-up, cache loss and noisy-neighbor import. Capture p50/p95/p99, error types, query count/time, pool waits, event-loop lag, heap, queue age and paid-unissued age.

Record load generator saturation and achieved throughput; failed operations cannot disappear from denominator. Provider latency is separate from own-service boundary. Use representative quote/checkout/portal workloads, never a health endpoint as a substitute. Run burst, steady, soak and recovery with complete fixture/lock/config provenance.

R06 must approve regressions against the central baseline; no existing benchmark result is claimed here. Performance release gate requires measured evidence plus correct money/authorization behavior during injected faults.
