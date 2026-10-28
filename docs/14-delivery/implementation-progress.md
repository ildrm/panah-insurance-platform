---
{
  "id": "DOC-14-IMPLEMENTATION-PROGRESS",
  "title": "Implementation progress",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R18",
  "reviewer_roles": [
    "R13",
    "R17",
    "R19"
  ],
  "scope_ids": [
    "ALL"
  ],
  "source_refs": [
    "S00",
    "S27",
    "S28",
    "S29"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Implementation progress

The implementation is partial. All 74 parent capabilities, 230 child requirements, 24 product families and 21 roles remain in scope. 140 leaves have mapped partial component evidence; 90 have no mapped implementation evidence. No whole leaf is marked verified or release ready. Production readiness is false and independent human approval remains pending.

Next.js web, Nest API/worker, PostgreSQL domain/finance modules and three fictional carrier simulators now contain executable flows. The backend-only and frontend-only fragments retain their original evidence scope. A questionnaire or operation handler does not establish complete product underwriting, servicing or authorization acceptance.

Recorded Node 24 regression: 70 passed, 0 skipped; the clean locked install and complete workspace production build passed. The evidence registry preserves exact commands, source fingerprints, timestamps and logs. Browser scenarios and the historical native restore drill apply to their recorded checkpoints. The small corrected load smoke completed 2,000 scheduled requests with zero errors, p95 11.88 ms and p99 15.49 ms over 7 policies, 13 orders and 18 users. This does not qualify the production workload or one-million-policy capacity.

The six-service Compose file passes configuration parsing. Image build, running containers and named-volume restore have not been qualified. Real provider operations remain disabled without actual authority. Native client scope is undecided.

See [the machine-readable checkpoint](../_meta/implementation-status.json), [all leaf mappings](../_meta/implementation-traceability.csv), [executed evidence](../_meta/implementation-evidence.json), [remaining work](../_meta/implementation-continuation.md) and [production gates](../12-operations/production-readiness-report.md).

The current local recovery snapshot matched across 53 tables and 36 documents. Business integrity did not pass: 30 historical synthetic commitments lack canonical events and submissions. These pre-isolation fixture records were preserved. All three pure finance suites now use generated isolated databases. See [the current source gate](../12-operations/evidence/local-recovery-source-gate.json); historical weaker-gate passes do not override it.
