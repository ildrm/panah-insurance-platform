---
{
  "id": "DOC-04-ADR-02",
  "title": "Frontend applications and deployment separation",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R07",
  "reviewer_roles": [
    "R04",
    "R11"
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

# Frontend applications and deployment separation

## Context

Public acquisition, partner work and privileged operations have different access and bundle profiles.

## Alternatives

Single Next app; storefront/portal/admin; one app per persona.

## Proposed decision

Propose three Next deployables sharing design tokens and typed clients; employee/personal contexts remain explicitly separated within authenticated routing.

## Consequences

More build artifacts but smaller privilege surfaces; do not duplicate backend logic.

## Measurable validation

Route authorization matrix and PERF-JS pass for all seven dashboards; deployment rollback exercises all three clients against compatible API.

## Review and change

Responsible reviewer: R04, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
