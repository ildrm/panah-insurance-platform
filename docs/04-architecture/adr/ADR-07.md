---
{
  "id": "DOC-04-ADR-07",
  "title": "Next rendering and cache model",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R07",
  "reviewer_roles": [
    "R06",
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

# Next rendering and cache model

## Context

Public content benefits from caching while private policies and claims must remain isolated.

## Alternatives

Blanket caching; no caching anywhere; explicit route/data classes.

## Proposed decision

Propose public-only versioned caching and dynamic private no-store routes; private app cache requires a later measured exception.

## Consequences

Higher private read load, simpler confidentiality reasoning; multi-replica public invalidation needs evidence.

## Measurable validation

Inspect actual browser/proxy headers; exercise context switch, logout, revocation and multi-replica caches on selected Next release.

## Review and change

Responsible reviewer: R06, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
