---
{
  "id": "DOC-14-DELIVERY-IMPLEMENTATION-HANDOFF",
  "title": "Implementation handoff",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R18",
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

# Implementation handoff

Start at [documentation status](../_meta/documentation-status.json), [continuation](../_meta/continuation.md) and [review findings](../_meta/review-findings.md). They distinguish written artifacts, validation evidence and exact outstanding gaps. No application has been implemented, tested or deployed.

R05 reviews proposed ADRs before scaffolding. R07/R08 then pin exact supported package versions and commit a lockfile with compatibility/security evidence, keeping Next presentation and Nest domain ownership. R13 builds synthetic and contract tests before real provider integration. R09/R19/R12 secure actual contract/authority evidence without placing secrets in repository.

Implement dependency-ordered slices; select a product with authorized contract for first sandbox journey without deleting the other families. Every changed contract regenerates clients/fixtures and updates traceability. Preserve existing unrelated work. Run documentation checks after changes and record real test evidence before any readiness claim.
