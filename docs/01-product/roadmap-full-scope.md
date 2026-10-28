---
{
  "id": "DOC-01-PRODUCT-ROADMAP-FULL-SCOPE",
  "title": "Full-scope roadmap",
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

# Full-scope roadmap

| Slice | Outcome | Depends on |
|---|---|---|
| S0 | Registries, identity/tenancy, flags, contracts, synthetic fixtures, observability | Human architecture review |
| S1 | Catalog, questionnaire, quote comparison, private drafts | S0 + approved product sandbox |
| S2 | Verified payment, ledger, durable submission, policy delivery | S1 + payment/carrier contract tests |
| S3 | Corporate, reseller, beneficiary approvals/census/credit | S0/S2 + commercial terms |
| S4 | Renewals, installments, amendments, support, private claims | S2/S3 + servicing authority |
| S5 | Marketing, CMS, rewards, referrals, reports | S0/S2 + consent and reward review |
| S6 | Automotive inquiries/payments/bookings/parts/utilities | S0/S2 + provider authority |
| S7 | Separately gated trading/financial referrals; native decision | S0/S6 + legal/commercial review |

All 24 product families enter through the same safe infrastructure but retain distinct underwriting and service differences. Complex group/commercial/engineering/cargo products may begin through assisted operations once authorized. Sequencing does not convert full scope into a checkout-only MVP. See [delivery backlog](../14-delivery/implementation-backlog.md) for evidence requirements.
