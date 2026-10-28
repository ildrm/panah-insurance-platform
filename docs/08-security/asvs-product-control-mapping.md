---
{
  "id": "DOC-08-ASVS-PRODUCT-CONTROL-MAPPING",
  "title": "Product threats and verified ASVS control mapping",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02",
    "COM-02",
    "COM-03",
    "INT-05",
    "INT-07",
    "GRW-01"
  ],
  "source_refs": [
    "S00",
    "S07",
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

# Product threats and verified ASVS control mapping

The [machine-readable map](asvs-product-control-map.json) binds modeled threat groups to exact OWASP ASVS 5.0.0 requirements checked in official tagged sources on 2026-10-28. These are design mappings with proposed tests, not executed evidence or certification.

| ID / threat | Verified references | Product control / evidence |
|---|---|---|
| SEC-MAP-01: Cross-context object/property access | 8.1.1, 8.1.2, 8.2.1, 8.2.2, 8.2.3, 8.3.1, 8.3.2, 8.3.3, 8.4.1 (S11) | Current subject/context/relationship and field policy at trusted service boundary; selected L3 revocation/origin rules. Evidence: SEC-AUTH-01, SEC-AUTH-02, SEC-AUTH-03, SEC-AUTH-04; [authorization-and-tenant-isolation](../08-security/authorization-and-tenant-isolation.md). |
| SEC-MAP-02: Account takeover and OTP replay | 6.1.1, 6.3.1, 6.3.3, 6.3.4, 6.4.3, 6.5.1, 6.5.3 (S12) | Single-use challenges, aggregate anti-automation and privileged MFA; OTP-only customer L2 gap stays an explicit decision. Evidence: SEC-ABUSE-03, SEC-POL-001, SEC-POL-003, SEC-POL-016; [authentication-sessions-and-privileged-access](../08-security/authentication-sessions-and-privileged-access.md). |
| SEC-MAP-03: Session fixation and stale sessions | 7.1.1, 7.1.2, 7.2.1, 7.2.3, 7.2.4, 7.3.1, 7.3.2, 7.4.1, 7.4.2, 7.5.1 (S13) | Reference sessions rotate/revoke; proposed lifetimes, concurrency and step-up require risk review. Evidence: OPS-ACCESS-01, SEC-POL-008, SEC-POL-012, SEC-POL-015; [authentication-sessions-and-privileged-access](../08-security/authentication-sessions-and-privileged-access.md). |
| SEC-MAP-04: Cache, telemetry and employer health leakage | 14.1.1, 14.1.2, 14.2.1, 14.2.2, 14.2.3, 14.3.1, 14.3.2, 14.3.3 (S14) | Classified recipient projection, no shared private cache and client clearing on context/session changes. Evidence: SEC-PRIV-01, SEC-PRIV-02, CACHE-01, CACHE-02, CACHE-03; [privacy-data-classification-and-consent](../08-security/privacy-data-classification-and-consent.md). |
| SEC-MAP-05: SQL, script, CMS and spreadsheet injection | 1.1.1, 1.1.2, 1.2.1, 1.2.3, 1.2.4, 1.2.10, 1.3.1, 1.3.2, 1.3.7 (S15) | Parameterized SQL and allowed sort fields; context encoding, sanitized CMS, formula-safe export and no administrator eval. Evidence: SEC-API-02, BULK-04, MAP-03; [secure-development-and-api-controls](../08-security/secure-development-and-api-controls.md). |
| SEC-MAP-06: SSRF, unsafe XML and parser manipulation | 1.3.6, 1.5.1, 1.5.2, 1.5.3 (S15) | Protocol/host/path/port allowlists, connection-time destination checking, disabled XML entities, consistent parsing. Evidence: NET-01, SEC-API-03, SDK-03; [deployment-and-network](../04-architecture/deployment-and-network.md). |
| SEC-MAP-07: Invalid input, double spend and approval bypass | 2.1.1, 2.1.2, 2.1.3, 2.2.1, 2.2.2, 2.2.3, 2.3.1, 2.3.2, 2.3.3, 2.3.4, 2.3.5, 2.4.1 (S16) | Boundary schemas, contextual money/party checks, atomicity, locking, dual control and bounded fan-out. Evidence: FIN-01, FIN-02, SEC-API-01, SEC-ABUSE-01, BATCH-TX-01; [aggregate-and-transaction-boundaries](../05-data/aggregate-and-transaction-boundaries.md). |
| SEC-MAP-08: Proxy header spoofing and HTTP ambiguity | 4.1.1, 4.1.3, 4.2.1 (S17) | Strip untrusted forwarded/user headers at ingress; add identity only in verified service context; consistent HTTP framing/content types. Evidence: SEC-HTTP-01, SEC-HTTP-02, SEC-API-04; [secure-development-and-api-controls](../08-security/secure-development-and-api-controls.md). |
| SEC-MAP-09: Malicious uploads and document paths | 5.1.1, 5.2.1, 5.2.2, 5.2.3, 5.2.4, 5.2.6, 5.3.1, 5.3.2, 5.4.1, 5.4.2 (S18) | Permitted types/limits, scan quarantine, bounded processing, opaque keys and safe authorized download names; selected L3 quotas/pixel bounds. Evidence: FILE-01, FILE-02, FILE-03, FILE-04; [files-and-document-security](../05-data/files-and-document-security.md). |
| SEC-MAP-10: Weak cryptography and key reuse | 11.1.1, 11.1.2, 11.2.1, 11.2.2, 11.3.3, 11.4.1, 11.5.1 (S19) | Key purpose/version/lifecycle inventory; maintained implementations, authenticated encryption, CSPRNG and replaceable algorithms. Evidence: SEC-AUDIT-02, SECRET-01, SEC-POL-014; [secrets-encryption-and-audit](../08-security/secrets-encryption-and-audit.md). |
| SEC-MAP-11: Forged service identity and insecure transport | 12.1.3, 12.2.1, 12.2.2, 12.3.1, 12.3.2, 12.3.3, 12.3.4 (S20) | Authenticated boundaries and trusted certificate verification; TLS without fallback; mTLS conditional on actual contract. Evidence: SECRET-02, NET-01, OPS-ENV-01; [authentication-and-secrets](../07-integrations/authentication-and-secrets.md). |
| SEC-MAP-12: Secret exposure and unauthorized egress | 13.1.1, 13.2.1, 13.2.2, 13.2.4, 13.2.5, 13.3.1, 13.3.2, 13.3.4 (S21) | Secret-store references, least privilege, allowlisted destinations and reviewed rotation; partner static-key exception requires review. Evidence: SECRET-01, SECRET-02, NET-01, OPS-ACCESS-02; [secrets-encryption-and-audit](../08-security/secrets-encryption-and-audit.md). |
| SEC-MAP-13: Audit tampering, log leaks and fail-open errors | 16.1.1, 16.2.1, 16.2.2, 16.2.3, 16.2.4, 16.2.5, 16.3.1, 16.3.2, 16.3.3, 16.3.4, 16.4.1, 16.4.2, 16.4.3, 16.5.1, 16.5.2, 16.5.3 (S22) | Structured minimal audit, protected independent collection, safe errors, redaction and fail-closed critical checks. Evidence: SEC-AUDIT-01, SEC-AUDIT-03, SEC-AUDIT-04, OPS-OBS-02; [secrets-encryption-and-audit](../08-security/secrets-encryption-and-audit.md). |

SEC-HTTP-01 attempts external X-Forwarded-For/X-User-ID override and confirms no identity changes. SEC-HTTP-02 sends conflicting HTTP framing through the actual proxy/Nest adapter and confirms rejection without request confusion. FILE-01 includes active content, pixel floods and compressed-size attacks; unsupported archives are rejected rather than partially scanned. Tests assert forbidden side effects, not only status codes.

Formal standard-wide applicability/independent verification remains pending as [chapter scope](asvs-applicability-scope.md) records. OAuth/token/WebRTC additions reopen applicable controls. OTP-only customer L2 authentication and infrastructure/partner cryptography remain review gates. Source links and exact supported claims are in the [source registry](../_meta/source-registry.yaml).
