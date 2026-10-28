---
{
  "id": "DOC-08-SECURITY-VERIFICATION-MATRIX",
  "title": "Security verification matrix",
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

# Security verification matrix

Target ASVS 5.0.0 L2 for applicable controls, with selected L3 safeguards for sensitive operations. This is an intended verification scope, not certification. Full applicability review and executed evidence remain pending. [Official ASVS overview](https://asvs.owasp.org/) identifies the pinned stable version.

| Product control / test | Verified ASVS 5.0.0 references | Evidence required |
|---|---|---|
| Action/resource/field policy; SEC-AUTH-01..04 | 8.1.1,8.1.2,8.2.1,8.2.2,8.2.3,8.3.1,8.4.1 | policy registry plus direct API/worker/export negative tests |
| Immediate revocation/originating subject | 8.3.2,8.3.3 (selected L3) | multi-replica revocation and delegated-call traces |
| OTP/factor controls | 6.1.1,6.3.1,6.3.3,6.3.4,6.4.3,6.5.1,6.5.3 | replay/rate/recovery tests; OTP-only L2 gap decision |
| Session lifecycle | 7.1.1,7.1.2,7.2.1,7.2.3,7.2.4,7.3.1,7.3.2,7.4.1,7.4.2,7.5.1 | risk-reviewed lifetimes, rotation, termination and step-up evidence |
| Classification/minimization/cache | 14.1.1,14.1.2,14.2.1,14.2.2,14.2.3,14.3.1,14.3.2,14.3.3 | field inventory, private headers, client clearing, no third-party leaks |

Exact references were checked against official tagged [authorization](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x17-V8-Authorization.md), [authentication](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md), [sessions](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md) and [data-protection](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x23-V14-Data-Protection.md) chapters on 2026-10-28. Remaining applicable ASVS chapters need an item-level applicability register before production; this subset is not full coverage.

The [expanded product control map](asvs-product-control-mapping.md) adds exact verified requirements for injection, SSRF/XML, API framing, uploads, cryptography, secrets/egress, financial locking/approval, and protected logging/error handling. Its machine-readable registry distinguishes design mapping from executed verification.

WCAG 2.2 AA is the proposed accessibility target; automated checks plus keyboard, screen reader, RTL, zoom and mobile manual review are required. R11/R13 own evidence, R19 owns jurisdiction-specific obligations, and qualified independent review remains pending.
