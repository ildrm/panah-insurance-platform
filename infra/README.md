# Local deployment and recovery

The native profile is exercised by the implementation tests. The Compose file defines PostgreSQL, a one-off migration/seed/publish job, Nest API, Nest worker, fictional carriers and the Next web application. Docker Compose configuration parses successfully; container build/start has not been qualified because the available Docker daemon could not be accessed. These are local sandbox assets.

Use the native startup instructions in the root README for the verified environment. Native and Compose profiles use the same local ports; stop one profile before starting the other. To use Compose when a daemon is available:

```sh
rtk proxy docker compose -f infra/compose.yaml config --quiet
rtk proxy docker compose -f infra/compose.yaml up --build
```

Open `http://127.0.0.1:3000`. Only loopback host ports are published. PostgreSQL and carrier services use the internal backend network; API and web share the frontend network. Bootstrap must complete before API starts, and API readiness gates the worker/web services. Schema changes go through the checksum-tracked migration runner, then synthetic data and independently identified synthetic fixture approvals are applied. This is not human or live-provider approval.

`ST_SANDBOX_SERVICE_HOSTS` is a trusted deployment setting. It is empty by default. Compose explicitly permits `simulators` for API/worker outbound calls and `api` for signed callbacks; arbitrary user request fields cannot alter the list. Service-host access requires `APP_MODE=sandbox`. Simulator binding to `0.0.0.0` additionally requires `ST_SANDBOX_CONTAINER=true`; native defaults remain `127.0.0.1`. `API_URL`/`API_ORIGIN` are nonsecret image-build/runtime routing settings. Real keys never belong in build arguments.

The private `objects` volume is shared only by API/worker/bootstrap. Database and object volumes persist across `docker compose down`. No data-volume deletion command is part of startup or rollback. The Dockerfile uses a nonroot runtime user. Full container integration, image vulnerability/license review, remote secret storage, production egress controls and production rollout remain unqualified.

## Verified native recovery procedure

With the task-owned native database on `127.0.0.1:55432`, application packages built, and PostgreSQL17 tools available:

```sh
rtk proxy node --env-file-if-exists=.env.local scripts/backup-restore.mjs
rtk proxy node --import tsx --test tests/recovery.test.ts
```

The script exports a read-only repeatable-read snapshot, computes streaming table/schema fingerprints, and gives that same snapshot to `pg_dump`. It copies immutable private objects and validates each confirmed policy document against its database hash. Archives and manifests are private files under ignored `.local/backups/`.

Restore creates a new `st_restore_<random-id>` database. It never restores into or drops the source database. After `pg_restore`, verification compares every application table fingerprint, monetary journal balance, receipt/workflow state, paid-unissued/unknown counts, inbox/outbox/submission/policy state and document hashes. A changed restored row or PDF causes failure. The generated restore database is cleaned up after verification; the archive and report remain for review.

Tests also prove exported-snapshot behavior during a concurrent write and use a monetary amount above JavaScript's exact integer range. They create and clean only generated task databases. Current native evidence includes an actual backup/restore of 33 application tables and 6 private documents. Exact observed times and source-state counts are in the generated recovery report; they are local observations, not production RPO/RTO qualification.

The native drill reads the native `OBJECT_STORAGE_DIR`. Compose named-volume recovery still requires a qualified container object-export/snapshot procedure; do not point native recovery at an empty host directory and call it complete. Before production, qualify encrypted/off-site backups, keys, retention/legal hold, independent failure-domain restore, session/access revalidation after recovery, load during backup and rollback/restore against real-provider reconciliation. Proposed targets remain in `docs/_meta/performance-budgets.yaml`.
