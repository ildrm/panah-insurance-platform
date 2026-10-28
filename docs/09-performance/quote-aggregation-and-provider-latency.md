---
{
  "id": "DOC-09-QUOTE-AGGREGATION-AND-PROVIDER-LATENCY",
  "title": "Quote aggregation and provider latency",
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

# Quote aggregation and provider latency

An eligible quote start creates a persisted session and a bounded provider work set based on product/channel/contract versions. Deduplicate equivalent active requests by application/risk/coverage version and authorized context; never share private corporate pricing across subjects. Limit provider and tenant concurrency with shared permits and deadline propagation.

Return accepted session state promptly, then expose genuine provider results progressively. Each provider result is success, ineligible, unavailable, timeout or mapping_error with customer-safe explanation. Comparison normalizes coverage semantics, not just premium. A quote without required terms or validated price cannot be shown as purchasable.

PERF-QUOTE distinguishes first eligible result from aggregation completion and conditions the first-result target on a healthy eligible dependency. Record provider call time, normalization, serialization, number of eligible carriers, retry amplification and end-to-end latency. At the aggregation deadline, publish partial/timeout state and preserve later audit observations without silently extending validity.

QUOTE-PERF-01 one/three/ten eligible providers; QUOTE-PERF-02 fastest provider fails while another succeeds; QUOTE-PERF-03 all unavailable returns honest no-offer state; QUOTE-PERF-04 repeated customer refresh does not multiply active fan-out. A provider circuit is per operation and never disables all insurers merely because B2B sales are off.
