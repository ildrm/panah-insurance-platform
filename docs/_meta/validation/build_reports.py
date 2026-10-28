#!/usr/bin/env python3
"""Refresh human-readable handoff from actual registries and validation evidence."""
from build_root import ROOT, doc, write_json, DATE
import json
def load(p,fallback=None):
    path=ROOT/p
    return json.loads(path.read_text()) if path.exists() else fallback
features=load('_meta/feature-catalog.yaml',{'entries':[]})['entries']
products=load('_meta/product-catalog.yaml',{'entries':[]})['entries']
dashboards=load('_meta/dashboard-catalog.yaml',{'entries':[]})['entries']
api=load('06-contracts/openapi.yaml',{'paths':{}})
events=load('06-contracts/asyncapi.yaml',{'channels':{}})
report=load('_meta/validation-report.json',{'id':'REPORT-VALIDATION','version':'1.0.0','status':'partial','updated':DATE,'result':'not-run','checks':{},'errors':[],'limitations':['Final structural check not yet run'],'semantic_completeness_proven':False,'application_tests_run':False})
if not (ROOT/'_meta/validation-report.json').exists():write_json('_meta/validation-report.json',report)
wire_report=load('07-integrations/simulated-carriers/wire/validation-report.json',{})
drift_report=load('_meta/generation-drift-report.json',{})
counts={'parent_features':len(features),'child_requirements':sum(len(p['children']) for p in features),'product_families':len(products),'dashboards':len(dashboards),'dashboard_routes':sum(len(d['routes']) for d in dashboards),'workflows':len(list((ROOT/'02-requirements/workflows').glob('*.md'))),'adrs':len(list((ROOT/'04-architecture/adr').glob('*.md'))),'api_operations':sum(sum(m in ['get','post','put','patch','delete','head','options'] for m in methods) for methods in api['paths'].values()),'event_channels':len(events['channels']),'feature_acceptance_scenarios':sum(len(c.get('acceptance_scenario_ids',[])) for p in features for c in p['children']),'product_acceptance_scenarios':sum(len(p.get('acceptance_ids',[])) for p in products)}
open_gaps=[
dict(id='GAP-VALIDATORS',owner_role='R17',path='_meta/validation/README.md',missing='Run full third-party JSON Schema2020-12, OpenAPI3.1 and AsyncAPI3 standards validators in an environment with package access; local structural checks are not full standards certification.',safe_default='Do not claim standards validation passed',next_action='Install verified validator versions into an isolated environment; run validate.py and validate_asyncapi.mjs, resolve diagnostics and record output'),
dict(id='GAP-ASVS-REVIEW',owner_role='R11',path='08-security/security-verification-matrix.md',missing='Qualified applicability/verification review of the intended ASVS5 L2 scope, including the recorded OTP-only authentication decision; product-threat mappings do not establish formal complete L2 conformance.',safe_default='No compliance or security certification claim',next_action='Review threat-to-control map and each remaining applicable ASVS requirement; resolve authentication target and record actual evidence'),
dict(id='GAP-STACK-EVIDENCE',owner_role='R05',path='10-engineering/supported-stack-and-version-policy.md',missing='Local application dependencies are pinned and selected compatibility tests now run. Full runtime matrix, representative performance qualification and production certification remain open; consult implementation evidence.',safe_default='Architecture and adapter selection remain proposed',next_action='During authorized implementation bootstrap pin supported releases and execute middleware/auth/serialization/database/adapter comparison and package audit')]
standards=load('_meta/contract-standards-report.json',{})
if standards.get('valid') and report.get('checks',{}).get('jsonschema_ajv_standard'):
    open_gaps=[gap for gap in open_gaps if gap['id']!='GAP-VALIDATORS']
feature_fragment=load('_meta/fragments/features.json',{})
if isinstance(feature_fragment,dict):
    for gap in feature_fragment.get('gaps',[]):
        if 'refinement' in gap or 'missing' in gap.lower():open_gaps.append(dict(id='GAP-FEATURE-CONTRACT',owner_role='R08',path='06-contracts/feature-types.json',missing=gap,safe_default='Affected contracts remain draft pending refinement',next_action='Complete named operation projections and property-authority tests'))
