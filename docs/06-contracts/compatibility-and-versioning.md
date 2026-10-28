---
{
  "id": "DOC-06-CONTRACTS-COMPATIBILITY-AND-VERSIONING",
  "title": "Compatibility and versioning",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R08",
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

# Compatibility and versioning

Major versions change incompatible semantics; additive optional fields require consumers to handle absence and explicit contract review. Never widen a public response by serializing an updated database object. Retain old mapping/schema versions for in-flight purchases, documents and event replays.

The canonical schema builder and authored feature operation/type fragments are sources; OpenAPI and AsyncAPI are generated artifacts. Regenerate using `python3 -B docs/_meta/validation/build_contracts.py`, then run schema/reference/examples and drift validation. Client generation is a future implementation task requiring a pinned compatible generator and committed lockfile. No generated TypeScript application is claimed here.

Compatibility gates compare operation IDs, authorization requirements, required properties, enums, formats and error behavior, not just file diffs. Rolling deployments must read previous events and use expand/contract database migrations. Mapping rollback binds new work to the selected reviewed version while committed work retains its original mapping unless an explicit audited migration is proven safe.
