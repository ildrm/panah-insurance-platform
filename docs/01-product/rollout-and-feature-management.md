---
{
  "id": "DOC-01-PRODUCT-ROLLOUT-AND-FEATURE-MANAGEMENT",
  "title": "Rollout and feature management",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R01",
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

# Rollout and feature management

Feature controls are defined in [the registry](../_meta/feature-controls.yaml) and enforced at API use cases and worker boundaries. UI visibility is advisory. Defaults preserve desired scope while live new sales and unauthorized third-party operations remain off.

Publish process: prepare versioned proposal → evaluate affected personas/channels/products → run dependency and servicing validation → independent approval for financial/security effects → schedule effective time → atomically activate revision → measure errors/backlog → roll back to a new audited revision if needed. Rollback never mutates history.

Quarantine is a separate privileged control that can suspend dangerous processing while preserving durable obligations. Ordinary commerce flags cannot disable audit, authorization, payment verification or record retention. Re-enable after reviewing queued work against committed versions, current security policy and provider authority; do not replay unknown outcomes automatically.

Release cohorts must have explicit stable allocation and no PII in telemetry. Validate all four B2C/B2B combinations, every B2B subchannel, pre/post-commit races and ongoing servicing before expanding a rollout.
