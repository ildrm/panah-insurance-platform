---
{
  "id": "EXP-MOBILE",
  "title": "Responsive web, PWA and native scope",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R04",
  "reviewer_roles": [
    "R07",
    "R11",
    "R13",
    "R21"
  ],
  "scope_ids": [
    "GRW-10",
    "AUTO-08",
    "INS-09",
    "COM-02",
    "DSH-06"
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

# Responsive web, PWA and native scope

## Scope and native decision

Responsive web and an installable PWA are proposed client capabilities. Native iOS/Android applications are an explicit separate scope/stack decision: **undecided, not delivered by this documentation or by a PWA**. R01/R21 must decide native needs after evaluating offline requirements, background work, device APIs, accessibility, distribution, security and maintenance cost. Native work remains visible in GRW-10 scope until a recorded decision; no additional stack is silently adopted.

## Responsive journeys

Public catalog, dynamic forms, comparison, checkout and all seven dashboards must work from narrow touch screens to desktop. Use a single-column form when necessary, persistent step context and a review summary before purchase. Tables become labeled cards or a deliberately scrollable comparison region, preserving essential fields and accessible relationships. Do not hide finance/coverage warnings merely to fit a screen. Touch controls have adequate target spacing; critical actions do not depend on hover or drag.

Mobile network interruption must preserve acknowledged server drafts and display which changes are unsaved. A timeout is not evidence that payment/submission failed. On return from a payment provider or deep link, reauthenticate as needed and query authoritative status rather than trusting URL parameters. Back navigation or repeat opening uses stable idempotency semantics. Sensitive screenshots/previews cannot be technically guaranteed absent on web, so minimize unnecessary display and do not claim screenshot prevention.

## PWA and offline boundary

Installability uses reviewed manifest/icons and a service worker whose cache allowlist contains only public static shell/assets. Do not cache claims, identity documents, policy PDFs, quotes, corporate pricing, wallet data or authenticated API responses offline. Offline mode shows a truthful unavailable message and safe public help; purchase, approval, payout and official inquiries require server authority. Background sync must not replay financial/issuance commands automatically. Logout/context change clears application caches that might contain private data and removes scoped notification subscriptions as required.

Push notifications are opt-in, permission-aware and separate from marketing consent. Lock-screen text contains a generic status and authenticated destination, not a diagnosis, amount, full policy number or beneficiary details. Subscription endpoints are protected personal data with revocation and retention rules. Permission denial leaves account inbox and approved alternative delivery available.

## Capture, files and device capabilities

Request camera/location permissions only at the relevant task with a purpose explanation. Location is optional unless an approved product/provider workflow requires it; manual location correction is supported where permitted. Uploads use scoped sessions, resumable chunks with integrity checks, malware review and same-resource authorization. Image orientation and compression preserve required inspection evidence; lossy transforms are not applied when contract evidence would be invalidated. The original is retained only under approved retention. Retake requests identify the missing view/quality issue without exposing unrelated documents.

Deep links bind route/context/resource and validate current authorization. Expiring document links require reauthorization rather than public bearer access where sensitivity demands. A mobile application installation does not grant access to every organization or carry old role entitlements indefinitely.

## Acceptance and release evidence

AC-EXP-MOBILE-OFFLINE: service-worker/cache inspection finds no sensitive fixtures; offline purchase/approval fails safely and reconnection does not duplicate commands. AC-EXP-MOBILE-UPLOAD: network loss/restart resumes the same permitted evidence session, preserves integrity and does not leak another tenant's upload. AC-EXP-MOBILE-PUSH: denied/revoked permission and logout prevent inappropriate delivery; notification body contains no restricted fixture data. AC-EXP-MOBILE-LINK: malicious/stale cross-context links disclose no resource metadata. AC-EXP-MOBILE-DEVICE: critical routes pass keyboard/touch/screen-reader and central PERF-WEB/PERF-JS budgets on the documented mobile profile.

R21 owns mobile/PWA behavior, R11 cache/permission review, R04 accessible interaction and R13 device evidence. Actual installability, browser compatibility and native-stack selection remain unverified until implementation and explicit review.
