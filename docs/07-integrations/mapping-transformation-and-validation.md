---
{
  "id": "DOC-07-MAPPING-TRANSFORMATION-AND-VALIDATION",
  "title": "Mapping, transformation and validation",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-02",
    "INT-03",
    "INT-04",
    "INT-05",
    "INT-06",
    "INT-07",
    "INT-08",
    "INT-09",
    "INT-10"
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

# Mapping, transformation and validation

Mappings are immutable, reviewed artifacts from canonical schema version to partner schema version. Safe declarative operations permit explicit field selection, constant values, enum tables, bounded array mapping and validated date/unit transforms. Arbitrary expressions, network calls, file reads and administrator-uploaded executable code are prohibited. Exceptional protocols use reviewed adapter code and ordinary release controls.

Validate canonical input before transformation, transformed output before send and partner response before domain interpretation. Unknown enums fail visibly; they are never coerced into success. Preserve request hash, mapping version and masked validation errors. Store raw provider payload only when necessary, encrypted and separately authorized with retention approval.

Money transforms assert source and destination units and exact divisibility/rounding rules. Date transforms distinguish instant, local effective date and calendar notation; timezone defaults cannot change a coverage start silently. Null, absent and empty string have distinct contract meanings. Recipient projection removes fields before transformation, preventing a mapping from accidentally adding employer-private or medical data.

MAP-01 uses synthetic 120000 rial to 12000 labeled toman under the fictional contract; MAP-02 rejects a nonintegral conversion when the contract forbids rounding; MAP-03 rejects unrecognized plan code; MAP-04 replays an old purchase using its original mapping after a new version is deployed. Mapping failures route to operator correction without creating a new financial effect.
