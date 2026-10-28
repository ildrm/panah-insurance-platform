import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, account: string) {
  await page.goto('/auth/sign-in');
  await page.getByRole('button', { name: account, exact: true }).click();
  await page.getByRole('button', { name: 'دریافت کد ورود', exact: true }).click();
  await page.getByRole('button', { name: 'استفاده از کد محلی', exact: true }).click();
  const factor = page.getByRole('button', { name: 'استفاده از عامل دوم محلی', exact: true });
  if (await factor.count()) await factor.click();
  await page.getByRole('button', { name: 'ورود به حساب', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|admin|org\/[^/]+)$/);
}
async function cash(page: Page) {
  const response = await page.request.get('/api/v1/finance/balances');
  expect(response.ok()).toBe(true);
  const result = await response.json();
  return result.buckets.find((row: { bucket: string }) => row.bucket === 'cash') as { balance: string; reserved: string; available: string };
}

test('wallet funding, held withdrawal, independent approval and sandbox dispatch remain distinct', async ({ browser, page }) => {
  await login(page, 'مشتری');
  await page.goto('/account/wallet-and-rewards');
  await expect(page.getByRole('heading', { name: 'موجودی و گردش حساب', exact: true })).toBeVisible();
  await expect(page.locator('.finance-workspace .metrics-grid .metric-card')).toHaveCount(4);
  const before = await cash(page);
  const funding = '120001';
  await page.getByText('آزمایش دریافت با ارائه‌دهنده ساختگی محلی', { exact: true }).click();
  await page.getByLabel('مبلغ دریافت ساختگی (ریال) *', { exact: true }).fill(funding);
  const creating = page.waitForResponse(response => response.url().endsWith('/api/v1/sandbox/finance/intents') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'ساخت درخواست دریافت آزمایشی', exact: true }).click();
  const intent = await (await creating).json();
  await expect(page.getByRole('button', { name: 'تأیید صریح پرداخت ساختگی', exact: true })).toBeVisible();
  expect((await cash(page)).balance).toBe(before.balance);
  await page.getByRole('button', { name: 'تأیید صریح پرداخت ساختگی', exact: true }).click();
  await expect(page.getByText('ارائه‌دهنده ساختگی تأیید شد. رسید را از فهرست مجاز انتخاب و در سرویس مالی ثبت کنید.', { exact: true })).toBeVisible();
  expect((await cash(page)).balance).toBe(before.balance);
  await page.getByLabel('رسید تأییدشده ارائه‌دهنده *', { exact: true }).selectOption(intent.id);
  await page.getByRole('button', { name: 'بررسی و ثبت رسید', exact: true }).click();
  await expect.poll(async () => (await cash(page)).balance).toBe((BigInt(before.balance) + BigInt(funding)).toString());
  await expect(page.getByRole('cell', { name: 'افزایش حساب', exact: true }).first()).toBeVisible();
  const payoutAmount = '10001';
  await page.getByLabel('مبلغ برداشت (ریال) *', { exact: true }).fill(payoutAmount);
  const recipient = page.getByLabel('مقصد تأییدشده سرویس *', { exact: true });
  const options = await recipient.locator('option').all();
  expect(options.length).toBeGreaterThan(1);
  await recipient.selectOption({ index: 1 });
  await page.getByLabel('دلیل درخواست *', { exact: true }).fill('درخواست برداشت ساختگی برای بررسی مستقل آزمون مرورگر');
  const requesting = page.waitForResponse(response => response.url().endsWith('/api/v1/finance/requestPayout') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'ثبت درخواست برای بررسی', exact: true }).click();
  const payoutResponse = await requesting;
  expect(payoutResponse.ok()).toBe(true);
  const payout = await payoutResponse.json();
  await expect(page.locator(`tr[data-payout-id="${payout.id}"]`)).toBeVisible();
  const held = await cash(page);
  expect(held.balance).toBe((BigInt(before.balance) + BigInt(funding)).toString());
  expect(held.reserved).toBe((BigInt(before.reserved) + BigInt(payoutAmount)).toString());
  await expect(page.getByRole('button', { name: 'تأیید مستقل', exact: true })).toHaveCount(0);

  const checkerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  try {
    const checker = await checkerContext.newPage();
    await login(checker, 'تأییدکننده');
    const session = await (await checker.request.get('/api/v1/session')).json();
    const platform = session.contexts.find((context: { kind: string }) => context.kind === 'platform');
    expect(platform).toBeTruthy();
    await checker.getByLabel('تغییر فضای کاری', { exact: true }).selectOption(platform.id);
    await expect(checker).toHaveURL('/admin');
    await checker.goto('/admin/finance');
    await checker.getByText('تأیید امنیتی برای اقدام حساس', { exact: true }).click();
    await checker.getByRole('button', { name: 'مشاهده عامل دوم حساب ساختگی', exact: true }).click();
    await checker.getByRole('button', { name: 'استفاده از کد محلی', exact: true }).click();
    await checker.getByRole('button', { name: 'تأیید امنیتی', exact: true }).click();
    await expect(checker.getByText('تأیید امنیتی این فضای کاری ثبت شد.', { exact: true })).toBeVisible();
    await checker.getByLabel('هدف بررسی صف برداشت مجاز *', { exact: true }).fill('بررسی مستقل برداشت ساختگی توسط تأییدکننده دوم آزمون');
    await checker.getByRole('button', { name: 'دریافت صف برای بررسی مستقل', exact: true }).click();
    const reviewRow = checker.locator(`tr[data-payout-id="${payout.id}"]`);
    await expect(reviewRow).toBeVisible();
    await checker.getByLabel('دلیل تأیید مستقل برداشت *', { exact: true }).first().fill('تأیید مستقل مجوز و مقصد ساختگی در آزمون مرورگر');
    await reviewRow.getByRole('button', { name: 'تأیید مستقل', exact: true }).click();
    await expect(reviewRow.getByText('تأییدشده', { exact: true })).toBeVisible();
    await expect(reviewRow.getByRole('button', { name: 'تأیید مستقل', exact: true })).toHaveCount(0);
    expect((await cash(page)).balance).toBe(held.balance);

    const admin = await adminContext.newPage();
    await login(admin, 'مدیر پلتفرم');
    await admin.goto('/admin/finance');
    await admin.getByLabel('مرجع برداشت برای پیگیری مجاز *', { exact: true }).fill(payout.id);
    await admin.getByRole('button', { name: 'دریافت برداشت مرجع', exact: true }).click();
    const dispatchRow = admin.locator(`tr[data-payout-id="${payout.id}"]`);
    await expect(dispatchRow).toBeVisible();
    await dispatchRow.getByRole('button', { name: 'ارسال نخستین پرداخت ساختگی', exact: true }).click();
    await expect(dispatchRow.getByText('پرداخت تأییدشده', { exact: true })).toBeVisible();
    await expect(dispatchRow.getByRole('button', { name: 'ارسال نخستین پرداخت ساختگی', exact: true })).toHaveCount(0);
    const after = await cash(page);
    expect(after.balance).toBe((BigInt(held.balance) - BigInt(payoutAmount)).toString());
    expect(after.reserved).toBe(before.reserved);
  } finally {
    await checkerContext.close();
    await adminContext.close();
  }
});
