---
{
  "id": "DOC-05-ANALYTICS-DATA-BOUNDARIES",
  "title": "Analytical data boundaries",
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

# Analytical data boundaries

Operational tables are not a general-purpose BI endpoint. Projection workers consume versioned recipient-minimized events and build access-scoped analytical models. Finance reports reconcile to ledger snapshots and disclose as-of time; marketing conversions cannot be used as proof of payment or issuance. Late and duplicate events are handled by unique event IDs and deterministic replay.

Raw health evidence, identity documents, OTPs, bank details and credentials are excluded from analytics. Use pseudonymous actor/session references with approved consent where required. Employer outputs use suppressed aggregates with minimum-cohort and complementary-suppression rules; a series of overlapping filters must not reveal a single person's diagnosis or claim value. Cross-context personal policies are never included.

Metric definitions include numerator, denominator, exclusions, event time versus processing time, timezone, dimensions, owner and freshness. Public aggregate metrics are not exposed before privacy review. Access-controlled exports use the same policies as dashboard views and reauthorize at download.

AN-DATA-01 injects duplicate/out-of-order events and verifies unchanged metrics; AN-DATA-02 compares financial totals against a closed ledger snapshot; AN-DATA-03 probes small groups and subtraction across adjacent reports; AN-DATA-04 scans events/logs for forbidden fields. No production telemetry or warehouse is implemented by this document.
