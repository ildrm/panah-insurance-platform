export const portalDefinitions = {
  "customer": {
    "title": "حساب شخصی",
    "routes": [
      "/account",
      "/account/policies",
      "/account/quotes",
      "/account/orders",
      "/account/payments",
      "/account/installments",
      "/account/renewals",
      "/account/people-and-assets",
      "/account/claims",
      "/account/documents",
      "/account/wallet-and-rewards",
      "/account/garage",
      "/account/support",
      "/account/notifications",
      "/account/settings",
      "/account/referrals",
      "/account/vehicle-alerts",
      "/account/vehicle-utilities"
    ]
  },
  "corporate": {
    "title": "فضای سازمانی",
    "routes": [
      "/org/:orgId",
      "/org/:orgId/portfolio",
      "/org/:orgId/branches",
      "/org/:orgId/benefits",
      "/org/:orgId/census",
      "/org/:orgId/assets",
      "/org/:orgId/quotes",
      "/org/:orgId/approvals",
      "/org/:orgId/billing",
      "/org/:orgId/renewals",
      "/org/:orgId/contracts",
      "/org/:orgId/reports",
      "/org/:orgId/team",
      "/org/:orgId/settings"
    ]
  },
  "beneficiary": {
    "title": "پوشش کارکنان",
    "routes": [
      "/benefits",
      "/benefits/:enrollmentId/coverage",
      "/benefits/dependents",
      "/benefits/certificates",
      "/benefits/claims",
      "/benefits/providers",
      "/benefits/changes",
      "/benefits/support",
      "/benefits/notifications",
      "/benefits/settings"
    ]
  },
  "seller": {
    "title": "فضای فروشنده",
    "routes": [
      "/seller",
      "/seller/onboarding",
      "/seller/leads",
      "/seller/customers",
      "/seller/quotes",
      "/seller/orders",
      "/seller/portfolio",
      "/seller/renewals",
      "/seller/team",
      "/seller/commissions",
      "/seller/wallet",
      "/seller/withdrawals",
      "/seller/training",
      "/seller/reports",
      "/seller/settings"
    ]
  },
  "carrier": {
    "title": "فضای بیمه‌گر",
    "routes": [
      "/partner",
      "/partner/submissions",
      "/partner/underwriting",
      "/partner/issuance",
      "/partner/portfolio",
      "/partner/product-proposals",
      "/partner/claims",
      "/partner/settlements",
      "/partner/api-transactions",
      "/partner/service-orders",
      "/partner/team",
      "/partner/settings"
    ]
  },
  "admin": {
    "title": "مدیریت پلتفرم",
    "routes": [
      "/admin",
      "/admin/features",
      "/admin/organizations",
      "/admin/catalog",
      "/admin/underwriting",
      "/admin/orders-policies",
      "/admin/finance",
      "/admin/claims-support",
      "/admin/corporate",
      "/admin/commissions",
      "/admin/marketing",
      "/admin/automotive",
      "/admin/integrations",
      "/admin/reports",
      "/admin/security-audit",
      "/admin/settings"
    ]
  },
  "operations": {
    "title": "میز عملیات",
    "routes": [
      "/ops",
      "/ops/underwriting",
      "/ops/inspections",
      "/ops/issuance",
      "/ops/reconciliation",
      "/ops/refunds-settlements",
      "/ops/claims",
      "/ops/support",
      "/ops/import-export",
      "/ops/fulfillment",
      "/ops/partner-exceptions",
      "/ops/knowledge",
      "/ops/notifications",
      "/ops/settings",
      "/ops/policy-delivery",
      "/ops/policy-changes"
    ]
  }
} as const;
export type PortalSurface = keyof typeof portalDefinitions;
