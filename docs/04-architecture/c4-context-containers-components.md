---
{
  "id": "DOC-04-C4-CONTEXT-CONTAINERS-COMPONENTS",
  "title": "Context, containers and components",
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

# Context, containers and components

```mermaid
flowchart LR
  Person[Individual and employee] --> Store[Next storefront]
  Partner[Organization seller carrier] --> Portal[Next partner portal]
  Staff[Limited operations staff] --> Admin[Next admin]
  Store --> API[Nest API]
  Portal --> API
  Admin --> API
  API --> DB[(PostgreSQL)]
  DB --> Worker[Nest workers]
  Worker --> Carrier[Approved carrier boundary]
  Worker --> Pay[Approved payment boundary]
  Worker --> Other[HR notification logistics automotive]
  API --> Files[Private object storage]
```

```mermaid
flowchart TD
  Transport[HTTP controller or worker handler] --> App[Application use case]
  App --> Domain[Aggregate rules and value objects]
  App --> Ports[Repository and partner ports]
  SQL[SQL persistence adapter] -. implements .-> Ports
  Carrier[Carrier adapter] -. implements .-> Ports
  Domain --> Types[Owned domain types]
```

External systems are independent authorities. The payment provider confirms captured money; the insurer confirms issuance and effective coverage. Neither authority substitutes for the other. A carrier portal user is a scoped external actor, not an internal administrator. API-only carriers use the same capability and recipient policies without portal membership. Component boundaries are logical boundaries, not a requirement to create additional network services. Acceptance ARCH-C4-01: every public operation identifies one owning module and one authorized route to its data; no Next process holds transactional database credentials.
