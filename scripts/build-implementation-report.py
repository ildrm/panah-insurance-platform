#!/usr/bin/env python3
"""Build a conservative implementation checkpoint from canonical scope and evidence.

Component tests never automatically certify an entire requirement. This generator
does not edit the original requirements, product families, roles or approvals.
"""
import argparse
import collections
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'docs/_meta'
STATES = ['not_started', 'in_progress', 'implemented_unverified', 'verified_local',
          'verified_sandbox', 'externally_blocked', 'ready_for_release',
          'not_applicable_with_reason']


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def strings(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(item) for item in value]
    return [json.dumps(value, ensure_ascii=False, sort_keys=True)]


def unique(values):
    return list(dict.fromkeys(values))


def relative(path):
    return str(path.relative_to(ROOT))


def frontmatter(identifier, title, owner='R18', scopes=None):
    data = {'id': identifier, 'title': title, 'status': 'draft', 'version': '1.0.0',
            'owner_role': owner, 'reviewer_roles': ['R13', 'R17', 'R19'],
            'scope_ids': scopes or ['ALL'], 'source_refs': ['S00', 'S27', 'S28', 'S29'],
            'assumption_refs': ['A01'], 'updated': '2026-10-28'}
    return '---\n' + json.dumps(data, ensure_ascii=False, indent=2) + '\n---\n\n# ' + title + '\n\n'


