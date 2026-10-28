export type FinanceView = 'wallet' | 'installments' | 'commissions' | 'payouts' | 'operations' | 'billing';
export function financeView(surface: string, section: string): FinanceView | null {
  if ((surface === 'customer' && section === 'wallet-and-rewards') || (surface === 'seller' && section === 'wallet')) return 'wallet';
  if (surface === 'customer' && section === 'installments') return 'installments';
  if (surface === 'seller' && section === 'commissions') return 'commissions';
  if (surface === 'seller' && section === 'withdrawals') return 'payouts';
  if (surface === 'corporate' && section === 'billing') return 'billing';
  if (surface === 'admin' && ['finance', 'commissions'].includes(section)) return section === 'commissions' ? 'commissions' : 'operations';
  if (surface === 'operations' && ['reconciliation', 'refunds-settlements'].includes(section)) return section === 'reconciliation' ? 'operations' : 'payouts';
  return null;
}
