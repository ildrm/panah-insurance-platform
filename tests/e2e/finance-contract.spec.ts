import { test, expect } from '@playwright/test';
import { FinanceClient } from '../../packages/api-client/src/finance';

const m = (amount: string) => ({ amount, currency: 'IRR', unit: 'rial' });
const resource = (data: Record<string, unknown>) => ({ id: 'synthetic-resource', kind: 'installment', state: 'active', version: 3, data, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z' });
test('finance client decodes nested resources and preserves approved installment components', async () => {
  const response = { items: [resource({ agreementReference: 'verified-agreement', termsVersion: 'terms-1', total: m('120'), downPayment: m('20'), downPaymentState: 'paid', paidAmount: '25', lines: [{ id: 'line-1', dueDate: '2026-11-01', principal: m('90'), financingCost: m('5'), fee: m('5'), total: m('100'), paidAmount: '5', outstanding: m('95'), status: 'partially_paid' }] })], nextCursor: null, asOf: '2026-10-28T00:00:00Z' };
  const client = new FinanceClient({ request: async () => response });
  const page = await client.installments();
  expect(page.items[0]).toMatchObject({ version: 3, total: m('120'), downPayment: m('20'), paid: m('25'), termsVersion: 'terms-1' });
  expect(page.items[0]?.rows[0]).toMatchObject({ principal: m('90'), financingCost: m('5'), fee: m('5'), paid: m('5'), outstanding: m('95'), state: 'partially_paid' });
  expect(page.nextCursor).toBeNull();
});

test('finance statement keeps each bucket and debit or credit instead of inventing a grand total', async () => {
  const client = new FinanceClient({ request: async () => ({ items: [{ ...resource({ sourceReference: 'verified-receipt', changes: [{ bucket: 'cash', direction: 'credit', amount: m('30') }, { bucket: 'promo', direction: 'debit', amount: m('10') }] }), kind: 'wallet_entry', state: 'posted' }], nextCursor: 'opaque-next' }) });
  const page = await client.entries();
  expect(page.items).toHaveLength(2);
  expect(page.items.map(row => [row.bucket, row.direction, row.amount.amount])).toEqual([['cash', 'credit', '30'], ['promo', 'debit', '10']]);
  expect(page.nextCursor).toBe('opaque-next');
});

test('finance boundary rejects missing balances and noncash payout responses', async () => {
  const invalidBalance = new FinanceClient({ request: async () => ({ currency: 'IRR', unit: 'rial', buckets: [{ bucket: 'cash', balance: '10', reserved: '0' }] }) });
  await expect(invalidBalance.balances()).rejects.toThrow();
  const invalidPayout = new FinanceClient({ request: async () => ({ items: [resource({ bucket: 'promo', amount: m('10') })] }) });
  await expect(invalidPayout.payouts()).rejects.toThrow('قابل برداشت');
});
