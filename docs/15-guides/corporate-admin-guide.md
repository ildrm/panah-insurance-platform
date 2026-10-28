---
{
  "id": "GUIDE-CORPORATE",
  "title": "Corporate administrator guide",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
  "reviewer_roles": [
    "R04",
    "R11",
    "R13",
    "R20"
  ],
  "scope_ids": [
    "DSH-02",
    "ORG-02",
    "ORG-03",
    "ORG-04"
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

# Corporate administrator guide

## Establish organization and role scope

Select the organization explicitly and confirm the branch/cost-center scope shown in the header. A user can belong to several organizations and also hold private policies; corporate access does not include those personal records. Invite members into the smallest role and resource scope needed. Privileged grants require the configured checker. Revoking membership must remove access to open exports and future actions, not merely hide the menu.

## Prepare a census or asset schedule

Download the current import schema and use synthetic data for testing. In production, use only authorized employee/dependent/asset fields. Upload through the clean-scanned import flow, identify the schema/source/effective date and wait for validation. The preview lists row errors, duplicate identities, proposed additions/removals and accepted/rejected counts. Correct errors or explicitly choose an allowed partial policy. Changing the file, roster or effective dates creates a new version and can invalidate an approval.

HR synchronization has the same authority and effective-date rules as manual imports. Resolve conflicts through a new preview; do not overwrite a newer manual change silently. A row being accepted by the platform does not mean the insurer has issued coverage. Track insurer acknowledgment and individual certificates separately.

## Request, approve and pay

Request a group/commercial proposal using the approved schedule version. Compare equivalent census, benefits, deviations and billing terms. The requester records budget/cost-center allocations and proposed payment/credit/invoice arrangement. A distinct checker reviews the exact proposal version, amount, terms and delegated limit. Changing roles does not make the same person an independent checker.

Approved credit/invoice commitment is not cash receipt. Finance sees the corresponding invoice, allocations and exposure; direct payment uses authoritative provider verification. Monitor separate commitment, payment, submission and issuance statuses. Never tell employees that enrollment is effective solely because the employer paid or uploaded a roster.

## Manage benefits and reporting

Joiners, leavers and dependent changes have requested/approved/effective dates. Use the contract's window and change workflow; employment changes do not automatically rewrite insurer-confirmed coverage. Renewals reconcile current census/assets and require fresh offers. Keep employee certificate and claim servicing available for valid entitlements even when new corporate sales are disabled.

Employer reporting excludes individual medical claims, diagnoses, attachments and unrelated personal policies. Aggregate health reports apply proposed cohort and complementary suppression rules; a blank/suppressed cell is a privacy control, not permission to reconstruct it through successive filters. Exports need a purpose and allowed fields; downloads recheck current organization and permission.

Use the [corporate dashboard](../03-experience/dashboards/corporate.md) for route, role, table and error details. R20 support handles enrollment exceptions; finance handles billing differences; restricted claims staff handles private cases. Do not place medical details in general corporate tickets. This guide describes the draft operating model; real contracts and delegated limits require approval.
