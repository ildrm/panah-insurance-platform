---
{
  "id": "DOC-04-ADR-08",
  "title": "Financial ledger",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R12",
  "reviewer_roles": [
    "R10",
    "R13"
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

# Financial ledger

## Context

Cash, credits, allocations, commissions and refunds must be explainable after retries and reversals.

## Alternatives

Mutable balances only; balanced append-only ledger with projections; complete event sourcing.

## Proposed decision

Propose balanced append-only postings in explicit currency/unit, with reversal references and locked balance projections. No floating-point accounting.

## Consequences

Additional reconciliation complexity protects auditability. Loyalty points are a separate non-money unit.

## Measurable validation

Property tests assert balanced entries, bounded refunds, no duplicate external references, and concurrent redemption cannot overspend.

## Review and change

Responsible reviewer: R10, R13. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
