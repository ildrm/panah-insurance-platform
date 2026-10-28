---
{
  "id": "DOC-04-DEPLOYMENT-AND-NETWORK",
  "title": "Deployment and network boundaries",
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

# Deployment and network boundaries

Propose separate storefront, partner and admin Next deployables to isolate dependencies and privilege surfaces. The same reviewed UI packages may be shared. Nest API/worker artifacts share versioned application modules but independent process resources. A reverse proxy serves `/api` directly to Nest for browser requests; server rendering reaches Nest over the internal network with originating user context. Avoid proxying every request through a Next route handler.

Ingress only reaches the proxy. Databases and object-store administration accept private service identities. Workers use an outbound gateway permitting registered scheme/host/port combinations. Destination registration rejects private/link-local ranges, redirects to unapproved destinations and credentials embedded in URLs. DNS resolution is rechecked at connection time; TLS hostname verification remains enabled. XML parsing disables external entities and network access.

Region, hosting vendor, disaster-recovery geography and residency remain approval dependencies, not facts inferred from the requester. Production is blocked until R19/R14 document permitted data locations, partner connectivity and backup locations. Local simulators bind loopback by default and contain synthetic records only.

Validation NET-01: attempt arbitrary URL, redirect, rebinding and internal metadata endpoint from a connector; all denied and audited without secret values. NET-02: remove internet access from API processes and confirm committed purchases still enqueue; workers surface partner outages without dropping records.
