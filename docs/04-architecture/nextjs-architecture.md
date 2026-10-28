---
{
  "id": "DOC-04-NEXTJS-ARCHITECTURE",
  "title": "Next.js rendering and application boundaries",
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

# Next.js rendering and application boundaries

Rendering policy is explicit per route. Editorial/catalog pages may pre-render public content; role-specific prices and availability decisions are fetched through authorized Nest endpoints. Policy, wallet, health, census and quote routes are dynamic and send `Cache-Control: private, no-store`. Page rendering is never authorization evidence: APIs enforce the same policy when called directly.

Server components fetch only fields required by the view. Client components are limited to interactive forms, progressive quote updates, filters and upload controls. Pass serializable view DTOs with no tokens, secrets or hidden persistence properties. A Next action may validate presentation input and call Nest; it must not calculate premiums, post ledger entries or access owned tables. Use one typed generated client and explicit error states.

On logout, membership revocation or organization switch, cancel pending requests, clear query state and refresh server/router state before showing the new context. Responses include a context identifier; discard mismatched late responses. Never persist claim/medical content in service-worker caches.

Next caching behavior is release-specific. Verify selected-release headers, streaming, tag invalidation and multi-replica behavior before enabling public cache optimizations. Sources: [production guidance](https://nextjs.org/docs/app/guides/production-checklist), [cache reference](https://nextjs.org/docs/app/api-reference/directives/use-cache), [self hosting](https://nextjs.org/docs/app/guides/self-hosting). Gate NEXT-01 records browser/proxy headers for anonymous and two-user/two-organization journeys against PERF-JS and PERF-WEB.
