---
{
  "id": "DOC--META-COVERAGE-REPORT",
  "title": "Documentation coverage report",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
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

# Documentation coverage report

Counts are calculated from authored registries, not inferred from file names.

| Coverage | Count |
|---|---:|
| parent features | 74 |
| child requirements | 230 |
| product families | 24 |
| dashboards | 7 |
| dashboard routes | 100 |
| workflows | 16 |
| adrs | 14 |
| api operations | 238 |
| event channels | 195 |
| feature acceptance scenarios | 1610 |
| product acceptance scenarios | 168 |

The preserved baseline contains exactly 74 parent capability IDs and 24 product IDs. Each child has its own rule, operation, fields and acceptance scenarios in the parent specification; shared sections link normative common behavior. The 24-section feature template, seven dashboards and all mandatory topic paths are checked by the validator.

Structural validation result: `pass-structural-with-limitations`. See [raw evidence](validation-report.json) for check counts and limitations. Application tests, actual provider certification, measured performance and human acceptance were not run by this documentation task.

The [wire-artifact check](../07-integrations/simulated-carriers/wire/validation-report.json) records `passed` for JSON fixtures, SOAP XSD, negative cases, independent HMAC verification, runtime calendar conversion and PDF integrity. The [isolated regeneration check](generation-drift-report.json) records `pass`. These validate documentation artifacts; they do not run carrier simulator services.

Semantic review challenged independent modes/servicing, payment-versus-credit commitment, unknown insurer outcomes, double financial effects, cross-tenant/employee privacy, typed contracts and measurable performance boundaries. [Findings](review-findings.md) record corrections and remaining decisions. Documentation remains a draft with exact outstanding items in [continuation](continuation.md); a successful parser cannot close those items.
