---
{
  "id": "DOC-14-DELIVERY-DEFINITION-OF-READY-AND-DONE",
  "title": "Definition of ready and done",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R18",
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

# Definition of ready and done

Ready: stable requirement/acceptance IDs; product/carrier variation understood; API/schema and field permissions reviewable; state/transaction boundary and failure behavior specified; test fixtures and budgets chosen; missing authority isolated behind disabled live operations; owner assigned.

Done for documentation: substantive sections, resolvable contracts and links, preserved compound scope, honest metadata/status, structural checks and semantic review. Done for implementation additionally requires actual code, compatibility lock, passing risk-based tests, measured budget evidence, migration/rollback and runbook rehearsal. Done for live capability additionally requires real contracts/certification and human approval.

No unreviewed generated artifact is accepted. A blocked production integration may have documentation done if its sandbox interface and operational restriction are complete. A missing field contract or acceptance behavior is a documentation gap, not an external dependency.
