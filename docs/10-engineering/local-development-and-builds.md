---
{
  "id": "DOC-10-LOCAL-DEVELOPMENT-AND-BUILDS",
  "title": "Local development and reproducible builds",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Local development and reproducible builds

The repository now includes an executable partial local/sandbox application. The root README documents npm ci, local:database, local:setup, build, dev, test and browser procedures. Native PostgreSQL data lives under ignored .local/postgres; optional Compose definitions are parsed but container runtime is unqualified. The [implementation continuation](../_meta/implementation-continuation.md) identifies remaining work and exact evidence. The documentation validation command remains separate from application testing.

Planned local environment contains isolated PostgreSQL, private object storage emulator and three fictional carrier protocols plus payment/notification/HR/logistics boundaries. Bind development providers to loopback or an isolated network; use synthetic secret references and deterministic seed data. No production endpoint or personal data is needed for development.

Bootstrap acceptance requires exact supported runtime/package versions and lockfile, one documented install/build/test workflow, validated environment template with no secrets, reproducible schema migrations and synthetic seed/reset procedure. A reset tool must refuse production context. Build public/partner/admin and API/worker artifacts separately while sharing contract source hashes.

DEV-01 a new checkout reproduces docs and future builds using documented commands; DEV-02 offline/provider outage fixtures remain usable; DEV-03 generated files are clean after regeneration; DEV-04 test data contains no real identities. Docker/other orchestration is a later measured convenience decision, not evidence of deployed infrastructure.