def generate():
    baseline_path = META / 'implementation-input/st-scope-baseline.json'
    feature_path = META / 'fragments/features.json'
    baseline, definitions = read(baseline_path), read(feature_path)
    assert len(baseline['features']) == len(definitions['parents']) == 74
    assert len(baseline['product_families']) == 24 and len(baseline['roles']) == 21
    expected = {entry['id']: entry['name'] for entry in baseline['features']}
    assert expected == {entry['id']: entry['title'] for entry in definitions['parents']}, 'Canonical baseline names changed'
    leaves = {leaf['id']: (parent, leaf) for parent in definitions['parents'] for leaf in parent['children']}
    assert len(leaves) == 230, 'Every one of the 230 requirements must remain represented'
    fragments = [(path, read(path)) for path in sorted((META / 'fragments').glob('*-implementation.json'))]
    evidence_path = META / 'implementation-evidence.json'
    evidence = read(evidence_path) if evidence_path.exists() else {'entries': []}
    component_claims = collections.defaultdict(list)
    decisions = []
    review_findings = []
    for path, fragment in fragments:
        for key in ['requirements', 'leaf_evidence']:
            for claim in fragment.get(key, []):
                identifier = claim.get('requirement_id', claim.get('id'))
                assert identifier in leaves, f'Unknown requirement {identifier} in {path.name}'
                state = claim.get('state', claim.get('status', 'in_progress'))
                assert state in STATES, f'Unknown state {state} in {path.name}'
                component_claims[identifier].append({'source': relative(path), **claim,
                                                      'component_state': state})
        for item in fragment.get('decisions', []):
            decisions.append({'source': relative(path), **(item if isinstance(item, dict) else {'detail': str(item)})})
        for item in fragment.get('review_findings', []):
            review_findings.append({'source': relative(path), **(item if isinstance(item, dict) else {'finding': str(item), 'state': 'recorded'})})
    requirements = []
    for identifier, (parent, leaf) in leaves.items():
        claims = component_claims[identifier]
        # Deliberately refuse to promote component evidence to whole-leaf acceptance.
        state = 'in_progress' if claims else 'not_started'
        code = unique(path for claim in claims for path in strings(claim.get('code_paths', claim.get('files'))))
        tests = unique(path for claim in claims for path in strings(claim.get('test_paths')))
        for path in code + tests:
            assert (ROOT / path).exists(), f'Broken implementation evidence path: {path}'
        remaining = unique(item for claim in claims for key in ['missing', 'remaining_behavior'] for item in strings(claim.get(key)))
        if not claims:
            remaining = ['No implementation evidence mapped to this leaf. Implement the canonical desired capability and all applicable acceptance scenarios.']
        remaining.append('Whole-leaf acceptance, independent review and release qualification remain pending; component proof does not complete this requirement.')
        requirements.append({'id': identifier, 'parent_id': parent['id'], 'parent_name': parent['title'],
                             'title': leaf['title'], 'state': state, 'owner_role': parent['owner_role'],
                             'rollout_state': 'Report does not change authoritative feature controls; real operations remain disabled without authority',
                             'spec_path': 'docs/' + parent['spec_path'], 'desired_capability': leaf['desired_capability'],
                             'acceptance_ids': leaf['acceptance_ids'], 'acceptance_scenario_ids': leaf['acceptance_scenario_ids'],
                             'api_operation': leaf['api_operation'], 'code_paths': code, 'test_paths': tests,
                             'evidence_sources': unique(claim['source'] for claim in claims),
                             'component_evidence': claims, 'remaining': remaining})
    parents = []
    for parent in definitions['parents']:
        children = [entry for entry in requirements if entry['parent_id'] == parent['id']]
        parents.append({'id': parent['id'], 'name': parent['title'], 'scope': expected_scope(baseline, parent['id']),
                        'owner_role': parent['owner_role'], 'state': 'in_progress' if any(row['state'] == 'in_progress' for row in children) else 'not_started',
                        'children': [row['id'] for row in children], 'counts': dict(collections.Counter(row['state'] for row in children))})
    product_claims = collections.defaultdict(list)
    for path, fragment in fragments:
        for product in fragment.get('products', []):
            assert product['id'] in {row['id'] for row in baseline['product_families']}
            product_claims[product['id']].append({'source': relative(path), **product})
    products = [{**product, 'state': 'in_progress' if product_claims[product['id']] else 'not_started',
                 'component_evidence': product_claims[product['id']],
                 'synthetic_carrier_mapping_available': product['id'] in ['PRD-01', 'PRD-07', 'PRD-24'],
                 'live_certified': False, 'whole_family_verified': False}
                for product in baseline['product_families']]
    inputs = [baseline_path, feature_path] + [path for path, _ in fragments]
    if evidence_path.exists():
        inputs.append(evidence_path)
    entries = []
    for entry in evidence.get('entries', []):
        log = ROOT / entry.get('log_path', '.missing')
        entries.append({**entry, 'log_available_at_generation': log.is_file(),
                        'log_hash_matches_at_generation': digest(log) == entry.get('log_sha256') if log.is_file() else None})
    revision = subprocess.run(['rtk', 'proxy', 'git', 'rev-parse', 'HEAD'], cwd=ROOT,
                              capture_output=True, text=True, check=True).stdout.strip()
    checkpoint = max([entry.get('ended_at', '2026-10-28') for entry in entries] +
                     [fragment.get('recorded_at', fragment.get('updated', '2026-10-28')) for _, fragment in fragments])
    counts = {state: sum(row['state'] == state for row in requirements) for state in STATES}
    status = {'id': 'IMPLEMENTATION-STATUS', 'version': '1.0.0', 'status': 'partial',
              'updated': '2026-10-28', 'latest_recorded_evidence_at': checkpoint,
              'revision': revision, 'worktree': 'Uncommitted implementation; revision identifies the base commit, not all current source',
              'production_ready': False, 'independent_human_approval': 'pending',
              'native_client_decision': 'undecided; web/PWA artifacts do not settle native scope',
              'full_scope_retained': True, 'baseline_counts': {'parent_features': 74, 'child_requirements': 230, 'product_families': 24, 'roles': 21},
              'leaf_state_counts': counts, 'aggregation_policy': 'All mapped partial component evidence remains in_progress. No complete-leaf or release state is inferred from tests, disabled flags, schemas, route counts or scaffolding.',
              'input_sha256': {relative(path): digest(path) for path in inputs},
              'parents': parents, 'requirements': requirements, 'products': products,
              'roles': [{**role, 'human_signoff': 'pending'} for role in baseline['roles']],
              'review_findings': review_findings,
              'executed_command_evidence': entries,
              'remaining_requirement_ids': [entry['id'] for entry in requirements],
              'local_verified_components': ['Synthetic HTTP adapters and durable issuance worker', 'Scoped domain/finance regression tests', 'Browser purchase and dashboard scenarios at their recorded checkpoint', 'Isolated PostgreSQL recovery fixtures; current demo source integrity is reported separately'],
              'release_gaps': ['All complete-leaf acceptance/review gates', 'Actual provider, jurisdiction and commercial authority', 'Representative workload, recovery targets and operational qualification', 'Container runtime, infrastructure, production secrets and alert delivery', 'Full accessibility/security review and native-scope decision']}
    outputs = {META / 'implementation-status.json': json.dumps(status, ensure_ascii=False, indent=2) + '\n'}
    csv_buffer = io.StringIO(newline='')
    writer = csv.DictWriter(csv_buffer, lineterminator='\n', fieldnames=['requirement_id', 'parent_id', 'parent_name', 'title', 'state', 'rollout_state', 'owner_role', 'spec_path', 'api_operation', 'code_paths', 'test_paths', 'evidence_sources', 'remaining'])
    writer.writeheader()
    for row in requirements:
        writer.writerow({'requirement_id': row['id'], **{key: '; '.join(row[key]) if isinstance(row[key], list) else row[key] for key in writer.fieldnames if key != 'requirement_id'}})
    outputs[META / 'implementation-traceability.csv'] = csv_buffer.getvalue()
    outputs.update(markdown_reports(status, decisions, fragments))
    return outputs


