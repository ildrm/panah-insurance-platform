---
{
  "id": "DOC-10-CLEAN-CODE-AND-TYPESCRIPT",
  "title": "Enforceable TypeScript and clean-code rules",
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

# Enforceable TypeScript and clean-code rules

Enable strict TypeScript, no implicit any, strict null checking and checked indexed access; narrow `unknown` at every external boundary. Unexplained `any`, unsafe casts, ignored promises and non-null assertions require removal or a reviewed local justification with an expiry when temporary. Prefer discriminated result unions for business outcomes and explicit thrown infrastructure errors with consistent mapping.

Use names that express business capacity: payerId, insuredId, policyholderId, carrierId and selectedContext, never an overloaded customerId. Model money/date/version/business keys as validated values. Inject clocks, IDs and external clients for deterministic tests. Keep functions cohesive around a decision; arbitrary line limits are not quality gates.

Transactions are bounded and contain no network I/O. Controllers have no premium, eligibility, ledger or issuance logic. Use narrow interfaces and concrete use-case repositories; introduce generic abstractions only when they remove demonstrated duplication without hiding query/transaction behavior. Explicitly handle cancellation, timeout and unknown external outcome.

Review evidence includes input/output schemas, permitted imports, error behavior, concurrency invariant and measured performance exceptions. Static checks enforce unused imports, promise handling, naming/export boundaries and formatting. CODE-01 compiler/lint pass; CODE-02 negative boundary tests reject malformed data; CODE-03 property tests cover money and state invariants. No universal 100% line-coverage target is required.
