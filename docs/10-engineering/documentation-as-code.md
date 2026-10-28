---
{
  "id": "DOC-10-DOCUMENTATION-AS-CODE",
  "title": "Documentation as code",
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

# Documentation as code

Every normative document has unique metadata, owner/reviewers, scope/source/assumption references and draft/proposed status. Machine-readable catalogs link requirements to concrete specs, contracts, acceptance cases and planned implementation paths. Generated files identify their source and are rebuilt deterministically; human amendments must update that source or remove generation ownership explicitly.

Validation checks JSON/YAML schemas, IDs, paths, local links, references, registry enums, baseline parent/product coverage, required feature sections and contract/example compatibility. Schema success proves structure only; substantive gap review checks distinct product rules, fields, actors, fallback, concurrency, disabled servicing and missing external evidence. A file count cannot prove implementation readiness.

Keep hard performance budgets centralized. Canonical state machines and permission vocabulary are shared references; domain specs state their differences instead of copying contradictory variants. A changed parent/child ID requires explicit migration history, not renumbering. Traceability not-applicable cells include reasons.

DOC-01 broken link/ref fails; DOC-02 missing feature/product causes a coverage failure; DOC-03 changed contract invalidates stale examples; DOC-04 status cannot become human-approved without evidence. Continuation records exact incomplete paths/sections and next action. The engineering generator is docs-only tooling; it does not implement application services or execute benchmarks.
