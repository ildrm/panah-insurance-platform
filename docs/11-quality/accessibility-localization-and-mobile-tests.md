---
{
  "id": "DOC-11-QUALITY-ACCESSIBILITY-LOCALIZATION-AND-MOBILE-TESTS",
  "title": "Accessibility localization and mobile tests",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Accessibility localization and mobile tests

Target WCAG 2.2 AA; automated checks supplement manual keyboard and screen-reader review. Test focus order, error summary association, accessible names, status announcements, contrast, zoom/reflow, modal trapping/return and non-color state labels. Compare plan tables and approval forms need full keyboard paths.

Persian RTL tests isolate Latin policy/plate/IBAN-like identifiers and amounts, preserve meaningful DOM order, use logical layout properties and avoid mirrored numeric meaning. Test digit input normalization without changing identifiers, explicit rial/toman labels and leap/effective-date boundaries. Record calendar and timezone in tests rather than trusting host locale.

Mobile tests include camera permission denied, upload retry, slow connection, background/resume, deep link while signed out and notification permission revoked. Offline shell never presents stale claim/payment/policy coverage as authoritative. PWA installability is separate from native application acceptance.
