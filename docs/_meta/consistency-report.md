---
{
  "id": "DOC--META-CONSISTENCY-REPORT",
  "title": "Cross-document consistency report",
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

# Cross-document consistency report

The central vocabulary separates identity, tenant, channel, carrier and commercial relationships. The canonical state machine owns purchase/payment/submission/underwriting/issuance/policy/delivery/refund/claim states; feature-local workflow stage labels are not alternative persisted state enums. Money uses `amount` integer string plus explicit currency/unit; no ledger floating point or mutable historical journal.

Purchase commitment references immutable risk/form/price/consent/mapping versions. Direct verified-payment and approved-credit/invoice paths emit the same commitment family with distinct commitmentKind. Payment schema conditions require a receipt/time/money when verified and exclude these from unresolved/nonverified results. Group insured schedules use immutable references so a bounded snapshot need not inline the census.

Commercial feature disable is serialized with new commitment checks. Proposed A05 explicitly governs a still-valid pre-disable payment reservation; no reservation means verified money enters exception/refund review. Workers preserve committed servicing and separately check security quarantine. Insurer transport never depends implicitly on the B2B-buyer switch.

All hard performance/recovery targets live in the central registry. Field Web Vitals/monthly availability use observational workload definitions, not the synthetic environment. Queue recovery includes an explicit2400-job backlog and ongoing arrival rate. Browser sessions and scoped API clients are distinct OpenAPI security alternatives; cookie mutations require CSRF and trusted Origin.

No contradictory accepted decisions were found in the initial README-only repository. All generated proposals remain unapproved. Third-party schema/parser validation and qualified security/stack reviews are recorded separately from the local link/reference/coverage checks.
