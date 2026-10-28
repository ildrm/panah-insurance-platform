---
{
  "id": "DOC-IMPLEMENTATION-REVIEW-FINDINGS",
  "title": "Implementation review findings",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Implementation review findings

The implementation is partial. All 74 parent capabilities, 230 child requirements, 24 product families and 21 roles remain in scope. 140 leaves have mapped partial component evidence; 90 have no mapped implementation evidence. No whole leaf is marked verified or release ready. Production readiness is false and independent human approval remains pending.

The role roster records responsibilities, not 21 independent human reviews. Current evidence includes local invariant tests and source review; formal whole-leaf, accessibility, regulatory and ASVS acceptance remains open.

| Finding | Current treatment | Remaining gate |
| --- | --- | --- |
| Duplicate/late payment or callback and wallet/credit funding confusion | Regression tests exercise idempotency, cancellation and distinct financial state; wallet v2 reconciles without a second submit | Complete business acceptance and actual provider contracts |
| Carrier timeout after acceptance | Durable unknown state and authoritative reconciliation; providers without status remain held | Audited evidence-based operator replay and real provider qualification |
| Confirmed policy with unavailable PDF | Confirmed issuance survives; private document retrieval retries separately | Full customer/operations recovery and production storage qualification |
| Financial or document corruption during restore | Local isolated restore compares every table/schema fingerprint, exact journal balance and PDF hashes; corruption fails | Independent failure-domain/key-loss/deletion/access recovery |
| Incomplete product/leaf coverage hidden by generic routes | Conservative 230-row rollup keeps partial/not-started states | Implement all remaining canonical behavior and acceptance cases |
| Performance smoke mistaken for capacity evidence | Corrected bounded smoke is identified with its small dataset | Representative WL-01, tail latency, noisy-neighbor, bulk/report and field Web Vitals evidence |
| Generated manifests mistaken for deployment | Compose syntax validation only | Image build, deployment, container recovery and rollback |
| Dependency/advisory confidence | Clean official locked install/build passed; 212 dependency names yielded no reported npm advisories at the recorded time | Provenance/license/security review and ongoing vulnerability response |

Historical failed commands remain in the evidence ledger. A later successful run applies only to its recorded source checkpoint. Full standards validation is qualified only by the dedicated validation reports; package-download or validator gaps must remain visible.

Component review ledger (the recorded state is preserved; whole-leaf closure is not inferred):

- `CTRL-RV-01` (corrected-locally): Nested database pool use inside rollback transactions could exhaust the20-connection process pool. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-RV-02` (corrected-locally): Generic rollback could otherwise lift a newly imposed security quarantine. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-RV-03` (corrected-locally): Rejected foundation changes would lose audit if logged in the aborted transaction. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-RV-04` (open-integration): Package lock alone cannot enforce all platform workers, servicing operations, recipient properties or true resource-derived scope. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-RV-05` (corrected-locally): An active quarantine could have been moved to a narrower scope or future start while still enabled, silently releasing existing coverage without recovery evidence. Source: `docs/_meta/fragments/controls-implementation.json`.
- `FIN-RV-01` (corrected-locally): Existing approved credit must be reclassified into installments once instead of creating a second receivable/provider liability Source: `docs/_meta/fragments/finance-implementation.json`.
- `FIN-RV-02` (corrected-locally): Installment receipt targets the owned stable planId, not an external agreement alias Source: `docs/_meta/fragments/finance-implementation.json`.
- `FIN-RV-03` (corrected-locally): Stored externally paid evidence must never be downgraded to rejected and release held funds Source: `docs/_meta/fragments/finance-implementation.json`.
- `FIN-RV-04` (safely-disabled-incomplete): Root blocks wallet refund HTTP execution with refund_approval_not_configured and removes the ordinary seed grant; internal provenance method remains tested but is not a complete dual-control refund workflow. Source: `docs/_meta/fragments/finance-implementation.json`. Next: Implement owner refund request plus independently authorized approval consumed once under the order lock before enabling execution.
- `FIN-RV-05` (corrected-locally): All three pure finance suites now use independently generated st_finance_fixture_<uuid> databases: invariant tests apply ordered platform/business SQL, ports and servicing apply ordered platform/finance SQL. Each suite closes its pool and drops only its created fixture. No search_path fallback, public mock payout rows, public order/journal writes or shared demo control injection remains in those suites. Source: `docs/_meta/fragments/finance-implementation.json`.
- `FIN-RV-06` (guard-implemented-source-unqualified): Recovery now separates exact snapshot match from scoped business consistency. Every committed order must have exactly one canonical purchase event and a matching carrier submission with tenant, owner, product, carrier and commitment kind consistent; wallet v2 requires a wallet reference without invented cash receipt fields. Historical inconsistent synthetic sources are captured but cannot receive verified=true. Source: `docs/_meta/fragments/finance-implementation.json`. Next: Record the current local drill result under the stronger gate; label historical synthetic anomalies without deleting append-only ledger history. A clean source and all other production gates remain required before release.
