---
{
  "id": "DOC-05-DATABASE-INDEXING-AND-QUERY-PLANS",
  "title": "Indexing and query-plan specification",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
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

# Indexing and query-plan specification

Proposed indexes are justified by access paths, not added to every column. Order lists use `(context_owner_id, created_at DESC, id DESC)`; policy lists use `(authorized_owner_id, status, expires_on, id)`; memberships use unique `(organization_id, person_id)` and person/context lookup; provider callbacks use unique `(provider_id, external_event_id)`; attempts use unique `(provider_id, merchant_reference)`; outbox claims use partial `(available_at, id)` for pending rows; reconciliation uses `(state, updated_at, id)`.

Use keyset cursors containing last sort values and filter fingerprint; changing filters invalidates a cursor. Bound default/max page size in API contracts and return only authorized projected columns. Searches on unindexed JSON are prohibited on foreground routes. Product-specific searchable columns are extracted from validated snapshots; complex reports use asynchronous projections.

For every hot operation, record `EXPLAIN (ANALYZE, BUFFERS)` on synthetic production-scale data, query count, rows examined/returned, pool wait and execution time. Plans must be collected without PII and tied to migration/commit hash. Indexes requiring online build have a separate deployment step and recovery procedure.

DB-PLAN-01 tests a large tenant and skewed date/status distribution, warm/cold cache and concurrent import. DB-PLAN-02 detects N+1 queries through count assertions. A faster plan cannot remove resource predicates. Cost estimates alone are not measured latency evidence.
