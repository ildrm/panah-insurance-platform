---
{
  "id": "DOC-04-ADR-13",
  "title": "Infrastructure and region",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
  "reviewer_roles": [
    "R19",
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

# Infrastructure and region

## Context

No permitted deployment jurisdiction, provider contract or residency evidence is supplied.

## Alternatives

Managed private services in approved region; self-hosted; multi-region active-active.

## Proposed decision

Propose single approved primary region with isolated recovery copy only after R19/R14 review; vendor and region are unselected.

## Consequences

Production remains blocked; local synthetic evaluation can proceed. Active-active finance is excluded until conflict design is justified.

## Measurable validation

Document approved data locations and partner connectivity; perform restore/failover/rollback and record actual recovery measurements.

## Review and change

Responsible reviewer: R19, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
