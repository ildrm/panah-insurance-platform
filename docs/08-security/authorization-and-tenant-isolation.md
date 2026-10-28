---
{
  "id": "DOC-08-AUTHORIZATION-AND-TENANT-ISOLATION",
  "title": "Authorization and tenant isolation verification",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02",
    "INT-05",
    "COM-02",
    "GRW-01"
  ],
  "source_refs": [
    "S00",
    "S07",
    "S08",
    "S11",
    "S12",
    "S13",
    "S14",
    "S15",
    "S16",
    "S17",
    "S18",
    "S19",
    "S20",
    "S21",
    "S22"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Authorization and tenant isolation verification

Use [architecture policy](../04-architecture/tenancy-identity-authorization.md) as the single decision model. A client-provided organization ID is a selector validated against current membership, not a grant. Every query has a resource scope and every response has an allowed field projection. Bulk jobs and exports re-evaluate authority before processing and retrieval; asynchronous execution does not inherit administrator permissions accidentally.

Negative fixtures contain person P1 in organizations O1/O2, person P2 only in O1 with fewer permissions, and a personal policy of P1 unrelated to either employer. Carrier C1 owns one submission while C2 owns another. Test guessed IDs, nested resources, search counts, file URLs, event streams, report filters, cache keys, overposted properties and support impersonation. Expected result is denied/not-found according to anti-enumeration policy, with no sensitive response body or side effect.

Membership revocation increments an authority version. A stale session cannot mutate after revocation; private reads recheck current authority. Administrative delegation cannot grant a permission the delegator lacks. Maker and checker must be different natural-person identities even across multiple accounts.

SEC-AUTH-01 to SEC-AUTH-04 map to ASVS 5.0.0 8.2.1, 8.2.2, 8.2.3 and 8.4.1. Selected stronger controls include 8.3.2 immediate changes and 8.3.3 originating-subject permissions. Evidence includes denied request, database side-effect assertion and audit record, not screenshots alone.
