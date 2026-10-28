---
{
  "id": "GUIDE-DEVELOPER",
  "title": "Developer onboarding guide",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
  "reviewer_roles": [
    "R04",
    "R11",
    "R13",
    "R20"
  ],
  "scope_ids": [
    "INT-01",
    "INT-07",
    "DSH-06",
    "CHN-05"
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

# Developer onboarding guide

## Start from inspected reality

At documentation discovery the repository contained only `README.md` and Git metadata; no application package manifest, lockfile, source, credentials or deployment was present. This task adds documentation, specifications, fixtures and validation tooling under `docs/`. Do not treat planned module paths, API operations or acceptance IDs as implemented software or passing tests.

Read repository/user instructions and the [documentation index](../README.md), then the [architecture overview](../04-architecture/architecture-overview.md), [SRS](../02-requirements/software-requirements-specification.md), [state machines](../02-requirements/state-machines.md), [contracts](../06-contracts/api-conventions.md) and [performance registry](../_meta/performance-budgets.yaml). Check status, assumptions and blockers before selecting a vertical slice. Generated decisions are proposed/draft unless real approval evidence says otherwise.

## Work a vertical slice

1. Select requirement/acceptance IDs and product/channel/dashboard scope from traceability. Include denied roles, disabled new sales and preserved servicing.
2. Resolve schema/operation/event ownership and planned modules. NestJS owns domain services/workers; Next.js owns presentation and calls authorized contracts, not database tables.
3. Pin supported exact dependencies with official-source/security/compatibility evidence and a lockfile during the authorized implementation task. Do not infer a package version from this guide.
4. Implement trust-boundary validation, explicit party relationships, resource/field authorization, optimistic versions and idempotency before wiring UI actions.
5. Test durable commit/outbox, duplicate callback, unknown external outcome, financial invariants and recovery. Use fictional carrier/payment fixtures; never add real credentials or live purchases to a documentation test.
6. Measure the actual application journey against central budgets, separating provider latency, lab/synthetic/field evidence and cold/warm states. Health-endpoint throughput is not a purchase benchmark.

## Documentation workflow

Product/experience source data is in `docs/_meta/validation/build_experience.py`; its outputs are deterministic Markdown, fixtures and fragments. In this workspace shell commands follow the RTK instruction. Regenerate owned outputs with `rtk proxy python3 docs/_meta/validation/build_experience.py`, then run the repository's documentation validator documented in the metadata validation directory. Do not rerun generators over another author's manual changes without reconciling the source first.

Every normative document needs metadata, stable IDs, source/assumption references and review status. A specification change updates affected contracts, tests, flags, permissions, traceability and acceptance evidence. Structural validation does not prove semantic completeness. Preserve unknown external dependencies with owner, missing input, safe default and launch consequence rather than inventing a rate, rule, license or certification.

## Critical review checklist

Check two users/two tenants, multi-organization identity, employee health privacy, carrier recipient scope and role revocation across replicas/client caches. Verify new-sales flags cannot bypass authorization or disable committed servicing. Ensure payment success is independent from issuance, B2B credit commitment from cash receipt, and an ambiguous external outcome from definitive failure. Money is exact and unit-labeled; financial history is append-only. Bulk/import/report work is bounded and off request paths.

Application implementation, package installation, production integration and deployment require their own authorized scope. The product fixtures are synthetic design inputs and the guides describe intended behavior. Release readiness requires real approvals and executed evidence, not file count or a generated coverage claim.
