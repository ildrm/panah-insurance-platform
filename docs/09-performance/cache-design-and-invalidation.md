---
{
  "id": "DOC-09-CACHE-DESIGN-AND-INVALIDATION",
  "title": "Cache performance and invalidation evidence",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R06",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INS-05",
    "COM-03",
    "INT-07",
    "ORG-04"
  ],
  "source_refs": [
    "S00",
    "S06"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Cache performance and invalidation evidence

Follow [cache ownership](../04-architecture/caching-and-consistency.md). Measure cache benefit as reduced origin work plus hit/miss latency under the same authorization policy. Public catalog/editorial cache can be versioned; private policy/health/wallet data begins uncached. A high hit ratio is not success if users receive stale entitlement or another user's data.

Test warm, cold, lost-cache, stale-public-version and multi-replica invalidation scenarios. Publication produces a durable invalidation event; delayed delivery is visible, and current purchase eligibility is always checked authoritatively. CDN cache keys include public localization/version dimensions and exclude personalized payloads entirely.

CACHE-PERF-01 simultaneous publication and catalog read validates freshness; CACHE-PERF-02 role revocation on replica A while B is warm validates confidentiality; CACHE-PERF-03 cache loss does not cause duplicate payment/issuance; CACHE-PERF-04 organization switch discards old in-flight responses. Record actual headers, cache key class, invalidation version and affected replicas.

Any proposed private cache must provide a separate threat/consistency proof, key projection and reauthorization strategy before performance measurement can justify it. Never increase a public TTL to compensate for an unindexed transactional query. Cosmetic flag staleness is bounded only by PERF-FLAG.
