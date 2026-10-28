---
{
  "id": "DOC-09-FRONTEND-RENDERING-BUNDLES-AND-WEB-VITALS",
  "title": "Frontend rendering, bundles and Web Vitals",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R06",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INS-05",
    "COM-03",
    "INT-07",
    "ORG-04"
  ],
  "source_refs": [
    "S00",
    "S06"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Frontend rendering, bundles and Web Vitals

Use PERF-JS for initial compressed JavaScript including shared runtime and route chunks. Collect production bundle manifests and browser network traces for landing, questionnaire, comparison, checkout and each dashboard. Also record lazy-route bytes and total quote-to-policy journey transfer; moving every byte to a lazy chunk must not conceal total cost. Images/fonts/CSS and third-party scripts are separate measured inventories.

Keep static product prose on the server, isolate interactive forms, load heavy tables/charts only when needed and avoid serializing hidden data into page props. Progressive quotes reveal real partial results with pending/error labels. Prevent layout shift with reserved image/table/loading space; never hide loading by showing invented premium values.

PERF-WEB follows field p75 measurements segmented by mobile/desktop and key journey. [Web Vitals](https://web.dev/articles/vitals) establishes the metric definitions and thresholds; the registry supplies the targets. Instrument consent-aware, low-cardinality route groups without identity or health fields. Lab Lighthouse/browser traces help diagnose but do not establish field conformance.

WEB-PERF-01 cold/warm visits on a declared device/browser/network; WEB-PERF-02 keyboard input during quote updates; WEB-PERF-03 dashboard with maximum bounded rows; WEB-PERF-04 context switching without stale private content. Record sample size and missing observations; do not silently discard slow sessions.