def expected_scope(baseline, identifier):
    return next(row['scope'] for row in baseline['features'] if row['id'] == identifier)


def markdown_reports(status, decisions, fragments):
    counts = status['leaf_state_counts']
    regression = next((entry for entry in reversed(status['executed_command_evidence']) if entry['exit_code'] == 0 and 'regression' in entry['id'] and 'node24' in entry['id']), None)
    regression_summary = 'Recorded local regression results are in the evidence registry'
    if regression and regression['log_hash_matches_at_generation']:
        log = (ROOT / regression['log_path']).read_text()
        passed, skipped = re.search(r'\bpass\s+(\d+)', log), re.search(r'\bskipped\s+(\d+)', log)
        if passed and skipped:
            regression_summary = f"Recorded Node 24 regression: {passed.group(1)} passed, {skipped.group(1)} skipped"
    summary = (f"The implementation is partial. All 74 parent capabilities, 230 child requirements, 24 product families and 21 roles remain in scope. "
               f"{counts['in_progress']} leaves have mapped partial component evidence; {counts['not_started']} have no mapped implementation evidence. "
               "No whole leaf is marked verified or release ready. Production readiness is false and independent human approval remains pending.\n\n")
    outputs = {}
    progress = frontmatter('DOC-14-IMPLEMENTATION-PROGRESS', 'Implementation progress') + summary
    progress += ('Next.js web, Nest API/worker, PostgreSQL domain/finance modules and three fictional carrier simulators now contain executable flows. '
                 'The backend-only and frontend-only fragments retain their original evidence scope. A questionnaire or operation handler does not establish complete product underwriting, servicing or authorization acceptance.\n\n'
                 f'{regression_summary}; the clean locked install and complete workspace production build passed. '
                 'The evidence registry preserves exact commands, source fingerprints, timestamps and logs. Browser scenarios and the historical native restore drill apply to their recorded checkpoints. '
                 'The small corrected load smoke completed 2,000 scheduled requests with zero errors, p95 11.88 ms and p99 15.49 ms over 7 policies, 13 orders and 18 users. '
                 'This does not qualify the production workload or one-million-policy capacity.\n\n'
                 'The six-service Compose file passes configuration parsing. Image build, running containers and named-volume restore have not been qualified. '
                 'Real provider operations remain disabled without actual authority. Native client scope is undecided.\n\n'
                 'See [the machine-readable checkpoint](../_meta/implementation-status.json), [all leaf mappings](../_meta/implementation-traceability.csv), '
                 '[executed evidence](../_meta/implementation-evidence.json), [remaining work](../_meta/implementation-continuation.md) and '
                 '[production gates](../12-operations/production-readiness-report.md).\n')
    current_gate=ROOT/'docs/12-operations/evidence/local-recovery-source-gate.json'
    if current_gate.exists():
        gate=read(current_gate)
        progress += (f"\nThe current local recovery snapshot matched across {gate['table_count']} tables and {gate['document_count']} documents. "
                     f"Business integrity did not pass: {gate['source_consistency']['missing_commitment_events']} historical synthetic commitments lack canonical events and submissions. "
                     "These pre-isolation fixture records were preserved. All three pure finance suites now use generated isolated databases. "
                     "See [the current source gate](../12-operations/evidence/local-recovery-source-gate.json); historical weaker-gate passes do not override it.\n")
    outputs[ROOT / 'docs/14-delivery/implementation-progress.md'] = progress
    decision_text = frontmatter('DOC-IMPLEMENTATION-DECISIONS', 'Implementation decisions', 'R05')
    decision_text += ('These are implementation choices and proposed local assumptions. They are not insurer contracts, regulatory approvals or independent human sign-offs. The user authorized implementation; no full-scope deletion or native-scope decision is inferred.\n\n'
                      'The stack uses one web presentation application with context-specific dashboards and server-side domain authority. PostgreSQL persists financial journals and durable integration state. '
                      'The fictional REST, SOAP and signed HTTP protocols stay distinct; unsupported real operations fail closed. Only PRD-01, PRD-07 and PRD-24 have synthetic carrier mappings. '
                      'All 24 product schemas remain represented, including assisted/unsupported product outcomes.\n\n'
                      'Wallet issuance uses the distinct `purchase.committed.v2` event and `verified_wallet_allocation` funding state. Carrier delivery retains the same stable submit key and cannot manufacture a provider cash receipt. '
                      'Insurer-confirmed issuance persists before independent private-document retrieval. Historical connection versions and exact historical synthetic secret-reference aliases remain usable for committed work.\n\n')
    for index, decision in enumerate(decisions, 1):
        decision_text += f"- `{decision.get('id', 'COMPONENT-DECISION-' + str(index))}` ({decision.get('status', 'recorded component choice')}): {decision.get('detail', decision.get('description', 'See source fragment'))} Source: `{decision['source']}`.\n"
    decision_text += '\nNative applications, actual provider contracts, approved infrastructure targets and production release remain unresolved decisions.\n'
    outputs[META / 'implementation-decisions.md'] = decision_text
    review = frontmatter('DOC-IMPLEMENTATION-REVIEW-FINDINGS', 'Implementation review findings', 'R13')
    review += summary + ('The role roster records responsibilities, not 21 independent human reviews. Current evidence includes local invariant tests and source review; formal whole-leaf, accessibility, regulatory and ASVS acceptance remains open.\n\n'
                        '| Finding | Current treatment | Remaining gate |\n| --- | --- | --- |\n'
                        '| Duplicate/late payment or callback and wallet/credit funding confusion | Regression tests exercise idempotency, cancellation and distinct financial state; wallet v2 reconciles without a second submit | Complete business acceptance and actual provider contracts |\n'
                        '| Carrier timeout after acceptance | Durable unknown state and authoritative reconciliation; providers without status remain held | Audited evidence-based operator replay and real provider qualification |\n'
                        '| Confirmed policy with unavailable PDF | Confirmed issuance survives; private document retrieval retries separately | Full customer/operations recovery and production storage qualification |\n'
                        '| Financial or document corruption during restore | Local isolated restore compares every table/schema fingerprint, exact journal balance and PDF hashes; corruption fails | Independent failure-domain/key-loss/deletion/access recovery |\n'
                        '| Incomplete product/leaf coverage hidden by generic routes | Conservative 230-row rollup keeps partial/not-started states | Implement all remaining canonical behavior and acceptance cases |\n'
                        '| Performance smoke mistaken for capacity evidence | Corrected bounded smoke is identified with its small dataset | Representative WL-01, tail latency, noisy-neighbor, bulk/report and field Web Vitals evidence |\n'
                        '| Generated manifests mistaken for deployment | Compose syntax validation only | Image build, deployment, container recovery and rollback |\n'
                        '| Dependency/advisory confidence | Clean official locked install/build passed; 212 dependency names yielded no reported npm advisories at the recorded time | Provenance/license/security review and ongoing vulnerability response |\n\n'
                        'Historical failed commands remain in the evidence ledger. A later successful run applies only to its recorded source checkpoint. '
                        'Full standards validation is qualified only by the dedicated validation reports; package-download or validator gaps must remain visible.\n')
    outputs[META / 'implementation-review-findings.md'] = review
    if status['review_findings']:
        review += '\nComponent review ledger (the recorded state is preserved; whole-leaf closure is not inferred):\n\n'
        for finding in status['review_findings']:
            review += f"- `{finding.get('id', 'COMPONENT-REVIEW')}` ({finding.get('state', finding.get('status', 'recorded'))}): {finding.get('finding', finding.get('detail', 'See source fragment'))} Source: `{finding['source']}`."
            if finding.get('next_action'):
                review += ' Next: ' + finding['next_action']
            review += '\n'
        outputs[META / 'implementation-review-findings.md'] = review
    blockers = frontmatter('DOC-IMPLEMENTATION-EXTERNAL-BLOCKERS', 'External implementation blockers', 'R19')
    blockers += ('These missing external authorities block their affected real operations. Safe local implementation and synthetic testing can continue. No actual provider acceptance or human approval is fabricated.\n\n'
                 '| Blocker | Owner roles | Affected scope | Safe current behavior | Required evidence |\n| --- | --- | --- | --- | --- |\n'
                 '| Insurer contracts, rates, underwriting and servicing APIs | R02/R09/R19/R20 | INS, COM-06, SVC, INT | Three fictional transports; other real operations disabled | Signed commercial/technical authority, approved mappings and certification |\n'
                 '| Payment, financing, credit, settlement and claims payout authority | R12/R19 | COM-03/04/09, GRW-02, SVC-03/08, ORG-03, AUTO-03 | Synthetic verified financial operations, exact local journals; no live fund movement | Provider contracts, reconciliation and dual-control approval |\n'
                 '| Official identity, vehicle, history and government inquiries | R09/R11/R19 | INS-04, COM-02, AUTO-02 | Explicit unsupported or synthetic/manual boundaries | Permitted data access, purpose, provenance and retention rules |\n'
                 '| Insurance, trading, adjacent finance and rewards permissions | R01/R12/R19 | AUTO-07, ECO-01, GRW-03/04 and regulated offerings | Real regulated action disabled | Jurisdiction/licensing review and approved commercial terms |\n'
                 '| Privacy, residency, medical data, retention and arbitrary-file malware scanning | R10/R11/R19 | ORG-04, COM-02, claims, support and private documents | Minimal scoped projections and quarantined unknown files | Approved scanner, lawful basis, deletion/legal-hold and residency decisions |\n'
                 '| Production infrastructure, secrets, recovery and on-call ownership | R06/R10/R11/R14/R18 | All production operations | Local native verification and Compose syntax only | Approved targets, deployed encrypted/off-site backups, measured DR/capacity and incident drills |\n'
                 '| Native client scope and app distribution | R01/R04/R18/R21 | GRW-10, AUTO-08 and device experiences | Web/PWA artifacts; native decision remains undecided | Explicit scope decision and platform-specific acceptance where selected |\n\n'
                 'Missing external input is not a reason to delete capability IDs or mark an unimplemented feature complete. Every full requirement remains in the [checkpoint](implementation-status.json).\n')
    outputs[META / 'external-blockers.md'] = blockers
    continuation = frontmatter('DOC-IMPLEMENTATION-CONTINUATION', 'Implementation continuation') + summary
    continuation += (f"Base revision: `{status['revision']}`. The implementation is uncommitted; use current source fingerprints and logs in `implementation-evidence.json` to identify each checked source checkpoint. "
                     'The environment restarted during work: temporary processes/runtime disappeared and the local PostgreSQL/runtime profile was recreated under ignored `.local/`. Historical restore artifacts remain tied to their recorded data/schema.\n\n'
                     'Changed areas include `apps/{web,api,worker,simulators}`, `packages/{contracts,database,business,finance,controls,integrations,api-client,ui}`, `scripts`, `tests`, `infra` and implementation evidence/docs. '
                     'Run the migration runner over all package migration directories. Preserve the ordered platform migrations `001-platform.sql`, `002-finance-continuity.sql`, `003-wallet-commitment.sql` and `004-credit-servicing.sql`, plus business/finance/controls/integration migrations; never recreate a used database to bypass an upgrade.\n\n'
                     'Resume by checking the current worktree and evidence source hashes, running the current locked Node 24 install/build/regression procedure, and starting the documented local services. '
                     'Regenerate this rollup with `rtk proxy python3 scripts/build-implementation-report.py`; `--check` detects stale generated reports. Do not promote a component state without whole-leaf acceptance evidence.\n\n'
                     'Next concrete work:\n\n'
                     '1. Complete domain/product acceptance in INS-01 through INS-12 and COM-01 through COM-09, including relationship snapshots, underwriting/rider semantics, declarations, exact commercial commitments and customer-safe timelines. Keep unsupported family/provider behavior explicit.\n'
                     '2. Complete approved policy-change/claim/financial servicing and evidence-based replay in SVC-01 through SVC-09, CHN-05 and INT-07/08; connect independently approved real authorities only after their gates pass.\n'
                     '3. Complete organization, seller/employee/carrier/admin property authorization, bulk approval and dashboard acceptance in ORG, CHN and DSH; prove races, revocation, cross-context denial and existing-obligation continuity.\n'
                     '4. Implement uncovered growth/automotive/adjacent capabilities rather than substituting generic CRUD, and qualify all 24 product family variations.\n'
                     '5. Qualify representative capacity, private cache isolation, accessibility/manual RTL review, full security/standards review, deployed backups/rollback/secret rotation, alert delivery and native scope. Resolve external blockers and obtain actual human release sign-off.\n\n'
                     'Every remaining leaf ID follows; its exact desired behavior, source/test paths and gaps are in `implementation-status.json` and `implementation-traceability.csv`.\n\n')
    for parent in status['parents']:
        continuation += f"- `{parent['id']}` {parent['name']} ({parent['owner_role']}): " + ', '.join('`' + item + '`' for item in parent['children']) + '.\n'
    if current_gate.exists():
        continuation += '\nThe current demo source gate reports30 historical synthetic commitments without events/submissions. Review the preserved records with their fixture provenance; never fabricate dispatch or delete posted journals. New finance tests use isolated generated databases. The [source gate](../12-operations/evidence/local-recovery-source-gate.json) records this open qualification issue. Scoped runtime guards still require worker-wide and broader servicing bindings.\n'
    continuation += '\nNo unattended continuation is promised. Production remains blocked while required implementation and qualification work is incomplete.\n'
    outputs[META / 'implementation-continuation.md'] = continuation
    readiness = frontmatter('DOC-12-PRODUCTION-READINESS-REPORT', 'Production readiness report', 'R14')
    readiness += ('Production readiness: **false**. This is a partial local implementation checkpoint with no independent human release approval or live-provider certification.\n\n'
                  '| Gate | Actual evidence | Status |\n| --- | --- | --- |\n'
                  '| Baseline scope | All 74 parents, 230 children, 24 products and 21 roles retained | Represented; implementation incomplete |\n'
                  '| Reproducible build | Official normalized lock, clean npm install and all-workspace Node 24 production build passed | Verified at recorded source checkpoint |\n'
                  f'| Local domain/integration regressions | {regression_summary}; wallet/credit/cash distinctions and uncertain carrier outcomes exercised | Component evidence only |\n'
                  '| Browser behavior | Recorded local purchase, context and operations scenarios | Remaining full journey, a11y and mobile/device coverage |\n'
                  '| Dependency advisories | Official npm bulk response reported no advisories for 212 dependency names | Point-in-time check, not security certification |\n'
                  '| Database and objects | Six current recovery tests separate snapshot fidelity from source business integrity; the historical33-table/6-document native pass used an earlier weaker gate | Current demo source gate fails; isolated valid fixtures pass |\n'
                  '| Containers | Six-service Compose configuration parses; migration/seed bootstrap and health dependencies authored | Image/runtime, volume restore and rollback unqualified |\n'
                  '| Performance | Corrected small local smoke: 2,000/2,000 arrivals, 199.31 requests/s, p95 11.88 ms, p99 15.49 ms, zero errors; 7 policies/13 orders/18 users | Production workloads, field Web Vitals and capacity unqualified |\n'
                  '| Observability | Local diagnostic/transaction and health components, partial private operational metrics | SLOs, distributed tracing, dashboards, alert delivery and incident drills incomplete |\n'
                  '| Recovery objectives | Native observed backup 3,966 ms and restore/verify 938 ms for historical small fixture; no observed data-loss experiment | RPO/RTO remain proposed, unmeasured production targets |\n'
                  '| Security/privacy/legal | Local scoped authorization, verified callback and immutable journal protections | Formal review, retention/deletion, real scan/keys/residency and regulatory gates open |\n'
                  '| External operations | Fictional carrier/payment/finance boundaries only | Actual provider contracts and certification absent |\n'
                  '| Native clients | Web/PWA artifacts exist | Native scope undecided |\n\n'
                  'Recovery exports one read-only repeatable-read snapshot for both table fingerprints and `pg_dump`, then restores into a newly generated `st_restore_...` database. '
                  'Verification checks all application table/schema hashes, exact journal balances, pending/unknown orders, inbox/outbox/submissions/policies and private document manifests. '
                  'Tests reject row/PDF tampering and preserve source state. Recovery does not blindly replay outbound mutations. '
                  'The historical artifact is `.local/backups/2026-10-28T09-32-11-580Z-c796a8a0-e0b9-4810-9103-42ecaad235bf/recovery-report.json`. '
                  'Later migrations/data require a new measured checkpoint; this artifact is not proof of current production disaster recovery.\n\n'
                  'Before release, qualify independent failure-domain and encrypted/off-site restores, key-loss recovery, deletion/legal-hold reapplication, restored session/access review, real-provider reconciliation, controlled rollback, representative load and signed operational ownership. '
                  'Targets in the central performance registry remain targets until measured under their specified workload. See [external blockers](../_meta/external-blockers.md), '
                  '[remaining implementation](../_meta/implementation-continuation.md) and [executed evidence](../_meta/implementation-evidence.json).\n')
    if current_gate.exists():
        gate=read(current_gate)
        readiness += (f"\nCurrent local source checkpoint: snapshot fidelity matched across{gate['table_count']} tables/{gate['document_count']} documents; business integrity is **false**. "
                      f"There are{gate['source_consistency']['missing_commitment_events']} historical synthetic commitments without canonical events and submissions from pre-isolation tests. "
                      "The CLI exits nonzero, preserves the backup, removes its generated restore target and does not repair or delete source records. "
                      "See [current source gate](evidence/local-recovery-source-gate.json). This finding supersedes any inference of current business-integrity success from the historical weaker-gate drill.\n")
    outputs[ROOT / 'docs/12-operations/production-readiness-report.md'] = readiness
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated outputs differ')
    args = parser.parse_args()
    outputs = generate()
    stale = []
    for path, contents in outputs.items():
        if args.check:
            if not path.exists() or path.read_text() != contents:
                stale.append(relative(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents)
    if stale:
        raise SystemExit('Stale implementation reports: ' + ', '.join(stale))
    print(('Checked' if args.check else 'Generated') + f' {len(outputs)} reports: 74 parents, 230 children, 24 products, 21 roles; production_ready=false')


if __name__ == '__main__':
    main()
