---
{
  "id": "DOC-05-IMPORT-EXPORT-AND-BULK-PROCESSING",
  "title": "Import, export and bulk processing",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
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

# Import, export and bulk processing

Imports are staged jobs: authorize template/version and purpose; upload/quarantine; parse with bounded resource limits; validate rows; produce preview with masked errors; obtain approval where required; commit approved rows with immutable batch/row keys. The default is all-or-nothing per independently valid enrollment group, not an undefined mix of partial writes. Large corporate batches may allow explicit partial commit only when the reviewer accepts the listed failures and contract permits it.

Each row records source row number, normalized field values, validation codes, referenced subject/asset, intended effective date and row hash. Formula-like CSV cells are escaped on export. Duplicate identifiers within a batch are rejected before commit. HR sync uses external change identifiers and source versions; stale HR data cannot overwrite a reviewed local correction silently.

Exports run asynchronously from authorized projections with purpose and filter snapshots. Reauthorize at job start and download; membership loss cancels access. Row counts, redaction policy, expiry and hash appear in the audit record. Export access is a separate permission from screen read. Reports avoid transactional full-table scans.

BULK-01 uses the central concurrent-import fixture; BULK-02 retries after a worker crash without duplicate enrollment; BULK-03 revokes exporter permission mid-job; BULK-04 checks health columns and small-cohort suppression. Queue fairness prevents one organization's import from starving paid-order processing.
