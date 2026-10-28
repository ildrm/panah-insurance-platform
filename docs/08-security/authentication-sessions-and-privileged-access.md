---
{
  "id": "DOC-08-AUTHENTICATION-SESSIONS-AND-PRIVILEGED-ACCESS",
  "title": "Authentication, sessions and privileged access",
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

# Authentication, sessions and privileged access

Mobile OTP is a requested account-entry pathway, not proof of strong identity or policy ownership. Codes are random, single-use, hashed at rest and bound to a challenge/purpose; verification attempts and resends are limited independently by account/device/network risk. Responses avoid account enumeration and deliberate attacker-driven permanent lockout. Identity/ownership verification is a separate permitted service.

Propose server-side reference sessions with secure, HttpOnly, SameSite cookies and CSRF protection for cookie-authenticated mutations. Rotate session identity on authentication and recovery; revoke sessions on disablement, factor changes or administrator action. Users can view and terminate their own sessions. [Security policy defaults](security-policy-defaults.json) selects concrete OTP/session/rate/concurrency bounds as reversible proposals requiring R11/R13 review; startup validates their types and cross-field constraints. These are design defaults, not approved production security evidence.

Privileged staff and finance/connector reviewers require MFA and step-up for sensitive mutations. Recovery cannot bypass enrolled factors; support may initiate a recovery process but cannot choose the user's secret. Record break-glass reason, limited scope and independent review.

ASVS 5.0.0 6.3.3 creates an unresolved gap for OTP-only customer access when targeting L2. R11/R01 must decide stronger customer authentication or document a reviewed exception with mitigations; do not claim full L2 verification meanwhile. Tests cover code replay, recovery bypass, session fixation, logout/revocation across replicas and role change during open sessions. Authentication configuration remains a launch gate.