status=dict(id='STATUS-DOCUMENTATION',version='1.0.0',status='partial',updated=DATE,documentation_complete=False,completion_class='full-scope-draft-with-open-validation-and-review',counts=counts,structural_validation=report['result'],application_implemented="partial-local-sandbox" if (ROOT.parent/"apps/api/src/main.ts").exists() else False,application_tests_run=bool(load("_meta/implementation-evidence.json",{}).get("entries")),deployed=False,human_approval='pending',external_blockers=[b['id'] for b in load('_meta/risks-and-blockers.yaml',{'entries':[]})['entries']],open_gaps=open_gaps,source_brief_sha256='277e4bdd358ed0799e747bed01a2002e0b1432657c4053c01fb8f17812f16978')
status['documentation_scope_written']=counts['parent_features']==74 and counts['product_families']==24 and counts['dashboards']==7
status['validation_evidence']={'structure':'_meta/validation-report.json','wire_artifacts':'07-integrations/simulated-carriers/wire/validation-report.json','generation_drift':'_meta/generation-drift-report.json','wire_result':wire_report.get('status','not-run'),'drift_result':drift_report.get('result','not-run')}
write_json('_meta/documentation-status.json',status)

doc('README.md','Insurance marketplace documentation',f'''This repository contains the full-scope documentation draft and a partial executable local/sandbox implementation. See [implementation progress](14-delivery/implementation-progress.md), [per-requirement status](_meta/implementation-status.json), [executed evidence](_meta/implementation-evidence.json), and [production readiness](12-operations/production-readiness-report.md). The complete platform is not implemented or released. Decisions are proposed and human sign-offs are pending. Full requested completion is not asserted while the [recorded validation/review gaps](_meta/continuation.md) remain.

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

The registries currently contain {counts['parent_features']} parent capabilities, {counts['child_requirements']} child groups, {counts['product_families']} product families, {counts['dashboards']} dashboards, {counts['workflows']} sequence workflows and {counts['adrs']} ADRs. API contracts contain {counts['api_operations']} operations and {counts['event_channels']} logical event channels. Counts are coverage evidence, not proof of semantic completeness.

Run `rtk proxy python3 -B docs/_meta/validation/validate.py` from repository root. [Validation instructions](_meta/validation/README.md) describe regeneration, optional full standards validators and limitations. The [machine report](_meta/validation-report.json) records actual checks. Documentation checks remain distinct from application tests. Current application source lives under `apps/` and `packages/`; the implementation evidence register records actual runs.

The proposed architecture is a modular NestJS backend with independently scaled API/workers and Next.js presentation surfaces. New sales, servicing, partner delivery and security quarantine are independent controls. Missing real carrier, payment, financing, official-data, legal and payout authority keeps affected live operations disabled.''','R17')

doc('_meta/coverage-report.md','Documentation coverage report',f'''Counts are calculated from authored registries, not inferred from file names.

| Coverage | Count |
|---|---:|
'''+''.join(f'| {k.replace("_"," ")} | {v} |\n' for k,v in counts.items())+f'''
The preserved baseline contains exactly 74 parent capability IDs and 24 product IDs. Each child has its own rule, operation, fields and acceptance scenarios in the parent specification; shared sections link normative common behavior. The 24-section feature template, seven dashboards and all mandatory topic paths are checked by the validator.

Structural validation result: `{report['result']}`. See [raw evidence](validation-report.json) for check counts and limitations. Application tests, actual provider certification, measured performance and human acceptance were not run by this documentation task.

The [wire-artifact check](../07-integrations/simulated-carriers/wire/validation-report.json) records `{wire_report.get('status','not-run')}` for JSON fixtures, SOAP XSD, negative cases, independent HMAC verification, runtime calendar conversion and PDF integrity. The [isolated regeneration check](generation-drift-report.json) records `{drift_report.get('result','not-run')}`. These validate documentation artifacts; they do not run carrier simulator services.

Semantic review challenged independent modes/servicing, payment-versus-credit commitment, unknown insurer outcomes, double financial effects, cross-tenant/employee privacy, typed contracts and measurable performance boundaries. [Findings](review-findings.md) record corrections and remaining decisions. Documentation remains a draft with exact outstanding items in [continuation](continuation.md); a successful parser cannot close those items.''','R17')

