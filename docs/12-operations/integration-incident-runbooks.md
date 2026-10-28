---
{
  "id": "DOC-12-INTEGRATION-INCIDENT-RUNBOOKS",
  "title": "Integration incident runbooks",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-05",
    "COM-09",
    "INT-07",
    "INT-09"
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

# Integration incident runbooks

For partner outage: identify operation/product/environment and last successful observation; separate quote failure from owed submission/status capability; pause unsafe new commitments; preserve pending work; check approved endpoint/auth/certificate status without printing secrets; notify the authorized partner contact through approved process; recover with bounded concurrency and reconcile backlog.

For ambiguous submit: mark external_outcome_unknown; freeze automatic resend; attach original business key/hash/attempt timeline; use authoritative status/idempotency lookup if supported; otherwise assign verified partner reconciliation; record evidence and independent approval before any resend/refund decision. A not-found response with unbounded eventual consistency is insufficient.

For mapping change: stop only affected adapter version; compare schema/enum/unit/calendar diff; validate synthetic fixtures; create reviewed new mapping; replay read-only transformations; decide treatment of existing attempts under original snapshots. Never reinterpret old accepted prices silently.

For callback abuse: reject unverifiable requests, preserve masked forensic evidence, rotate compromised credential references via incident authority and reconcile valid missed observations. OPS-INT-01 exercises each branch with the fictional simulators and proves no blind duplicate issuance. Actual partner phone/email/contact permissions are missing inputs; this runbook does not authorize unsolicited messages.
