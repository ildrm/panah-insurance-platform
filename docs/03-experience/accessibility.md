---
{
  "id": "EXP-A11Y",
  "title": "Accessibility",
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
    "DSH-06",
    "GRW-10",
    "INS-02",
    "INS-06",
    "COM-01"
  ],
  "source_refs": [
    "S00",
    "S08"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Accessibility

## Target and evidence policy

The proposed target is WCAG 2.2 Level AA for public and authenticated journeys. This is a verification target, not a conformance claim. Use the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (S08), automated checks and manual assistive-technology review. Third-party redirects, uploads, PDFs and embedded support widgets are included in journey risk assessment; inaccessible dependencies require a documented alternative and release decision, not hidden exclusion.

## Verification matrix

| Area | Relevant WCAG 2.2 criteria | Planned evidence |
|---|---|---|
| Structure and labels | 1.3.1, 1.3.2, 2.4.6, 3.3.2 | Semantic landmarks/headings, form labels, table associations; screen-reader walkthrough. |
| Contrast and resize | 1.4.3, 1.4.4, 1.4.10, 1.4.11 | Token contrast, text zoom, reflow and controls at narrow widths. |
| Keyboard and focus | 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11 | Complete quote/purchase/claim flow without pointer; visible unobscured focus, no traps. |
| Pointer/alternatives | 2.5.1, 2.5.7, 2.5.8 | No drag-only action; target sizing and alternatives for complex gestures. |
| Errors and consequential actions | 3.3.1, 3.3.3, 3.3.4 | Linked errors, correction, review before financial/legal-data submission; actual domain revalidation. |
| Authentication | 3.3.8 | OTP paste/autofill, password-manager support for approved alternatives, accessible recovery. |
| Programmatic states | 4.1.2, 4.1.3 | Accessible control names/states; restrained live status announcements. |

## Critical interaction rules

Every dynamic form step has a clear heading and announcement; conditionally revealed fields enter logical reading order. Errors preserve safe data and focus the summary, with links to specific fields. Comparison conveys row/column relationships and exclusions without color or hover-only content. Expiration warnings are accessible; server expiry remains authoritative and cannot be bypassed by UI extension. Authentication challenges allow accessible alternatives consistent with the threat model; do not create cognitive puzzles as the sole route.

Uploads expose file selection, progress, scan/review status, cancel/retry and retake explanation to assistive technology. A camera-only workflow needs an equivalent supported upload/assisted path when carrier rules allow; any mandated capture limitation is explicit. PDF policy documents require accessible delivery planning and a readable structured summary without rewriting insurer terms. Support escalation is available when a third-party artifact cannot be used.

Dialogs set meaningful initial focus, keep focus contained while active and restore it to a valid trigger. Toasts do not steal focus; persistent action-required messages remain discoverable. Context switch clears sensitive state and announces the new context. Tables support keyboard sorting/pagination; virtualized rows require verified screen-reader semantics or a paginated alternative. Reduced-motion preference is honored as a product requirement.

## Test plan and ownership

AC-EXP-A11Y-AUTO: automated checks run on every critical state in RTL/LTR, including contrast and form semantics. AC-EXP-A11Y-MANUAL: keyboard plus a supported desktop and mobile screen reader completes direct purchase, corporate approval, dependent change, claim intake and admin flag approval. AC-EXP-A11Y-RECOVERY: errors, expired sessions, provider partial results and upload failures remain understandable without vision or pointer. AC-EXP-A11Y-REFLOW: zoom/reflow preserves amount, state and next action without clipped labels.

R04 defines experience, R07 implements semantics, R13 records browser/OS/assistive-technology versions and defects, R20 verifies assisted alternatives. High-impact blockers prevent the relevant release slice until corrected or an explicitly reviewed equivalent path exists. Automated pass counts alone do not establish conformance; manual evidence and unresolved issues remain in the release record.
