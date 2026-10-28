---
{
  "id": "DOC-04-TENANCY-IDENTITY-AUTHORIZATION",
  "title": "Tenancy, identity and authorization",
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

# Tenancy, identity and authorization

A person has one identity and zero or more organization memberships. A selected context is personal, buyer organization, seller organization or carrier organization. Context selection narrows permissions; it never combines all memberships into a union. Insurer, sales channel, tenant and beneficiary relationship are separate columns and separate policy inputs.

The authorization decision is `subject + current membership version + context + action + resource relationships + field projection + state`. Resolve context from a verified session and revalidate requested identifiers. A tenant identifier supplied by a client is not trusted. Personal policies use subject relationships, not employer membership. Employer health reporting uses approved aggregates with suppression; raw diagnoses, claim evidence and unrelated personal purchases remain unavailable. A carrier may read its own recipient projection only.

New mutation authorization and commercial control checks occur at the transaction's lock/commit boundary. Revocation increments a policy epoch and invalidates sessions/cache entries; protected reads reauthorize against current membership. Privileged support access requires a case, reason, time-bound scope and audit. Viewing a record does not imply permission to export or mutate it.

Tests AUTH-01 through AUTH-06 cover two tenants, personal/employer separation, substituted resource IDs, overposted hidden fields, role revocation during an open tab, and stale requests after context switch. Apply the same tests to exports, background jobs, file links and websocket/event streams. [Permission registry](../_meta/permissions.yaml) defines the action vocabulary.
