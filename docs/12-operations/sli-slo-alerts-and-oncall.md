---
{
  "id": "DOC-12-SLI-SLO-ALERTS-AND-ONCALL",
  "title": "SLIs, SLOs, alerts and on-call",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-05",
    "COM-09",
    "INT-07",
    "INT-09"
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

# SLIs, SLOs, alerts and on-call

PERF-AVAIL defines the proposed own-service monthly objective. Denominator is eligible platform requests, including planned-maintenance failures; publish exclusions such as intentionally denied unauthorized requests separately. External dependency failures are shown in user-journey availability and their own series rather than hidden from customer impact. Latency objectives use the central registry and operation boundaries. [Operational defaults](operational-policy-defaults.json) binds alert, recovery, staffing and escalation procedures to PERF-OPS/PERF-QUEUE.

Page on data exposure, potential duplicate payout/issuance, durable-work loss, unknown external outcomes requiring time-sensitive action and sustained customer-facing failures. Alert on queue/paid-unissued/reconciliation age with owner and runbook. PERF-OPS/PERF-QUEUE supplies proposed numeric targets; versioned operational configuration requires review after baseline measurements. Partner-specific contractual response/resolution times remain external inputs, and unreviewed or missing required policy blocks production readiness.

R14 coordinates platform incidents, R09 partner failures, R12 monetary exceptions, R20 customer/claims operations and R11 security incidents. Incident records include start/detection, impact, affected capabilities, safety controls, evidence, decisions and resolution. Communication avoids claiming coverage or payment outcome before authority confirms it.

OPS-SLO-01 synthetic failures enter the denominator correctly; OPS-SLO-02 planned maintenance remains visible; OPS-SLO-03 alert reaches the named owner and exercises escalation; OPS-SLO-04 a false-positive adjustment preserves history. Error-budget exhaustion changes rollout pace, never authorizes weakening correctness/privacy checks. Human rota and contact details remain missing launch inputs.
