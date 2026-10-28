---
{
  "id": "DOC-10-GIT-REVIEW-AND-COMMIT-POLICY",
  "title": "Git, review and change control",
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

# Git, review and change control

Use focused changes with requirement/ADR references, user-visible behavior, compatibility impact, validation and remaining risks. Preserve unrelated work and never rewrite accepted decisions silently. A documentation proposal is draft/proposed until real approval evidence is attached; role-lens review by an agent does not count as human sign-off.

Financial, authorization, partner mapping and migration changes require the corresponding domain reviewer plus test evidence. Maker-checker governance applies to live configuration independently of source-code review. PR descriptions explain the concrete trigger and resulting behavior, affected contracts, rollout/rollback and commands actually run.

Before merge, check formatting/types, contract/schema drift, dependency boundaries, risk-relevant tests and documentation traceability. Secret scans reject accidental credentials. Performance-sensitive changes include representative before/after evidence or an explicitly tracked missing benchmark gate. Do not claim tests passed when only a plan exists.

REVIEW-01 a changed rule/field/event updates traceability and affected examples; REVIEW-02 breaking contract change has migration/version approval; REVIEW-03 unrelated files remain unchanged. Branch naming/commit style is a team convention to decide at implementation; no fabricated repository policy or branch protection is asserted. Deployment or merge authorization is outside this documentation task.
