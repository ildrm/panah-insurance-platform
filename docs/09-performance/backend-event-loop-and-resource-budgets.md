---
{
  "id": "DOC-09-BACKEND-EVENT-LOOP-AND-RESOURCE-BUDGETS",
  "title": "Backend event loop and resource analysis",
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

# Backend event loop and resource analysis

Instrument ingress latency, handler duration, validation/authorization time, pool wait, SQL duration, serialization, event-loop delay, heap, RSS, garbage collection and process CPU. Separate route classes so a fast health endpoint cannot hide slow checkout. Histogram labels use route templates and operation classes, never customer IDs or arbitrary URLs.

Expensive parsing, compression, document generation and image processing use bounded worker processes. Read request bodies with limits before allocation; provider responses are capped and schema-validated. A cancellation signal can stop safe quote work after deadline but does not discard durable financial/issuance work. Avoid unbounded Promise.all across carriers or import rows.

Proposed resource gates are derived from the central workload: compare steady-state memory before/after soak, pool/queue waits, worst blocking stack and error distribution. No event-loop or heap threshold is claimed measured; R06 registers agreed resource limits before a release gate. Flamegraphs and heap profiles use synthetic data only.

BACK-PERF-01 runs equivalent HTTP adapter candidates with all middleware; BACK-PERF-02 introduces a slow parser/large payload and verifies admission limits; BACK-PERF-03 runs imports during checkout; BACK-PERF-04 proves worker saturation cannot take API authorization capacity. Optimize only after identifying the dominant measured cost.
