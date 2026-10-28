---
{
  "id": "DOC-05-FILES-AND-DOCUMENT-SECURITY",
  "title": "Files and document security",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
  ],
  "source_refs": [
    "S00"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Files and document security

Uploads create a pending metadata record bound to authenticated subject, context, purpose and allowed media type. Upload URLs permit one object key and bounded bytes; filenames are untrusted labels. Hash and sniff content server-side, quarantine until malware/content checks pass, and reject archives or document structures that exceed scanner limits. Never allow active HTML/SVG or executable attachments as policy evidence without a separately reviewed safe rendering process.

Scanned original files remain in private object storage. Download authorization checks the current relationship and document classification before issuing a short-lived, purpose-bound link or streaming the file. Document identifiers and storage paths are opaque. An employer receives permitted certificates/aggregate documents only; medical evidence is not exposed through shared bulk exports.

Record original hash, media type, scan engine/version/result, uploader, accepted document version and retention policy. A policy PDF does not prove activation unless carrier issuance evidence is recorded. Physical delivery labels contain minimum address/recipient data and have distinct courier permissions. The [security defaults](../08-security/security-policy-defaults.json) specify proposed type/byte/pixel/file-count limits; product/partner requirements can narrow them, never silently widen them.

FILE-01 uploads malicious/oversize/mismatched types; FILE-02 swaps tenant/file IDs and reuses expired URLs; FILE-03 scanner outage keeps documents quarantined and tells the user evidence is pending; FILE-04 revokes access before download and checks authorization again. Scan and storage latency are background dependency measurements, not ordinary API read latency.
