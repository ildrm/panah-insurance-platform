---
{
  "id": "DOC-10-REPOSITORY-AND-MODULE-LAYOUT",
  "title": "Planned repository and module layout",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Planned repository and module layout

Proposed future layout is `apps/storefront`, `apps/portal`, `apps/admin`, `apps/api`, `apps/worker`, `packages/ui`, `packages/api-client`, `packages/contracts` and `docs`. These paths are planned; they do not exist merely because documentation references them. API domain ownership follows the architecture module table; worker code imports application ports from the same owned module boundaries.

Within each backend module use `domain`, `application`, `transport` and `infrastructure` only where responsibilities justify them. Small read services need not invent aggregate/repository layers. Domain types contain no Nest/HTTP/ORM imports. Application use cases own transaction orchestration and ports; SQL/client adapters remain replaceable infrastructure. Public exports form a narrow module API.

UI tokens/components are shared, but privileged pages and account data are not bundled into public routes. Generated contracts/clients have explicit source hashes and no hand edits. Fixtures contain synthetic data and are separated from seed scripts capable of production access.

LAYOUT-01 dependency analysis rejects cross-module persistence imports and cycles; LAYOUT-02 Next packages cannot import database drivers/domain repositories; LAYOUT-03 worker entrypoint cannot accidentally boot public HTTP controllers. Root scripts and package names are chosen at implementation bootstrap; documentation-only changes remain under docs.
