---
{
  "id": "DOC-12-OBSERVABILITY-LOGS-METRICS-TRACES",
  "title": "Observability: logs, metrics and traces",
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

# Observability: logs, metrics and traces

Propagate trace/correlation context through browser, API, database transaction/outbox and worker/partner attempts without placing PII into headers or labels. A resumed asynchronous job links to the originating trace rather than pretending the original request stayed open. Record canonical operation, outcome class, environment, adapter/mapping version and bounded carrier identifier.

Required metrics: first/all quote latency, timeout/error rate, database count/time/pool wait, event-loop lag, heap/RSS, queue oldest age/lag, dispatch delay, paid-unissued count/age, unknown external outcomes and reconciliation age. Add financial discrepancy counts and denied privileged/tenant requests. Use templates, not raw URLs/customer IDs, as labels.

Logs redact secrets, full documents, health details and raw identity values. Audit evidence is separate, immutable and unsampled. Traces may be sampled with clear rate and tail-error strategy; metrics remain sufficient to detect dropped work. Diagnostic payload access requires explicit case/permission and retention.

OPS-OBS-01 traces a synthetic order from commit to carrier result; OPS-OBS-02 searches logs for forbidden fixture secrets; OPS-OBS-03 demonstrates an alert distinguishes queue lag from provider delay; OPS-OBS-04 bounds label cardinality under the full dataset. No telemetry backend or dashboard is deployed by this document.
