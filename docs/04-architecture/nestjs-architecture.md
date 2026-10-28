---
{
  "id": "DOC-04-NESTJS-ARCHITECTURE",
  "title": "NestJS application and worker architecture",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-01",
    "CHN-02",
    "CHN-05",
    "INT-01",
    "INT-07"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S02",
    "S03",
    "S04",
    "S09"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# NestJS application and worker architecture

Controllers authenticate, validate transport input, invoke application use cases and map typed outcomes. Guards establish identity and broad permission; resource and field authorization execute inside the use case with current records. Do not put business transitions in decorators, interceptors or controllers. Dependency injection uses explicit ports for clocks, IDs, transactions, partner clients and file scanners so tests can reproduce timeouts and races.

API and worker entrypoints load only their required modules. Workers recover leases after process death and do not acknowledge work before durable outcome recording. Expensive XML/JSON transformations, image processing and reports run outside the API event loop in bounded worker processes. Cancellation signals propagate to read-only partner calls; a canceled client does not cancel an already committed purchase.

The HTTP adapter is a pending measured decision. Compare supported Express and Fastify versions with identical validation, security middleware, serialization, database pools, uploads and tracing. An adapter cannot win by disabling checks. Record p95/p99, CPU, heap, event-loop lag and middleware compatibility. [Nest adapter guidance](https://docs.nestjs.com/techniques/performance) identifies adapter integration; it is not evidence of this application's performance.

Acceptance NEST-01: identical contracts and authorization tests pass for candidates; NEST-02: worker crashes at every transaction boundary preserve one logical financial effect; NEST-03: CPU-heavy import does not violate PERF-READ for checkout traffic.
