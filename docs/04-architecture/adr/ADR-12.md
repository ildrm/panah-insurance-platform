---
{
  "id": "DOC-04-ADR-12",
  "title": "PWA and native boundaries",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R21",
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

# PWA and native boundaries

## Context

Responsive web and installable PWA are requested; native scope remains uncertain.

## Alternatives

Responsive only; responsive plus PWA; native iOS/Android projects.

## Proposed decision

Propose responsive PWA with public shell offline only; keep native scope undecided and separately estimated, never mark delivered by PWA.

## Consequences

Sensitive offline data is excluded; push permission remains voluntary and transactional access has an online requirement.

## Measurable validation

Mobile upload/interruption/deep-link tests pass; native decision includes owned stack, budget and approval evidence before implementation.

## Review and change

Responsible reviewer: R04, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
