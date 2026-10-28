---
{
  "id": "DOC-04-ADR-06",
  "title": "Tenant and authorization strategy",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R03",
    "R10"
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

# Tenant and authorization strategy

## Context

People can hold personal policies and memberships in multiple organizations.

## Alternatives

Tenant-only RBAC; relationship/resource/field policy with selected context; database per organization.

## Proposed decision

Propose shared database with explicit owner/relationship columns, current-context authorization and optional RLS defense in depth after tests.

## Consequences

Policy complexity is visible; tenant IDs alone never authorize employee health or personal data.

## Measurable validation

Two subjects/two organizations, revocation, field-overposting, export and cache negative tests all pass.

## Review and change

Responsible reviewer: R03, R10. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
