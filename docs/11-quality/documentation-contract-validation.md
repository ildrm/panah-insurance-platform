---
{
  "id": "DOC-11-QUALITY-DOCUMENTATION-CONTRACT-VALIDATION",
  "title": "Documentation contract validation",
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

# Documentation contract validation

Run `python3 docs/_meta/validation/validate.py` from the repository root using the pinned documentation validation environment. The validator checks registry JSON Schemas, frontmatter, unique identifiers, internal links, manifest paths, baseline counts, child/acceptance references and contract references. OpenAPI validation uses a standards-aware validator when available; the report states unavailable validators explicitly.

The metadata YAML files use JSON syntax, a valid YAML subset, for deterministic parsing. Contract schemas use JSON Schema 2020-12, OpenAPI 3.1.0 and AsyncAPI 3.0.0. Complete generated-artifact checks compare inputs and outputs; manual changes must be reflected in the owning generator/data or regeneration will overwrite them.

Structural pass is necessary but insufficient. R03/R13/R17 review content for lost compound scope, generic cloned semantics, missing operation-specific fields, fake acceptance coverage and unsupported completion claims. Keep partial status until these are resolved. The [review findings](../_meta/review-findings.md) and [continuation ledger](../_meta/continuation.md) are authoritative for remaining work.
