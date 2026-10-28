---
{
  "id": "DOC-10-API-SCHEMA-AND-CLIENT-GENERATION",
  "title": "API schema and client generation",
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

# API schema and client generation

The canonical builder `docs/_meta/validation/build_contracts.py` plus authored feature operation/type fragments are documentation-time sources; OpenAPI, AsyncAPI and referenced JSON Schemas under docs/06-contracts are their generated artifacts. Implementation may adopt a generated runtime contract package only through an ADR identifying the new source of truth and reproducible synchronization. Do not maintain hand-written incompatible DTO definitions in frontend and backend.

Generation records tool exact version, input hash, command and output hash. Run schema validation and compatibility diff before generating typed clients. Public schemas contain explicit permitted fields; internal event/persistence models are not exported wholesale. Output examples are synthetic and validate against the same schema as production messages.

Compatibility rules protect operation IDs, status/error semantics, required fields, enum handling, money/calendar units and event envelope versions. Removing a field or changing its meaning requires a new version/consumer migration, not a permissive client cast. Events retain old schemas for historical replay; transaction records retain original schema/mapping references.

GEN-01 clean generation has no diff; GEN-02 old client fixtures work against compatible server changes; GEN-03 deliberately breaking enum/unit changes fail the gate; GEN-04 no persistence-only or sensitive hidden field appears in generated public types. Exact generator dependencies and executable application clients are pending implementation, not fabricated here.
