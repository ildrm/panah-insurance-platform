---
{
  "id": "DOC--META-REVIEW-FINDINGS",
  "title": "Adversarial review findings",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
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

# Adversarial review findings

Reviews were performed by the writing agents under responsibility lenses and reconciled by the root agent. They are not independent expert or human sign-offs.

| ID / lens | Finding | Resolution / evidence |
|---|---|---|
| RV-01 R09 | Timeout-after-acceptance could be mistaken for failure | Canonical external_outcome_unknown, no blind replay, manual verified reconciliation when status/idempotency absent; ambiguous-timeout workflow and simulator cases |
| RV-02 R12 | Corporate credit could be incorrectly called paid | Distinct commitmentKind, approval/credit reservation and receivable; later receipt cannot issue twice; canonical conditional schema |
| RV-03 R11 | Employer, carrier and personal contexts could leak fields | Relationship/property projections, medical exclusion, small-cohort/complementary suppression, cache/context-switch negative tests |
| RV-04 R06 | Field budgets inherited a synthetic dataset | Separate observational workload for PERF-WEB/PERF-AVAIL; lab results cannot prove field pass |
| RV-05 R06 | Queue catch-up target lacked a backlog bound | PERF-QUEUE declares2400 jobs after60s outage at40/s and ongoing arrivals; measured recovery required |
| RV-06 R11/R08 | Cookie-session architecture differed from bearer-only API | SessionCookie plus scoped BearerAuth alternatives; conditional CSRF/trusted Origin and signature-only callbacks |
| RV-07 R12 | Payment schema allowed verified without evidence | VerifyPaymentResult oneOf requires receipt/time/money for verified, excludes them otherwise |
| RV-08 R03/R20 | Reservation exception was absent from canonical states | Proposed A05 reflected in state table, feature-disable workflow and configuration architecture |
| RV-09 R17 | Amount/unit, context labels and resource version types drifted | Reconciled engineering docs with canonical amount/rial, organization context and bounded version representation |
| RV-10 R11 | OTP-only flow conflicts with intended ASVS5 L2 target | BLK-11 remains open; privileged MFA and proposed sensitive-action step-up do not fabricate L2 compliance |
| RV-11 R13/R17 | Structural checks can be mistaken for semantic/application evidence | Reports explicitly distinguish written specs, checks, unexecuted application suites and unavailable standards validators |
| RV-12 R02/R20 | Product templates could invent coverage/rates or delegated authority | Every family marks actual insurer rules/authority external; distinctive risk, underwriting, servicing and synthetic tests retained |
| RV-13 R11/R03 | Commercial flags could disable foundations or servicing | Mandatory noncommercial foundations; admission flags bypassed for verification callbacks, committed delivery, reconciliation and contracted servicing |
| RV-14 R04/R17 | Generic workspace routes were absent from the screen inventory | All74 features now map to206 actual surface references, with100 dashboard routes plus21 journey routes, role and owning specification |
| RV-15 R08/R13 | Generic command status omitted redirect and upload results |189 typed completion variants; succeeded commands alone expose authorized completion, other states forbid success payloads |
| RV-16 R09/R13 | Simulator transport detail was underspecified | Concrete JSON/XML/XSD, deterministic SOAP visibility, signed byte vectors and tested calendar/money pairs |

Outstanding exact decisions and evidence are in [continuation](continuation.md) and [blockers](risks-and-blockers.yaml). All human reviewer assignments/sign-offs remain pending. Application correctness, real provider behavior and measured performance cannot be concluded from this review.
