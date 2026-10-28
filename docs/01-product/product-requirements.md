---
{
  "id": "DOC-01-PRODUCT-PRODUCT-REQUIREMENTS",
  "title": "Product requirements",
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

# Product requirements

The [feature catalog](../_meta/feature-catalog.yaml) is the complete capability register; [product catalog](../_meta/product-catalog.yaml) enumerates 24 distinct insurance families. Stable child requirement IDs, acceptance IDs and source text preserve compound scope. Desired capability is distinct from rollout default and implementation status.

Full purchase lifecycle: discover → risk questionnaire → validated inquiry/evidence → carrier quotes → comparison → underwriting/inspection if required → accepted offer and relationships → payment or approved credit commitment → durable carrier transmission → insurer-issued reference/document → effective coverage according to carrier confirmation → servicing. Assisted offers use approved proposal versions and retain audit evidence.

Adjacent lifecycle: authorized vehicle inquiry → confirmed obligation → verified payment/receipt; provider booking/parts fulfillment → completion/return → settlement; vehicle trading and financial referrals use separately gated authority and consent.

No screen may infer policy activation from payment success. No corporate UI may use membership as access to unrelated policies. Product variations bind schema, rate, evidence, consent, mapping and policy versions at commitment. Acceptance is defined per child and cross-cutting invariants, not by counting screens.
