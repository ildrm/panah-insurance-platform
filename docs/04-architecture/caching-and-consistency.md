---
{
  "id": "DOC-04-CACHING-AND-CONSISTENCY",
  "title": "Caching and consistency",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-01",
    "CHN-02",
    "CHN-05",
    "INT-01",
    "INT-07"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S02",
    "S03",
    "S04",
    "S09"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Caching and consistency

The database is authoritative for balances, approvals, quote validity, purchase eligibility, feature epochs and resource authorization. A cache may accelerate public reads but cannot establish a mutation invariant. Start without private application caching; measure before introducing its security and invalidation cost.

Public cache keys include locale, published catalog version and public channel. Invalidation follows a durable catalog-published event; versioned URLs prevent stale assets crossing releases. Sensitive responses and signed document links are not CDN-cacheable. If a private cache is later approved, key material must include opaque subject/context hashes, relationship scope, membership epoch, data version and projection version; reauthorize before release and never log the full key.

An organization switch cancels outstanding fetches and discards results from the old context. Logout clears client query/router state. Browser back navigation must not display retained medical or financial content after the session ends. Replicas serving protected pages must observe current authorization versions; a replica with unbounded lag cannot make authorization decisions.

CACHE-01 runs two users within the same organization with different field grants; CACHE-02 runs the same user across two organizations and personal context; CACHE-03 revokes a role while another replica has a warm cache; CACHE-04 loses the cache during payment verification. No test may pass by dropping authorization checks. Budgets and public freshness are centrally registered.
