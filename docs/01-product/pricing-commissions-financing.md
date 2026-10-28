---
{
  "id": "DOC-01-PRODUCT-PRICING-COMMISSIONS-FINANCING",
  "title": "Pricing, commissions and financing",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R01",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ALL"
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

# Pricing, commissions and financing

Store money as explicit currency/unit and integer amount strings. Proposed canonical IRR amounts use integer rials. Toman display is an explicitly labeled division by ten and must preserve exact underlying amounts; display rounding cannot alter ledger values. Cross-currency conversion requires a recorded approved rate source/time and separate ledger currency groups.

An offer has premium, taxes, service fee, discount allocation, financing cost, total payable, installment schedule and validity. Reconcile line totals before commitment. Rounding policy is versioned per currency and allocation rule; residual integer units go deterministically to the largest fractional remainder with stable line-ID tie break.

Coupon budgets, financed credit limits and wallet redemption use transactional reservation/locking. Separate cash, refundable credit, commission balance and noncash promotion. Do not permit promotional balances to become withdrawable through refunds. Financed cancellation routes through provider terms; refund destination follows verified payer/contract and maker-checker controls.

Commission rates and payout timing remain unconfigured until contracts exist. Synthetic ledger examples are in [ledger and money](../05-data/ledger-and-money.md); no example is a quoted premium or approved financing arrangement.
