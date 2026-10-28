---
{
  "id": "DOC-04-ADR-14",
  "title": "Feature-control consistency",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R01",
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

# Feature-control consistency

## Context

Sales can be switched independently while contracted servicing must continue.

## Alternatives

Client-only flags; cached server checks; authoritative commit-time versions plus presentation cache.

## Proposed decision

Propose deny-intersection scoped controls, immutable approved versions, atomic commit-time evaluation and separate security quarantine.

## Consequences

Some mutations acquire shared configuration-epoch locks; flag service failure fails closed for new sales, not silent loss of committed work.

## Measurable validation

All B2C/B2B combinations, disable/commit race, old-event replay and carrier independence tests pass; historical decision versions remain auditable.

## Review and change

Responsible reviewer: R01, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
