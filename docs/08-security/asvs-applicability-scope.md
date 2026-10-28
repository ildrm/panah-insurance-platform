---
{
  "id": "DOC-08-ASVS-APPLICABILITY-SCOPE",
  "title": "ASVS 5.0.0 chapter applicability scope",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "GRW-01",
    "ORG-02",
    "INT-05",
    "COM-02"
  ],
  "source_refs": [
    "S00",
    "S07",
    "S11",
    "S12",
    "S13",
    "S14"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# ASVS 5.0.0 chapter applicability scope

The official tagged [ASVS 5.0.0 chapter inventory](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en) was inspected on 2026-10-28. This chapter-level register makes exclusions and pending work explicit; it does not replace full item-level L2 applicability and verification. No chapter is silently assumed passed.

| Chapter | Title | Status | Product-specific rationale / next evidence |
|---|---|---|---|
| V1 | Encoding and Sanitization | needs_item_level_review | Applicable to CMS, SQL, partner formats and document rendering; map parameterization/output-context controls to each tagged requirement. |
| V2 | Validation and Business Logic | needs_item_level_review | Applicable to money, workflow races, approvals, limits and all trust-boundary schemas; current property/invariant design needs item-level references. |
| V3 | Web Frontend Security | needs_item_level_review | Applicable to browser cookies/CSRF, headers, scripts, redirects and private client state; verify selected Next release behavior. |
| V4 | API and Web Service | needs_item_level_review | Applicable to REST, callbacks and SOAP adapter; GraphQL-specific requirements may be excluded only while no GraphQL interface exists. |
| V5 | File Handling | needs_item_level_review | Applicable to identity/health/inspection uploads, policy PDFs, imports and downloads; no blanket exclusion for object storage. |
| V6 | Authentication | partially_mapped | Exact references in security verification matrix; OTP-only customer path requires L2 decision and full remaining item review. |
| V7 | Session Management | partially_mapped | Reference sessions and explicit proposed lifetimes selected; remaining federated-path items depend on identity-provider decision. |
| V8 | Authorization | partially_mapped | Function/object/property/tenant and selected L3 references mapped; complete item applicability review still required. |
| V9 | Self-contained Tokens | conditional_review | Browser sessions proposed opaque, so JWT session claims not selected; partner signed tokens may activate requirements and must be assessed before use. |
| V10 | OAuth and OIDC | conditional_review | No consumer OIDC login selected; INT-05 partner OAuth/token support is scoped by actual provider contract and requires item review when enabled. |
| V11 | Cryptography | needs_item_level_review | Applicable to secret storage, signing, encryption, token generation and backup keys; infrastructure/algorithm decisions require qualified review. |
| V12 | Secure Communication | needs_item_level_review | Applicable to browser/API, database, object store and partner TLS/mTLS; approved egress does not replace TLS validation. |
| V13 | Configuration | needs_item_level_review | Applicable to build/runtime, destination/secret controls and environment separation; ordinary flags cannot disable foundations. |
| V14 | Data Protection | partially_mapped | Classification/cache/client storage references mapped; full item review requires approved retention and recipient inventory. |
| V15 | Secure Coding and Architecture | needs_item_level_review | Applicable to TypeScript/modules/dependencies/concurrency and trust boundaries; verify implementation and supply chain. |
| V16 | Security Logging and Error Handling | needs_item_level_review | Applicable to audit, diagnostic redaction, monitoring and safe failures; logging must not reveal health/financial payloads. |
| V17 | WebRTC | conditional_exclusion_proposed | No platform WebRTC media/signaling is specified; callback/live-chat integrations do not imply it. Reopen if audio/video or embedded provider WebRTC is selected. |

R11 owns item-level decomposition, R13 executes technical evidence and qualified reviewers decide justified exclusions. Conditional exclusions must be reopened by dependency/interface change. The [verified subset](security-verification-matrix.md) links exact tagged requirements; remaining controls are an explicit documentation gap, not certification.
