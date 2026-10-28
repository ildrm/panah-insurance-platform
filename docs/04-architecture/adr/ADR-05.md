---
{
  "id": "DOC-04-ADR-05",
  "title": "Broker and outbox delivery",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R10",
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

# Broker and outbox delivery

## Context

Database changes and required outbound work must survive crashes together.

## Alternatives

Database outbox plus PostgreSQL leased queue; outbox to external broker; direct queue publish.

## Proposed decision

Propose database outbox and durable leased job records initially. Direct double-write is rejected. Add a broker only after measured contention or routing needs.

## Consequences

At-least-once execution and vacuum/index maintenance are required. External outcome ambiguity remains even with a broker.

## Measurable validation

Crash matrix proves no lost committed event; duplicate consumers have one logical effect; backlog recovery meets PERF-DISPATCH once healthy.

## Review and change

Responsible reviewer: R10, R14. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
