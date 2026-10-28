import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function login(page: Page, account: string) {
  await page.goto('/auth/sign-in');
  await page.getByRole('button', { name: account, exact: true }).click();
  await page.getByRole('button', { name: 'دریافت کد ورود', exact: true }).click();
  await page.getByRole('button', { name: 'استفاده از کد محلی', exact: true }).click();
  await page.getByRole('button', { name: 'استفاده از عامل دوم محلی', exact: true }).click();
  await page.getByRole('button', { name: 'ورود به حساب', exact: true }).click();
  await expect(page).toHaveURL(/\/(admin|org\/[^/]+)$/);
}
test('scoped editor preserves mandatory controls, labels hypothetical preview and denies maker authority', async ({ page, browser }) => {
  await login(page, 'مدیر پلتفرم');
  await page.goto('/admin/features');
  await page.getByRole('button', { name: 'قواعد دامنه‌دار و نسخه‌ها', exact: true }).click();
  const panel = page.getByRole('region', { name: 'قواعد دامنه‌دار', exact: true });
  await expect(panel.getByRole('heading', { name: 'قواعد دامنه‌دار و نسخه‌های پیکربندی', exact: true })).toBeVisible();
  const before = await (await page.request.get('/api/v1/controls/current')).json();
  const session = await (await page.request.get('/api/v1/session')).json();
  const builder = panel.getByRole('form', { name: 'سازنده قاعده دامنه‌دار', exact: true });
  await builder.getByLabel('کنترل ثبت‌شده *', { exact: true }).selectOption('feature.CHN-04.enabled');
  await expect(builder.getByLabel('اجازه مشروط در این دامنه', { exact: true })).toBeChecked();
  await expect(builder.getByLabel('اجازه مشروط در این دامنه', { exact: true })).toBeDisabled();
  await expect(builder.getByLabel('درصد انتشار پایدار *', { exact: true })).toBeDisabled();
  await builder.getByLabel('کنترل ثبت‌شده *', { exact: true }).selectOption('feature.AUTO-08.enabled');
  await builder.getByLabel('دامنه سراسری، بدون شرط دیگر', { exact: true }).uncheck();
  await builder.getByLabel('محصول', { exact: true }).selectOption('PRD-24');
  await builder.getByLabel('کانال فروش', { exact: true }).selectOption('commercial');
  await builder.getByLabel('آغاز اعتبار به UTC *', { exact: true }).fill('2099-02-31T00:00:00Z');
  await builder.getByRole('button', { name: 'افزودن قاعده به پیشنهاد', exact: true }).click();
  await expect(builder.getByText('تاریخ تقویمی واردشده معتبر نیست.', { exact: true })).toBeVisible();
  await builder.getByLabel('آغاز اعتبار به UTC *', { exact: true }).fill('2099-01-01T00:00:00Z');
  await builder.getByRole('button', { name: 'افزودن قاعده به پیشنهاد', exact: true }).click();
  await panel.getByLabel('دلیل پیشنهاد دامنه‌دار *', { exact: true }).fill('آزمون پیشنهاد محدود و فرضی برای کنترل منفی بدون انتشار نسخه');
  const proposing = page.waitForResponse(response => response.url().endsWith('/api/v1/controls/proposals') && response.request().method() === 'POST');
  await panel.getByRole('button', { name: 'ثبت پیشنهاد دامنه‌دار', exact: true }).click();
  const response = await proposing;
  expect(response.ok()).toBe(true);
  const proposal = await response.json();
  const card = panel.locator(`[data-control-proposal="${proposal.id}"]`);
  await expect(card).toBeVisible();
  await card.getByText('شبیه‌سازی اثر پیشنهاد', { exact: true }).click();
  await expect(card.getByText(/این پیش‌نمایش فقط شبیه‌سازی با داده فرضی است/)).toBeVisible();
  await card.getByLabel('محصول', { exact: true }).selectOption('PRD-24');
  await card.getByLabel('کانال فروش', { exact: true }).selectOption('commercial');
  await card.getByLabel('زمان شبیه‌سازی به UTC *', { exact: true }).fill('2099-01-02T00:00:00Z');
  await card.getByRole('button', { name: 'شبیه‌سازی همین زمینه', exact: true }).click();
  await expect(card.getByRole('cell', { name: 'متوقف در شبیه‌سازی', exact: true })).toBeVisible();
  await expect(card.getByText('منع صریح قابل اعمال', { exact: true })).toBeVisible();
  await expect(card.getByRole('heading', {name:'نتیجه آخرین شبیه‌سازی ثبت‌شده',exact:true})).toBeVisible();
  expect((await (await page.request.get('/api/v1/controls/current')).json()).revision).toBe(before.revision);
  const headers = { Origin: new URL(page.url()).origin, 'X-CSRF-Token': session.csrfToken, 'If-Match': `"${before.revision}"`, 'Idempotency-Key': randomUUID() };
  const denied = await page.request.post(`/api/v1/controls/proposals/${proposal.id}/approve`, { headers, data: { reason: 'تلاش منفی پیشنهاددهنده برای تأیید بدون اختیار مستقل' } });
  expect(denied.status()).toBe(403);
  const invalid = await page.request.post('/api/v1/controls/proposals', { headers: { ...headers, 'Idempotency-Key': randomUUID() }, data: { changes: [{ key: 'feature.AUTO-08.enabled', enabled: false, scope: { arbitraryCustomerSegment: 'forbidden' }, effectiveFrom: '2099-01-01T00:00:00Z' }], reason: 'رد دامنه دلخواه خارج از قرارداد بسته کنترل‌ها' } });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).code).toBe('validation_failed');

  const checkerContext = await browser.newContext();
  try {
    const checker = await checkerContext.newPage();
    await login(checker, 'تأییدکننده');
    const checkerSession = await (await checker.request.get('/api/v1/session')).json();
    const platform = checkerSession.contexts.find((context: { kind: string }) => context.kind === 'platform');
    await checker.getByLabel('تغییر فضای کاری', { exact: true }).selectOption(platform.id);
    await expect(checker).toHaveURL('/admin');
    await checker.goto('/admin/features');
    await checker.getByRole('button', { name: 'قواعد دامنه‌دار و نسخه‌ها', exact: true }).click();
    const checkerCard = checker.locator(`[data-control-proposal="${proposal.id}"]`);
    await expect(checkerCard.getByRole('button', { name: 'تأیید مستقل قاعده', exact: true })).toBeEnabled();
    expect((await (await checker.request.get('/api/v1/controls/current')).json()).revision).toBe(before.revision);
  } finally { await checkerContext.close(); }
});
