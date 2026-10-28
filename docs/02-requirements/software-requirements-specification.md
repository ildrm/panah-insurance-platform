---
{
  "id": "DOC-02-REQUIREMENTS-SOFTWARE-REQUIREMENTS-SPECIFICATION",
  "title": "Software requirements specification",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ALL"
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

# Software requirements specification

The feature specs in [features](features/) own capability-specific requirements; the [registry](../_meta/feature-catalog.yaml) and [traceability](../_meta/traceability.csv) bind them to implementation and acceptance. Shared requirements below apply only where the feature's own differences do not impose a stricter rule. They do not replace child field dictionaries or business behavior.

## Common trust boundary contract

All commands receive server-derived actor, active context, permission revision, request ID and injected clock. Tenant IDs in payloads cannot authorize access. Resolve resource relationships before returning fields, changing state or creating an export. Distinguish personal, employer, carrier and seller projections. Sensitive read audit excludes payload contents. Unauthorized object lookup returns the same not-found response shape as an absent object.

HTTP JSON inputs reject unknown fields, malformed UTF-8, unsupported schema versions and oversized bodies. Opaque IDs use UUID strings; string normalization is field-specific, never a global transformation of identifiers. Preserve original legal names while creating separate normalized search keys. Dates use ISO local dates plus explicit calendar/timezone at boundaries; event time uses UTC timestamps. Monetary values are decimal integer strings plus currency/unit, never binary floating point.

## Field dictionary for command envelope

| Field | Type / constraints | Required/default | Sensitivity / example / error |
|---|---|---|---|
| resourceId | UUID | Required on resource commands | Internal; synthetic `00000000-0000-4000-8000-000000000001`; `invalid_resource_id` |
| expectedVersion | Integer 0..2147483647 | Required on mutable versioned resources | Internal; 3; `version_conflict` with latest permitted version |
| idempotencyKey | ASCII string 16..128, no whitespace | Required on money/commit/replay commands | Internal opaque key; no email/phone; `idempotency_conflict` for mismatched hash |
| reason | Unicode string 10..1000 | Required privileged override | Confidential; normalized line endings; `reason_required` |
| effectiveDate | ISO date + explicit product calendar context | Required where policy effect is dated | Confidential; no inferred timezone; `invalid_effective_date` |

Server authority supplies actorId, tenant relationship, immutable config versions, event sequence and financial calculations. Client-supplied computed amounts are comparisons, never an authority. DTOs expose only projected contract fields.

## Transaction, concurrency and error contract

Atomic commands validate input → authorize → lock current aggregate/control version → check guards → mutate owned tables → insert audit/outbox → commit → acknowledge. Do not hold DB transactions across provider I/O. Use optimistic versions for edits and row/advisory locks for financial reservations and per-order transitions. Unique `(scope, operation, idempotency_key)` plus request digest returns identical outcomes for retries; different bodies return 409. Acknowledging a queued command requires a committed durable row.

Errors use stable code, safe message key, correlationId, optional field errors and retriable classification. Codes distinguish forbidden, unavailable mode, expired quote, stale version, validation failure, partner rejection, transient dependency error and `external_outcome_unknown`. Unknown external result is a durable exception requiring reconciliation, not a failed transaction to repeat.

## Experience and operations contract

Every screen defines loading, empty, error, forbidden, read-only, disabled, partial, expired and success behavior. Loading never implies acceptance; an interrupted command is retrieved by request identity. Retain drafts according to published retention; never persist health data in generic browser storage. Keyboard focus moves to error summary and back to failed field. RTL layouts use logical CSS; identifiers/numbers use isolated direction. Offline permits public cached guidance only; money/issuance/claim mutations require online authoritative confirmation.

## Tests and definition of done

Each child has success, invalid input, relationship denial, disabled-state, duplicate/concurrent command and recovery tests as applicable, with explicit N/A reason for inapplicable providers or finance. Unit tests check domain rules; property tests check money/state invariants; integration tests check transactions/authorization; contract tests check actual schemas; E2E tests check user recovery. Performance uses [central budgets](../_meta/performance-budgets.yaml). Completion requires substantive specification, populated traceability, test design and blocker ownership; implementation completion additionally requires executed evidence, migration/rollback and operational readiness.
