---
{
  "id": "DOC-10-SUPPORTED-STACK-AND-VERSION-POLICY",
  "title": "Supported stack and version policy",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Supported stack and version policy

Required application languages/frameworks are TypeScript, Next.js presentation and NestJS domain API/workers. Proposed persistence is PostgreSQL with parameterized SQL through pg; object storage is private; durable outbox/jobs initially use PostgreSQL. Neither Kafka, Kubernetes, Elasticsearch, GraphQL, event sourcing nor multiple ORMs/state libraries are selected without an explicit measured need.

No application package manifest existed at initial discovery. The subsequent authorized implementation pins Node24.22.1/npm11.19.1, Next16.4.3/React19.3.1, Nest12.3.2/Express5.3.0, TypeScript5.9.3, PostgreSQL17.11 and pg8.23.1. TypeScript5.9.3 is a proposed compatibility choice for decorators rather than the latest-major compiler. Exact direct/transitive versions are in the root package-lock.json. An isolated clean install and all-workspace production build passed on Node24; actual commands and source fingerprints are in [implementation evidence](../_meta/implementation-evidence.json). Local builds and the point-in-time registry advisory result do not establish production support, license approval or complete middleware/adapter/capacity qualification.

Record dependency name, exact version, official release/support reference, runtime compatibility, security review date, owner and update policy. Reject canary/beta adoption for unsupported performance claims. Upgrades run contract, migration, private-cache, bundle and representative workload gates; emergency security changes have explicit rollback and follow-up evidence.

STACK-01 clean locked installation reproduces builds; STACK-02 API/client generation is unchanged; STACK-03 HTTP-adapter benchmark includes production middleware. This documentation does not install packages or modify application source. Missing exact pins/lock evidence is a precise implementation readiness blocker, not hidden completion.