doc('_meta/consistency-report.md','Cross-document consistency report','''The central vocabulary separates identity, tenant, channel, carrier and commercial relationships. The canonical state machine owns purchase/payment/submission/underwriting/issuance/policy/delivery/refund/claim states; feature-local workflow stage labels are not alternative persisted state enums. Money uses `amount` integer string plus explicit currency/unit; no ledger floating point or mutable historical journal.

Purchase commitment references immutable risk/form/price/consent/mapping versions. Direct verified-payment and approved-credit/invoice paths emit the same commitment family with distinct commitmentKind. Payment schema conditions require a receipt/time/money when verified and exclude these from unresolved/nonverified results. Group insured schedules use immutable references so a bounded snapshot need not inline the census.

Commercial feature disable is serialized with new commitment checks. Proposed A05 explicitly governs a still-valid pre-disable payment reservation; no reservation means verified money enters exception/refund review. Workers preserve committed servicing and separately check security quarantine. Insurer transport never depends implicitly on the B2B-buyer switch.

All hard performance/recovery targets live in the central registry. Field Web Vitals/monthly availability use observational workload definitions, not the synthetic environment. Queue recovery includes an explicit2400-job backlog and ongoing arrival rate. Browser sessions and scoped API clients are distinct OpenAPI security alternatives; cookie mutations require CSRF and trusted Origin.

No contradictory accepted decisions were found in the initial README-only repository. All generated proposals remain unapproved. Third-party schema/parser validation and qualified security/stack reviews are recorded separately from the local link/reference/coverage checks.''','R17')

doc('_meta/review-findings.md','Adversarial review findings','''Reviews were performed by the writing agents under responsibility lenses and reconciled by the root agent. They are not independent expert or human sign-offs.

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

Outstanding exact decisions and evidence are in [continuation](continuation.md) and [blockers](risks-and-blockers.yaml). All human reviewer assignments/sign-offs remain pending. Application correctness, real provider behavior and measured performance cannot be concluded from this review.''','R17')

gaptext='\n'.join(f"{i}. `{g['id']}` — owner {g['owner_role']}; [{g['path']}]({g['path'].removeprefix('_meta/') if g['path'].startswith('_meta/') else '../'+g['path']}). {g['missing']} Next: {g['next_action']}." for i,g in enumerate(open_gaps,1))
doc('_meta/continuation.md','Exact continuation and handoff',f'''## Current checkpoint

The earlier documentation phase was under `docs/`. The subsequent authorized implementation phase adds application code, tests and infrastructure; consult [implementation continuation](implementation-continuation.md). Registry counts: {json.dumps(counts,sort_keys=True)}. Current structural result is `{report['result']}`; inspect [validation-report.json](validation-report.json) before making any claim. Documentation is a full-scope draft with open validation/review, not human-approved implementation readiness. No production deployment or live financial/insurance/message operation was performed. Synthetic local code and fixtures are tracked separately.

## Exact next work

{gaptext}

## External launch blockers

See [risks-and-blockers.yaml](risks-and-blockers.yaml) for each precise owner, missing input, affected capabilities, safe default and launch consequence. Required inputs include actual insurer/rate/API contracts, jurisdiction/licensing/residency decisions, payment/credit/claims/official-inquiry/automotive authority, native scope and approved infrastructure budgets. Do not manufacture these inputs. A missing contract disables its real operation and permits only documented synthetic boundaries.

## Resume without recreating completed work

Read status, report and this ledger; retain stable parent/child/acceptance IDs. The owning generators in [validation](validation/) rebuild their artifacts. Update the authored source records before regeneration. Rebuild meta/contracts/reports/inventory in dependency order and run validation; record new actual evidence. Required path coverage can be complete while standards validation or semantic review is still pending. Close each gap individually with evidence, then reconsider documentation_complete. Do not restart from the supplied brief or replace draft status with human approval without a real sign-off.

## Blocking questions

No user answer was required to write the reversible proposed documentation. Production questions remain assigned in the blocker registry; they are not permission to perform live work. No unattended continuation is promised.''','R18')

