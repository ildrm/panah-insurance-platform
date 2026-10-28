---
{
  "id": "DOC-04-ADR-09",
  "title": "Connector framework",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R11",
    "R02"
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

# Connector framework

## Context

Carrier schemas, protocols, currencies, calendars and reliability guarantees differ.

## Alternatives

One universal payload; versioned adapters behind canonical capabilities; custom scripts in admin.

## Proposed decision

Propose versioned code adapters with safe declarative mappings and discoverable operation capabilities; arbitrary admin code is prohibited.

## Consequences

Requires onboarding and conformance per partner; unsupported operations remain assisted/disabled, never invented.

## Measurable validation

Three fictional protocol simulators pass mapping/auth/failure/ambiguity tests; real partner certification remains separately blocked.

## Review and change

Responsible reviewer: R11, R02. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
