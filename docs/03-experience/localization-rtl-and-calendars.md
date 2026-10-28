---
{
  "id": "EXP-I18N",
  "title": "Localization, RTL and calendars",
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
    "INS-02",
    "COM-01",
    "DSH-06",
    "GRW-10",
    "INT-04"
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

# Localization, RTL and calendars

## Proposed locale defaults and authority

Persian-first RTL, English documentation/code identifiers, IRR canonical accounting where applicable, optional labeled toman display and Jalali presentation are proposals from the brief. They do not establish jurisdiction, residency, deployment region, legal rules or currency acceptance. Supported locales, calendar algorithms and timezone choices require explicit versioned configuration and tests before launch.

All human text uses message keys with parameter typing, plural rules and translator context. Never concatenate a translated noun with a numeric amount or assume English pluralization. Server errors return stable codes/field paths, while the frontend maps approved copy. Contract wording retains the insurer's authoritative language/version and labels any translation status.

## Direction and formats

Use logical CSS properties and document `dir`; do not reverse business data arrays merely because layout is RTL. Tab order follows DOM reading order. Isolate Latin identifiers, phone numbers, email, policy references and money with appropriate bidirectional markup. Tables, comparison rows, arrows and icons are reviewed for semantic direction; universal symbols and chart time axes are not blindly mirrored. Screen-reader labels spell out units and states.

Normalize Persian/Arabic digits to ASCII only for fields whose schema defines numeric interpretation. Preserve meaningful leading zeros in identifiers. Names remain NFC Unicode, without forced transliteration. Phone/plate/identity formats come from an approved jurisdiction schema; a user's location does not select legal validation rules. Currency display includes explicit currency and unit. Toman display, if enabled, is a presentation conversion with labeled exact rule; ledger and provider mapping retain original units and reject ambiguous rounding. Never store formatted localized money strings as accounting values.

## Dates and time boundaries

| Value kind | Storage and display contract |
|---|---|
| Event timestamp | UTC instant with offset-aware input; display chosen user timezone and exact time on detail. |
| Policy effective/expiry date | Local calendar date plus authoritative coverage timezone/rule; conversion must not shift coverage by treating it as UTC midnight. |
| Trip/project dates | Explicit source calendar and location/contract semantics; validate ordered interval after conversion. |
| Birth date | Date-only, access-restricted; no timezone conversion; rating age uses explicit contract reference date. |
| Quote validity | Server UTC instant from carrier evidence; countdown is advisory and server rejects expiry. |
| Enrollment change | Requested, approved and effective dates remain separate; effective interval conflicts are checked transactionally. |

Calendar conversion uses a pinned reviewed library/algorithm with round-trip fixtures, leap-year cases, Nowruz boundaries and invalid dates. Timezone data version is recorded; daylight-saving/offset transitions are tested for supported zones without assuming current local rules are permanent. A user calendar preference does not rewrite stored contractual dates or historical source values.

## Acceptance

AC-EXP-I18N-ROUNDTRIP: ISO↔selected calendar conversion preserves date-only values and rejects impossible dates. AC-EXP-I18N-MONEY: mixed Persian/Arabic digits and toman display round-trip to explicit canonical integer units without float arithmetic or unlabeled conversion. AC-EXP-I18N-BIDI: malicious/mixed directional input cannot visually impersonate a different amount/reference; controls are normalized or safely represented according to field schema. AC-EXP-I18N-BOUNDARY: quote expiry, effective dates and age calculation cross midnight/year/offset boundaries with an injected clock. R04/R02/R12 review outputs; locale/contract legal sign-offs remain pending.
