---
{
  "id": "DOC-04-ARCHITECTURE-OVERVIEW",
  "title": "Architecture overview",
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

# Architecture overview

The proposed system is a modular NestJS domain application deployed as API and worker processes, with PostgreSQL as transactional authority. Next.js storefront, partner portal and administrator applications render and orchestrate presentation; every commercial decision is a Nest application use case. One release train is sufficient initially. Extraction of a module requires a measured bottleneck, isolation requirement or independent delivery owner.

Requests enter through a TLS proxy. Authentication establishes a subject and selected context, then domain authorization checks relationships, action, resource and current policy version. Mutations validate input, lock the appropriate aggregate, evaluate commercial controls and write business state, audit and outbox atomically. Workers claim durable jobs and call approved partner endpoints outside database transactions. External acceptance is recorded separately from cash and coverage status.

PostgreSQL, object storage and outbound partner access are private infrastructure dependencies. A public CDN serves only original public content/assets. Catalog caching is optional; sensitive responses use `private, no-store`. Reports/imports/documents run as bounded background workloads.

Implementation gates: import-boundary tests; crash-before/after-commit tests; two-person/two-tenant negative tests; representative load against [central budgets](../_meta/performance-budgets.yaml). No running platform or measured result exists. [ADRs](adr/ADR-01.md) record alternatives; [domain ownership](modular-boundaries-and-dependencies.md) is normative for imports.
