---
{
  "id": "DOC-04-ADR-10",
  "title": "Schema and contract versioning",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R09",
    "R17"
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

# Schema and contract versioning

## Context

Applications must retain historical interpretation while consumers evolve independently.

## Alternatives

Unversioned mutable schemas; semantic contract versions with immutable transaction references; event store for everything.

## Proposed decision

Propose canonical versioned JSON schemas, OpenAPI/AsyncAPI source contracts and generated typed clients; additions compatible only when old readers tolerate them.

## Consequences

Version migration and dual-reader windows require ownership; replacing a mapping does not rewrite historical purchases.

## Measurable validation

Compatibility diff and old/new fixture replay pass; removed required fields or changed money units demand a new version.

## Review and change

Responsible reviewer: R09, R17. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
