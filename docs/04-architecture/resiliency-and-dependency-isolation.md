---
{
  "id": "DOC-04-RESILIENCY-AND-DEPENDENCY-ISOLATION",
  "title": "Resiliency and dependency isolation",
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

# Resiliency and dependency isolation

Each provider has independent concurrency limits, deadlines, circuit state and queue partition. A failing quote provider contributes an unavailable result and never delays the aggregation deadline. Retrying a read requires bounded attempts and jitter; retrying a command requires demonstrated idempotency or authoritative absence. Financial or issuance ambiguity is an operational exception, not a transient error eligible for automatic replay.

Separate foreground authorization/checkout resources from imports, exports, notifications and reporting. Admit background work by tenant share and provider capacity. Use durable admission records; reject excess new requests with a documented retry response before accepting responsibility. Do not return success for work that was not persisted.

Circuit open/half-open states are observable and capability-specific. A healthy document endpoint does not prove submit is healthy. Operators may pause a provider operation without disabling policy access or other carriers. Manual alternatives record staff identity, evidence and recipient restrictions; an operator cannot invent an insurer acknowledgment.

RES-01 causes one carrier outage while healthy carriers return offers. RES-02 saturates one tenant's import queue and measures unrelated checkout. RES-03 returns malformed successful HTTP responses and asserts mapping failure, no issuance. RES-04 removes object storage and confirms no unscanned upload is served. Recovery reports oldest durable work age, active leases and external-outcome-unknown count before reopening traffic.
