---
{
  "id": "DOC-README",
  "title": "Insurance marketplace documentation",
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

# Insurance marketplace documentation

This repository contains the full-scope documentation draft and a partial executable local/sandbox implementation. See [implementation progress](14-delivery/implementation-progress.md), [per-requirement status](_meta/implementation-status.json), [executed evidence](_meta/implementation-evidence.json), and [production readiness](12-operations/production-readiness-report.md). The complete platform is not implemented or released. Decisions are proposed and human sign-offs are pending. Full requested completion is not asserted while the [recorded validation/review gaps](_meta/continuation.md) remain.

## Start here

Read [coverage](_meta/coverage-report.md), [current status](_meta/documentation-status.json), [review findings](_meta/review-findings.md) and [handoff](14-delivery/implementation-handoff.md). The immutable [supplied brief](_meta/input/st-docs.md) is source evidence; the [source registry](_meta/source-registry.yaml) distinguishes verified technical sources from commercial assumptions.

| Area | Entry point |
|---|---|
| Authority and scope | [Charter](00-governance/project-charter.md), [assumptions](_meta/assumptions.yaml), [blockers](_meta/risks-and-blockers.yaml) |
| Product | [PRD](01-product/product-requirements.md), [24 product families](_meta/product-catalog.yaml), [channel modes](01-product/b2c-b2b-b2b2c.md) |
| Requirements | [Feature catalog](_meta/feature-catalog.yaml), [SRS](02-requirements/software-requirements-specification.md), [state machines](02-requirements/state-machines.md), [workflows](02-requirements/workflows/) |
| Experience | [Route inventory](03-experience/screen-and-route-inventory.md), [dashboards](03-experience/dashboards/), [design system](03-experience/design-system.md) |
| Architecture and data | [Overview](04-architecture/architecture-overview.md), [ADRs](04-architecture/adr/), [ERD](05-data/domain-model-and-erd.md), [ledger](05-data/ledger-and-money.md) |
| Contracts and providers | [OpenAPI](06-contracts/openapi.yaml), [AsyncAPI](06-contracts/asyncapi.yaml), [adapter contract](07-integrations/adapter-sdk-contract.md), [fictional simulators](07-integrations/simulated-carriers/) |
| Security and performance | [Threat model](08-security/threat-model-and-trust-boundaries.md), [security matrix](08-security/security-verification-matrix.md), [central budgets](_meta/performance-budgets.yaml) |
| Engineering and quality | [Standards](10-engineering/clean-code-and-typescript.md), [test strategy](11-quality/risk-based-test-strategy.md), [traceability](_meta/traceability.csv) |
| Operations and delivery | [Readiness](12-operations/release-production-readiness.md), [analytics](13-analytics/metrics-and-kpi-dictionary.md), [slices](14-delivery/dependency-map-and-vertical-slices.md), [guides](15-guides/) |

## Actual coverage and validation

The registries currently contain 74 parent capabilities, 230 child groups, 24 product families, 7 dashboards, 16 sequence workflows and 14 ADRs. API contracts contain 238 operations and 195 logical event channels. Counts are coverage evidence, not proof of semantic completeness.

Run `rtk proxy python3 -B docs/_meta/validation/validate.py` from repository root. [Validation instructions](_meta/validation/README.md) describe regeneration, optional full standards validators and limitations. The [machine report](_meta/validation-report.json) records actual checks. Documentation checks remain distinct from application tests. Current application source lives under `apps/` and `packages/`; the implementation evidence register records actual runs.

The proposed architecture is a modular NestJS backend with independently scaled API/workers and Next.js presentation surfaces. New sales, servicing, partner delivery and security quarantine are independent controls. Missing real carrier, payment, financing, official-data, legal and payout authority keeps affected live operations disabled.
