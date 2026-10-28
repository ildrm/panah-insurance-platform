# Delivery roles and responsibilities

Version: 1.0 · 2026-10-28

These are 21 responsibility areas, not an estimate of headcount. They are distinct from customer/administrator authorization roles inside the product. Real legal, insurer, financial and production sign-offs require authorized people.

### R01 — Product lead / product owner

Own product outcomes, personas, B2C/B2B/B2B2C scope, roadmap, priorities, commercial assumptions, success metrics and acceptance decisions. Resolve scope conflicts without deleting requirements.

**Owned outputs:** Vision, PRD, roadmap, product acceptance and scope-change proposals.

### R02 — Insurance domain and underwriting specialist

Define product structures, coverages, exclusions, eligibility, rating inputs, quote validity, underwriting, inspections, issuance, endorsements, renewals and claims. Distinguish advisory services from insurer-authorized actions.

**Owned outputs:** Product templates, insurance glossary, policy and claim state machines, insurer-rule validation.

### R03 — Business / systems analyst

Decompose every capability into atomic requirements, business rules, personas, workflows, field dictionaries, states, failure cases and traceability. Separate buyer, payer, policyholder, insured, beneficiary, distributor and carrier.

**Owned outputs:** SRS, requirements registry, business rules, acceptance criteria and traceability matrix.

### R04 — UX/UI, accessibility and localization designer

Design all storefronts and dashboards, information architecture, responsive interaction, RTL/LTR layouts, accessible forms and tables, error recovery and design tokens. Minimize perceived latency without concealing real status.

**Owned outputs:** Screen inventory, navigation maps, design system, UI states, accessibility and localization specifications.

### R05 — Staff software / solution architect

Own bounded contexts, deployment boundaries, tenancy, data ownership, API/event contracts, architecture decisions and dependency rules. Prefer the simplest architecture meeting measured requirements.

**Owned outputs:** C4 and sequence diagrams, ADRs, module contracts and architecture conformance.

### R06 — Performance and capacity engineer

Own workload assumptions, performance budgets, profiling, query and frontend analysis, concurrency limits, load/soak tests, capacity models and cost-per-transaction. Review all critical journeys.

**Owned outputs:** NFR budgets, test workloads, benchmark evidence, regression gates and bottleneck backlog.

### R07 — Next.js frontend engineer

Implement accessible localized storefronts and dashboards, rendering boundaries, authenticated data access, explicit caching, typed API clients, progressive quote results, form behavior and frontend tests.

**Owned outputs:** Next.js applications, shared UI packages, route tests, bundle and Web Vitals instrumentation.

### R08 — NestJS backend / domain engineer

Implement application use cases, modules, validation, authorization, business invariants, transactions, APIs, outbox events, workers, feature controls and post-sale servicing.

**Owned outputs:** NestJS services and workers, domain tests, transactional behavior and published API contracts.

### R09 — Partner integration and workflow engineer

Build carrier-specific adapters, canonical mapping, authentication, schemas, asynchronous workflows, idempotency, polling/callbacks, failure classification and reconciliation.

**Owned outputs:** Adapter SDK, contract simulators, integration studio, conformance tests and partner onboarding runbooks.

### R10 — Database / data platform engineer

Own relational models, indexes, query plans, tenant boundaries, migrations, transactional consistency, connection budgets, backups, retention and export/import design.

**Owned outputs:** ERDs, data dictionary, migrations, indexing plans, restore tests and data lifecycle rules.

### R11 — Application security and privacy engineer

Model threats; implement object/property authorization, privileged access, secret handling, encryption, auditability, secure integrations and privacy minimization. Review cache isolation and multi-tenant exposure.

**Owned outputs:** Threat model, security controls, privacy matrix, negative tests and security release evidence.

### R12 — Payments, accounting and settlement specialist

Define payment verification, allocations, installment schedules, precise monetary units, refunds, wallets, ledger invariants, commissions, insurer settlement and reconciliation.

**Owned outputs:** Financial model, payment/ledger specifications, accounting tests and settlement runbooks.

### R13 — Quality engineering / test automation engineer

