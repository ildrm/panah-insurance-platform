---
{
  "id": "DOC-04-ADR-04",
  "title": "Storage and query approach",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R08",
    "R12"
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

# Storage and query approach

## Context

Finance and commerce need relational consistency and auditable SQL plans.

## Alternatives

PostgreSQL with explicit pg SQL; one ORM; multiple persistence abstractions.

## Proposed decision

Propose PostgreSQL with typed use-case repositories and parameterized pg SQL. Migrations are reviewed SQL; choose exact supported releases at bootstrap.

## Consequences

More explicit mapping; fewer opaque query surprises. Domain objects stay separate from rows and DTOs.

## Measurable validation

Rollback/restore and plan evidence on full dataset; transaction tests for money/credit; no unbounded scans on ordinary reads.

## Review and change

Responsible reviewer: R08, R12. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
