---
{
  "id": "DOC-04-ADR-03",
  "title": "HTTP adapter and version decision",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R06",
    "R11"
  ],
  "scope_ids": [
    "INT-01",
    "INT-07",
    "CHN-05"
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

# HTTP adapter and version decision

## Context

The initial discovery had no application manifest. The implementation now pins Nest12.3.2 with its supported Express adapter; a fastest-adapter claim remains unsupported.

## Alternatives

Supported Express adapter; supported Fastify adapter; custom transport.

## Proposed decision

Use the exact locally tested Express candidate in the application lock. Compare a supported Fastify candidate on the same representative workload before any measured adapter-performance decision. No custom adapter is proposed.

## Consequences

Local compatibility/build evidence exists for the Express candidate; full middleware/runtime and representative adapter qualification remains pending.

## Measurable validation

Uploads, security middleware, validation and tracing pass identically; compare p95/p99/CPU/heap under the central workload and record lockfile hash.

## Review and change

Responsible reviewer: R06, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
