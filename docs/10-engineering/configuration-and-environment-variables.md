---
{
  "id": "DOC-10-CONFIGURATION-AND-ENVIRONMENT-VARIABLES",
  "title": "Configuration and environment variables",
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

# Configuration and environment variables

Validate configuration at startup and activation. Environment-level settings include runtime mode, database secret reference, object-store endpoint/bucket references, trusted ingress origins, outbound destination registry, telemetry destination and feature configuration source. Adapter credentials are secret references scoped to partner/environment/operation, never public Next environment variables.

Commercial rules and flags are versioned database records, not scattered environment booleans. Startup configuration cannot bypass authoritative purchase controls. Required missing security/finance configuration fails startup closed; optional capabilities remain explicitly disabled with diagnostic reason. Public configuration exposes only safe display values and supported locale/product metadata.

Document each variable/key with type, required/default, owner, sensitivity, validation, reload/restart behavior and environment restrictions. Proposed identifiers: `APP_ENV`, `DATABASE_SECRET_REF`, `OBJECT_STORE_ENDPOINT_REF`, `OUTBOUND_REGISTRY_VERSION`, `PUBLIC_ORIGIN`, `OTEL_EXPORTER_ENDPOINT_REF`. These are planned names, not existing deployment values. Do not use common system variables as application state.

CONFIG-01 invalid endpoint/secret/environment combination fails before accepting traffic; CONFIG-02 changing cosmetic config cannot disable audit or authorize purchase; CONFIG-03 restart retains immutable commercial versions and pending jobs. Exact runtime values and secret stores require approved infrastructure; examples must remain synthetic.