Own risk-based testing, executable acceptance criteria, unit/integration/contract/E2E suites, accessibility checks, mode/tenant matrices, test data, fault injection and evidence quality.

**Owned outputs:** Test strategy, fixtures, automated suites, regression results and quality gates.

### R14 — Platform / DevOps / SRE engineer

Own reproducible environments, CI/CD, infrastructure, deployment, autoscaling, telemetry, alerts, queue durability, operational SLOs, recovery and rollback.

**Owned outputs:** Local environment, pipeline definitions, deployment architecture, dashboards, runbooks and recovery evidence.

### R15 — Analytics / BI engineer

Define consent-aware event taxonomy, conversion metrics, product reporting, seller/carrier/corporate analytics, freshness and access-controlled exports without burdening transactional workloads.

**Owned outputs:** Tracking plan, metric dictionary, analytical models and report specifications.

### R16 — Content, SEO and growth specialist

Define original product content, insurer profiles, CMS approvals, public indexing, metadata, campaigns, loyalty/referral attribution and compliant communications.

**Owned outputs:** CMS/SEO requirements, content taxonomy, lifecycle messaging and campaign rules.

### R17 — Technical writer / documentation engineer

Maintain the docs information architecture, templates, source registry, glossary, cross-links, machine-readable manifests, examples, guides and documentation validation.

**Owned outputs:** Complete docs tree, docs-as-code checks, coverage reports and operator/developer guides.

### R18 — Engineering delivery / release lead

Sequence dependency-aware vertical slices, coordinate role reviews, track blockers, manage changes and readiness gates, and ensure claimed completion is supported by evidence.

**Owned outputs:** Implementation plan, work ledger, release checklist, checkpoint and readiness reports.

### R19 — Insurance regulatory / legal compliance reviewer

Identify jurisdiction-specific licensing, distribution, privacy, financing, marketing, records and contractual obligations for qualified human validation. Never invent legal approval or insurer authority.

**Owned outputs:** Compliance questions, evidence register, launch restrictions and sign-off requirements.

### R20 — Insurance operations, claims and partner-support specialist

Define manual underwriting and issuance queues, customer/partner service, claims coordination, escalation, exception ownership, provider onboarding, fulfillment and staff tools.

**Owned outputs:** Operating procedures, queue SLAs, operational dashboards, support taxonomy and UAT scenarios.

### R21 — Mobile / PWA client engineer

Define installable web experiences, mobile forms and uploads, permissions, deep links, notifications and offline limitations; evaluate separately whether native applications are required.

**Owned outputs:** PWA/mobile specification and tests; explicit native-app scope and additional-stack decision when needed.

## Review ownership and separation of duties

| Work package | Accountable lead | Essential reviews | Evidence |
|---|---|---|---|
| Product scope and capability inventory | R01 | R02, R03, R20 | Traceable baseline and explicit changes |
| Insurance products and operational workflows | R02 | R03, R12, R19, R20 | Product/rule source and approval status |
| Architecture and tenancy | R05 | R06, R08, R09, R10, R11, R14 | ADRs and isolation tests |
| Performance budgets | R06 | R05, R07, R08, R10, R14 | Reproducible benchmarks and regressions |
| Storefronts and dashboards | R07 | R04, R11, R13, R21 | Screen acceptance, accessibility, authorization and route tests |
| Payments and ledgers | R12 | R08, R10, R11, R13 | Transaction/property/concurrency/reconciliation tests |
| Insurer integration | R09 | R02, R11, R12, R13, R20 | Contract tests, timeout/replay tests, partner certification status |
| Security/privacy | R11 | R05, R13, R19 | Threat model and control verification |
| Documentation completeness | R17 | R03, R05, R13 | Machine-checked links and coverage |
| Production operations | R14 | R06, R11, R13, R20 | Deploy/rollback/restore and alert evidence |
| Full-platform release | R18 | R01, R06, R11, R12, R13, R14, R19 | Evidence-backed release assessment |

AI role-based reviews are review passes, not independent human approvals. Require actual separation of duties for production payouts, integration credential changes and release authorization.
