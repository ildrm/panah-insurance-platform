# Panah insurance platform

Executable Next.js/NestJS local sandbox with original Persian RTL presentation. The complete scope remains **74 parent capabilities, 230 child requirements, 24 product families and 21 responsibility lenses**. Implementation is partial; no production release or human sign-off is claimed.

See [implementation progress](docs/14-delivery/implementation-progress.md), [requirement status](docs/_meta/implementation-status.json), [evidence](docs/_meta/implementation-evidence.json), [continuation](docs/_meta/implementation-continuation.md) and [production readiness](docs/12-operations/production-readiness-report.md). The supplied [main prompt](docs/_meta/implementation-input/st-project.md), [roles](docs/_meta/implementation-input/st-roles.md) and [scope baseline](docs/_meta/implementation-input/st-scope-baseline.json) are preserved as source inputs.

The current runnable paths include authenticated context switching, owned profiles, product forms, eligible sandbox quotes, checkout, verified synthetic payment or independently approved credit, durable issuance, private PDFs, wallet allocations, installment servicing, commission/payout boundaries, census approval, claim/support intake, inspection/underwriting review, CMS/reward and automotive service components. A route or schema does not establish a complete feature. Three fictional HTTP carriers implement REST, SOAP and signed callback protocols; only PRD-01, PRD-07 and PRD-24 have simulator pricing mappings. Other families retain distinct risk schemas and explicit unavailable-provider boundaries.

Scoped availability supports closed product/plan/carrier/organization/region/channel/customer selectors, UTC windows, deterministic cohorts, previews, separate maker/checker publication, immutable revisions and guarded rollback/quarantine. Current runtime bindings protect purchase admission, credit approval and wallet/payment completion under the same database transaction. Other registered capabilities and scoped worker/servicing enforcement remain incomplete. The admin panel labels this boundary.

## Run locally

Use Node **24.22.1**, npm **11.19.1**, PostgreSQL **17.11**, and a current Chrome installation for browser tests. Exact dependencies are pinned in `package-lock.json`. Build and tests also ran earlier under Node26; the current supported verification uses Node24. No external services are required for synthetic purchases.

```sh
npm ci --ignore-scripts
npm run local:database
npm run local:setup
npm run build
npm run dev
```

`local:database` uses installed PostgreSQL17 binaries (or `ST_POSTGRES_BIN`) and creates only the isolated `st_local` database on `127.0.0.1:55432`. Data lives in ignored `.local/postgres`; this local cluster permits trusted loopback synthetic access. `local:setup` generates an ignored `.env.local` with a random cursor key, then builds shared packages, migrates and seeds known synthetic accounts. It does not start a production environment. `dev` starts API3001, worker, simulators3100 and web3000; it publishes the fictional connection fixtures after simulator readiness.

Open <http://127.0.0.1:3000>. Synthetic contacts are `+989000000001` customer, `002` organization buyer, `003` employee, `004` seller, `005` carrier, `006` administrator, `007` operator, `008` independent checker, and `009`/`010` second-organization users (replace the final three digits of the first contact). The sign-in screen exposes locally generated test OTP/MFA values in sandbox mode. Checker access must switch to the appropriate organization or platform context. These are fictional identities; no messages are sent.

Production builds can be served with `npm run start:simulators`, `npm run start:api`, `npm run start:worker`, then `npm run sandbox:publish`; start Next separately with `npm run start -w @st/web`. Use separate terminals. Avoid running these concurrently with `npm run dev` on the same ports.

An alternative complete local topology is [infra/compose.yaml](infra/compose.yaml); see [infrastructure notes](infra/README.md). Compose configuration was parsed successfully. Container image build/runtime qualification remains open.

## Verify

With local API, worker and simulators running:

```sh
npm run lint
npm test
npm run test:e2e
node scripts/bundle-budgets.mjs
npm run perf:smoke
npm run docs:validate
node scripts/backup-restore.mjs
```

Browser tests require Chrome at the configured `CHROME_PATH` (default `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) or an adjusted Playwright executable. Use a production Next build/start for bundle measurements. Recovery additionally needs `pg_dump` and `pg_restore` on `PATH`; it reads the local source and verifies a newly generated isolated restore database, then removes that restore database. Backups and private test objects stay under ignored `.local/` with restrictive permissions. Browser traces and test result artifacts can contain synthetic session credentials and are ignored.

Run `node scripts/run-evidence.mjs <unique-id> <executable> [arguments]` to retain command logs and source fingerprints. IDs are immutable. The evidence register distinguishes historical failures, corrected runs and limitations. The official npm advisory endpoint reported no advisories for the locked dependency versions at the recorded check time; this is not a full security assessment.

Local checks include real PostgreSQL transactions, exact integer-rial accounting, append-only balanced journals, source deduplication, concurrent wallet/credit limits, tenant denial, maker/checker guards, unknown external outcomes without blind replay, signed callback integrity, private documents and actual backup restoration. The API exposes permission-protected aggregate operations metrics at `/v1/operations/metrics` and safe structured route-duration logs. Metrics cover one local process; production telemetry and alert delivery are incomplete.

The existing development database retains30 historical synthetic commitments without dispatch events/submissions from tests written before fixture isolation. All three pure finance suites now use generated isolated databases. The stronger recovery check preserves the source snapshot and reports this business gate as failed; see [the source report](docs/12-operations/evidence/local-recovery-source-gate.json). No source ledger rows were deleted or repaired.

## Boundaries and remaining delivery

All live financial, insurer, official inquiry, communications and regulated partner operations remain disabled. The API refuses non-sandbox startup. Real contracts, pricing/rules, licenses, merchant/payout/financing authority, credentials, privacy/legal decisions and qualified human approvals must be supplied before affected operations can be enabled.

Several secondary dashboard workflows, all-family carrier/product qualification, full feature-control scopes, official inquiries, settlement/claims delegation, generated client compatibility, field accessibility and production operations remain incomplete. Native application scope is undecided; the PWA does not substitute for native apps. The central performance targets are unchanged. Local bundle/API measurements and restore drills do not establish the full million-policy workload, multi-replica behavior, field Web Vitals, production capacity, RPO/RTO or release readiness. Exact remaining requirement IDs are retained in the status and continuation files.

No staging, commit, push, deployment or live transaction is performed by setup or this implementation task.
