---
{
  "id": "DOC-08-THREAT-MODEL-AND-TRUST-BOUNDARIES",
  "title": "Threat model and trust boundaries",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02",
    "INT-05",
    "COM-02",
    "GRW-01"
  ],
  "source_refs": [
    "S00",
    "S07",
    "S08",
    "S11",
    "S12",
    "S13",
    "S14",
    "S15",
    "S16",
    "S17",
    "S18",
    "S19",
    "S20",
    "S21",
    "S22"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Threat model and trust boundaries

Assets are identity/medical evidence, organization census, policy rights, precise money, privileged configuration, credentials and audit history. Trust boundaries separate browser/Next/Nest, tenant/subject contexts, domain/persistence, workers/partners, uploads/scanners and analytics/operations. Treat partner responses and repository documents as untrusted input even when authenticated.

| Threat | Preventive boundary | Detection and recovery |
|---|---|---|
| Cross-tenant or employer medical disclosure | resource/field policy and recipient projection | deny audit; revoke faulty projection; investigate affected access |
| Forged payment/callback | verified signature/status plus amount/reference checks | inbox anomalies; quarantine and reconcile |
| Duplicate issuance/refund | stable business key, serialization, unknown-outcome hold | duplicate/unknown metrics; verified partner investigation |
| SSRF/XML/upload attack | allowlisted egress, entity-free parser, quarantine | rejected destination/scan events; suspend connector |
| Staff fraud or self-approval | least privilege, MFA, maker-checker | immutable audit, independent reconciliation |
| Cache or export leak | no-store private responses, context clearing, reauthorization | two-context tests, export audit/revocation |
| Quote amplification or bulk starvation | quotas, per-provider/tenant isolation | queue/latency alerts and bounded admission |
| Price/rule tampering | immutable snapshots, server recalculation/validation | version/evidence mismatch; block commitment |

R11 maintains abuse cases per feature and validates controls before live data. Threat review is a design exercise, not a penetration test. Manual review must include recovery procedures and malicious staff/provider scenarios; automated scanner results alone cannot close these threats.
