---
{
  "id": "DOC-13-DASHBOARDS-AND-REPORTING-ACCESS",
  "title": "Analytics dashboards and reporting access",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R15",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "GRW-03",
    "GRW-04",
    "GRW-05",
    "GRW-09",
    "DSH-06"
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

# Analytics dashboards and reporting access

Customer reports expose own authorized policies/payments and separate contexts. Corporate reports expose permitted portfolio/cost-center/billing/enrollment aggregates, with health data suppressed and no unrelated personal policies. Sellers see assigned relationships and their commissions; carriers see their recipient transactions and settlement projections. Platform staff permissions are task-scoped and export is separate from read.

Each widget identifies source projection, freshness/as-of time, filters, sort, currency/unit and missing/partial state. If projection processing is delayed, show stale status rather than implying current balance. Financial decision screens fetch authoritative records; analytical projections do not approve payouts/credit.

Employer health analytics use minimum cohort and complementary suppression with filter/query restrictions to prevent subtraction attacks. Aggregate access is not blanket permission for row export. Export jobs snapshot purpose/filters/projection version, enforce row limits from the bulk registry and reauthorize download.

AN-ACCESS-01 compares two employees/employers and personal context; AN-ACCESS-02 role revocation denies completed export; AN-ACCESS-03 overlapping cohort filters cannot isolate an individual; AN-ACCESS-04 carrier C1 cannot infer C2 transaction counts. Reporting infrastructure and live data remain unimplemented; privacy review must approve each sensitive metric.
