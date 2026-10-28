---
{
  "id": "DOC-09-PROFILING-AND-REGRESSION-GATES",
  "title": "Profiling and regression gates",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R06",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INS-05",
    "COM-03",
    "INT-07",
    "ORG-04"
  ],
  "source_refs": [
    "S00",
    "S06"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Profiling and regression gates

CI runs contract/invariant tests and reproducible bundle/selected synthetic performance checks once application code exists. A release candidate runs the full load/outage/recovery suite in the declared environment. Pin the dataset/seed and compare identical scenarios; changing hardware, dependency latency or response size requires a new baseline rather than an unexplained speed claim.

Investigate regressions with browser traces, CPU profiles, allocation/heap profiles, SQL plans and queue metrics in that order according to observed bottleneck. An optimization proposal records changed cost, correctness/security risk, expected benefit and before/after evidence. Keep diagnostic sampling disabled for raw sensitive payloads.

Gate failures include central target breach, statistically unexplained tail increase, dropped arrivals, missing samples, increased duplicate effects, cache leaks or invalid financial states. Human waivers need owner, reason, expiry and bounded rollout; critical correctness/privacy failures cannot be waived as performance tradeoffs.

PROFILE-01 links every measured chart to raw run metadata and commit; PROFILE-02 reproduces a result on a clean environment; PROFILE-03 invalidates a baseline when operation mix changes; PROFILE-04 confirms the optimized route retains auth/validation/audit. No arbitrary function-length or universal line-coverage target substitutes for profiling or risk-based tests.
