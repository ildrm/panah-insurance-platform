---
{
  "id": "DOC-06-CONTRACTS-ERRORS-PAGINATION-IDEMPOTENCY",
  "title": "Errors pagination idempotency",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R08",
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

# Errors pagination idempotency

Errors use application/problem+json with stable `code`, `messageKey`, `correlationId`, `retriable` and bounded field errors. No stack trace or raw partner message is exposed. 404 conceals inaccessible objects; 403 identifies a forbidden action on an otherwise accessible context; 409 handles stale versions, expired offers, mode conflicts and key/body mismatches; 422 is domain/input rejection; 429 includes retry guidance; 503 is definite transient unavailability. Unknown outcome is a persisted pending state, not a definite 503 failure.

Cursor pagination sorts by a whitelisted field plus stable ID, caps page size and signs an opaque cursor bound to context/filter/schema version. Changing context invalidates the cursor. Counts must not reveal inaccessible rows; large exports are asynchronous and reauthorized at retrieval. Offset-based unbounded scans are prohibited for growing policy/ledger tables.

Idempotency keys are opaque 16–128-character values scoped by principal/context and operation, linked to a request hash and durable result. Same key/body returns prior result; different body is409. Retention must cover provider retry and reconciliation window under approved records policy. Stable business keys outlive transport attempt IDs. Optimistic versioning protects edits, while money/limit/stock reservations use transaction locks and constraints.
