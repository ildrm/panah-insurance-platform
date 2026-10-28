---
{
  "id": "DOC-00-GOVERNANCE-DECISION-AND-CHANGE-CONTROL",
  "title": "Decision and change control",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
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

# Decision and change control

Architecture decisions are proposals in [the decision register](../_meta/decisions-register.yaml). A decision record contains context, alternatives, selected proposal, consequences, measured validation and named responsible reviewer. Status moves proposed → reviewed → accepted only when a real approver identity, timestamp and immutable evidence reference exist. No generated record is human-approved.

Change workflow: R03 maps impacted child IDs, R05 checks dependency effects, R06 updates measurement design, R11/R12 assess sensitive changes, R01 records product disposition, and R17 regenerates traceability. Breaking schema changes require a new major schema and explicit old-reader compatibility window. Historical purchases retain old rule/mapping/consent versions.

Conflict record CF-001: no conflicting accepted repository decisions found; only the project README existed. Any later discovered acceptance evidence takes precedence over these proposals. Keep both records, describe the conflict and select a reversible default for noncritical behavior. Missing insurer authority is a blocker, not a detail to guess.
