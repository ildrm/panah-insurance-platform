---
{
  "id": "DOC-04-ADR-01",
  "title": "Modular monolith versus services",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R08",
    "R14"
  ],
  "scope_ids": [
    "INT-01",
    "INT-07",
    "CHN-05"
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

# Modular monolith versus services

## Context

One platform spans 74 capabilities without evidence of independent team or scaling boundaries.

## Alternatives

One service per capability; modular monolith; coarse independently deployed domains.

## Proposed decision

Propose one Nest domain codebase with separately scaled API/workers and explicit owned modules.

## Consequences

Avoids cross-service transactions while requiring import rules and resource isolation. Extract only after measured isolation/scaling benefit.

## Measurable validation

All domain import checks pass; no report/import workload violates own-service budgets; benchmark any proposed extraction against this baseline.

## Review and change

Responsible reviewer: R08, R14. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
