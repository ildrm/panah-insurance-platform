---
{
  "id": "DOC-11-QUALITY-TENANT-PERMISSION-AND-CACHE-ISOLATION-TESTS",
  "title": "Tenant permission and cache isolation tests",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Tenant permission and cache isolation tests

Negative matrix: two users in two tenants; dual-membership user; carrier staff; seller delegate; employer HR; finance-only staff; anonymous client; revoked role. For each private GET/command/export/document grant try replacing resource, subject, organization, carrier and seller IDs independently. Assert property-level projection, not only HTTP status.

Cache probes: prime as A then request as B; switch organization in same tab; revoke role and reuse ETag/router navigation; log out then browser back; rotate permission revision; route requests across two replicas; replay expired document URL. Private response must not become shared cache content. Public catalog cache must exclude negotiated pricing.

Employer health reporting tests cohort threshold, complementary suppression, repeated filters and exports to prevent differencing. Audit sensitive access without writing medical payloads. Fail release on any cross-context disclosure regardless of measured latency.
