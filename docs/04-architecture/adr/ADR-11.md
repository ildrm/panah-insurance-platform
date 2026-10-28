---
{
  "id": "DOC-04-ADR-11",
  "title": "Observability",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
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

# Observability

## Context

Critical latency spans browser, API, database, durable work and external partners.

## Alternatives

Logs only; correlated traces/metrics/redacted audit; full payload logging.

## Proposed decision

Propose OpenTelemetry-compatible trace propagation, bounded metric labels, immutable audit and recipient-minimized diagnostic records.

## Consequences

Sampling reduces trace completeness; finance/audit evidence remains unsampled and separately protected.

## Measurable validation

Follow one synthetic order end-to-end without PII/secret values; alerts locate queue versus provider delay; cardinality load stays bounded.

## Review and change

Responsible reviewer: R06, R11. Human decision is pending. R18 records evidence and approval; a later proposal must explain deviations and preserve prior transaction interpretations. No benchmark, security certification or deployment approval is implied.