doc('_meta/validation/README.md','Documentation generation and validation','''Run from repository root. Python standard library suffices for local structure checks; no application dependencies are required. YAML registries/contracts use JSON syntax (valid YAML1.2), so parsing does not depend on PyYAML.

## Rebuild order

1. `rtk proxy python3 -B docs/_meta/validation/build_root.py`
2. `rtk proxy python3 -B docs/_meta/validation/build_experience.py`
3. `rtk proxy python3 -B docs/_meta/validation/build_features.py`
4. `rtk proxy python3 -B docs/_meta/validation/build_engineering.py`
5. `rtk proxy python3 -B docs/_meta/validation/build_delivery.py`
6. `rtk proxy python3 -B docs/_meta/validation/build_meta.py`
7. `rtk proxy python3 -B docs/_meta/validation/build_contracts.py`
8. `rtk proxy python3 -B docs/_meta/validation/build_reports.py`
9. `rtk proxy python3 -B docs/_meta/validation/build_inventory.py`
10. `rtk proxy python3 -B docs/_meta/validation/validate.py`
11. `rtk proxy python3 -B docs/_meta/validation/validate_simulator_contracts.py`
12. `rtk proxy python3 -B docs/_meta/validation/check_generation.py`

The validator writes the report. Refresh reports/inventory and revalidate after changed outputs so manifest hashes and report schema agree; this is evidence synchronization, not repeated application testing. Schemas must be reviewed when regenerated: inferring a new registry shape is not approval to change it. A changed source with old generated files is caught by a regeneration/hash comparison and traceability checks.

## Checks and limits

Local checks validate required registry types/keys/enums, metadata/source/assumption IDs, every expected topic path,74/24 baseline identity, child/acceptance references, all24 feature sections, permission/flag/budget references, OpenAPI operations, contract refs/examples, AsyncAPI channel links, local Markdown links and manifest content hashes. Negative self-checks confirm malformed enum/required/extra fields fail. The Python standard-library fallback checks a documented keyword subset. When application dependencies are installed, the additional locked Ajv8/ajv-formats batch validates full Draft2020-12 schemas and examples, including expected-invalid financial cases.

The validator automatically uses `jsonschema` and `openapi-spec-validator` when available. The optional Python pins remain [jsonschema4.26.0](https://pypi.org/project/jsonschema/) and [openapi-spec-validator0.9.0](https://pypi.org/project/openapi-spec-validator/). Official PyPI package-host downloads failed during both phases. The implementation phase successfully installed an exact npm alternative: `@apidevtools/swagger-parser13.1.0` for OpenAPI3.1 and `@asyncapi/parser3.6.6` for AsyncAPI3.0. The exact direct and transitive pins are retained in this directory's package.json and package-lock.json. Run `npm --prefix docs/_meta/validation ci --ignore-scripts`, then `node docs/_meta/validation/validate_standards.mjs` (or `--check` for read-only validation). An isolated installation may be selected with `ST_DOC_TOOLS_ROOT`.

The earlier Python-only installation failure was a network availability failure, not an automatic approval rejection. Current [standards evidence](../contract-standards-report.json) records the successful npm alternative, exact runtime, input hashes and parser diagnostics. AsyncAPI emits an informational recommendation to migrate the existing3.0 contract to3.1; no error was reported. The contract version is preserved pending a reviewed compatibility change.

After standards validation changes its report, rebuild inventory and run validate.py. Hash-bound recorded standards results are accepted only for matching contract inputs. These checks establish static schema/contract properties; they do not prove that all target operations exist at runtime or that a typed client matches them. Application, performance, accessibility and provider certification evidence is maintained separately in [implementation evidence](../implementation-evidence.json).''','R17')
print('Updated README, coverage, consistency, review, status and exact continuation.')
