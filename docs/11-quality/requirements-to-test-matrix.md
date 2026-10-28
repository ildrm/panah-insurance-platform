---
{
  "id": "DOC-11-QUALITY-REQUIREMENTS-TO-TEST-MATRIX",
  "title": "Requirements to test matrix",
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

# Requirements to test matrix

[Traceability CSV](../_meta/traceability.csv) is the machine-readable source linking parent, child, product, persona/channel, screen, permission, flag, business rule, entity, API, event, integration, test, budget, docs, planned implementation and slice. Multiple acceptance IDs in a cell are semicolon-separated; no blank cell counts as coverage. Inapplicable fields begin `N/A:` with the specific reason.

R03 owns requirement semantics, R13 owns test design and R17 checks references. A path existing does not prove its cited requirement is addressed. Review every compound capability against S00 and every material product variation against its fixture. If an operation or acceptance ID is only planned, mark the row partial and retain the exact missing contract/test behavior.

Gate: compare registry parent/product sets against immutable baseline and require child IDs and acceptance references. Perform substantive review of missing fields, state transitions, denial, concurrency and provider failure cases. Record structural and semantic completion separately.
