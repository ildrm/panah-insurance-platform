---
{
  "id": "EXP-DESIGN",
  "title": "Design system",
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
    "GRW-10"
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

# Design system

## Original visual language and tokens

Use an original calm, readable interface with strong typographic hierarchy and explicit state labels. Competitor assets, text, branding and private APIs are not design inputs to copy. [design-tokens.json](design-tokens.json) is the proposed semantic token source: colors, logical spacing, radius, type scale and focus styles. Components reference semantic names rather than embedding unexplained hex/spacing values. Persian-first RTL and Latin LTR are both supported; font selection and licensing remain an implementation dependency, with locally deployable font assets and fallbacks.

Semantic colors distinguish text/surface/border/action/focus/success/warning/danger. Status always includes text and an icon; color alone carries no insurance or financial meaning. Typography supports Persian shaping and mixed-script identifiers without forced letter spacing. Body text is readable under browser text scaling; controls inherit the document language and do not crop at 200% text zoom.

## Component contracts

| Component | Required states and behavior |
|---|---|
| Money | Explicit amount, currency and unit; label toman conversion; do not sum points/promotional balances with cash; bidirectional isolation. |
| Status timeline | Independent state families, verified timestamps and source; pending/unknown are distinct from failed; accessible ordered list. |
| Field | Persistent label, help, required/conditional cue, error association, safe value preservation; server error code translated into correction. |
| Step form | Current/remaining sections, save/resume status, back without data loss, version/conflict handling; no automatic sensitive browser storage. |
| Quote card/comparison | Price breakdown, equivalent benefit rows, unknown/incomparable explanation, sponsored label, validUntil and eligibility assumptions. |
| Table | Scope-aware counts, stable cursor pagination, accessible headers/sort state, mobile labeled details; no hidden columns that change authorization. |
| Upload | File purpose/allowed type/size, progress, clean-scan status, retry/cancel and requested retake; preview cannot bypass document authorization. |
| Dialog | Accessible name, initial focus, contained keyboard focus, Escape where safe, focus return; confirmation names resource/amount/impact. |
| Toast/notice | Nonblocking success only for acknowledged operation; persistent actionable errors; live region avoids duplicate announcements. |
| Context switcher | Visible role/context, authorized choices, in-flight cancellation and protected cache clearing; no silent switch. |

Design target is WCAG 2.2 AA with manual verification, not a certification. Text contrast follows 1.4.3, nontext affordances 1.4.11, visible focus 2.4.7/2.4.11, and pointer targets 2.5.8. Prefer 44 CSS-pixel touch targets as a product usability choice; applicable WCAG exceptions do not replace testing. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the primary reference S08.

## Responsive behavior and motion

Use content-driven breakpoints; forms collapse to one column before labels/values become cramped. Comparison preserves row labels and allows horizontal scrolling with a visible affordance; essential purchase information remains available without precision dragging. Navigation drawer closes on successful route navigation and restores focus when dismissed. Respect reduced-motion preferences and avoid animated counters for financial/coverage state. Skeletons preserve layout and never represent a confirmed amount or policy.

## Validation and governance

AC-EXP-DESIGN-TOKENS: generated token artifacts agree with source and all used combinations pass required contrast checks. AC-EXP-DESIGN-STATES: component stories cover loading/empty/error/forbidden/read-only/disabled/partial/expired/success in RTL/LTR. AC-EXP-DESIGN-INPUT: keyboard, screen reader, 200% text scaling, 400% reflow, reduced motion and touch are manually reviewed on critical journeys. R04 owns token/component decisions; R07 implements, R11 reviews sensitive display and R13 records evidence. No component implementation or visual approval is claimed here.
