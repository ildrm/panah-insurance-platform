import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

async function login(page: Page, account = 'مشتری') {
  await page.goto('/auth/sign-in');
  await page.getByRole('button', { name: account, exact: true }).click();
  await page.getByRole('button', { name: 'دریافت کد ورود', exact: true }).click();
  await page.getByRole('button', { name: 'استفاده از کد محلی', exact: true }).click();
  const secondFactor = page.getByRole('button', { name: 'استفاده از عامل دوم محلی', exact: true });
  if (account === 'مدیر پلتفرم') await expect(secondFactor).toBeVisible();
  if (await secondFactor.count()) await secondFactor.click();
  await page.getByRole('button', { name: 'ورود به حساب', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|admin|ops|seller|partner|org\/[^/]+)$/);
}

test('B2C buyer completes real application, comparison, verified local payment and carrier document', async ({ page }) => {
  const scripts = new Set<string>();
  const origin = new URL(process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3000').origin;
  const failedScripts: { path: string; status: number }[] = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== origin || !url.pathname.startsWith('/_next/static/') || !url.pathname.endsWith('.js')) return;
    scripts.add(url.pathname);
    if (response.status() >= 400) failedScripts.push({ path: url.pathname, status: response.status() });
  });
  await login(page);
  await page.goto('/insurance/PRD-01');
  await expect(page.getByRole('heading', { name: 'شخص ثالث خودرو', exact: true })).toBeVisible();
  await page.getByLabel('نام خودرو', { exact: true }).fill(`خودروی ساختگی آزمون ${Date.now()}`);
  await page.getByRole('button', { name: 'ثبت مشخصات', exact: true }).click();
  await expect(page.getByLabel('نام خودرو', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'استفاده از اطلاعات آزمایشی', exact: true }).click();
  await page.getByLabel('اطلاعات واردشده را بررسی کرده‌ام و برای دریافت پیشنهاد تأیید می‌کنم.', { exact: true }).check();
  await page.getByRole('button', { name: 'دریافت پیشنهادها', exact: true }).click();
  await expect(page).toHaveURL(/\/quotes\/.+\/compare$/);
  const offers = page.getByRole('link', { name: 'بررسی و انتخاب', exact: true });
  await expect(offers.first()).toBeVisible();
  await expect.poll(() => offers.count()).toBeGreaterThanOrEqual(2);
  await offers.first().click();
  await expect(page.getByRole('heading', { name: 'بررسی نهایی سفارش', exact: true })).toBeVisible();
  await page.getByLabel('سمت و اختیار لازم برای درخواست بیمه برای اشخاص و دارایی‌های این سفارش را دارم.', { exact: true }).check();
  await page.getByLabel('مبلغ، پوشش و شرایط پیشنهاد انتخاب‌شده را بررسی کرده و تأیید می‌کنم.', { exact: true }).check();
  await page.getByRole('button', { name: 'ثبت سفارش و ادامه', exact: true }).click();
  await expect(page).toHaveURL(/\/orders\/.+$/);
  await expect(page.getByRole('heading', { name: 'وضعیت سفارش شما', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ورود به پرداخت آزمایشی', exact: true }).click();
  await expect(page).toHaveURL(/\/sandbox\/payments\/.+$/);
  await page.getByRole('button', { name: 'تأیید پرداخت ساختگی', exact: true }).click();
  await page.getByRole('link', { name: 'پیگیری سفارش', exact: true }).click();
  await expect(page.getByRole('link', { name: 'مشاهده بیمه‌نامه', exact: true })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('link', { name: 'مشاهده بیمه‌نامه', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'بیمه‌نامه و مدارک', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'دریافت مدرک بیمه‌نامه', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  const nextRoot = path.resolve(__dirname, '../../apps/web/.next');
  const missing: string[] = [];
  const assets: { path: string; gzip_bytes: number; sha256: string }[] = [];
  for (const script of [...scripts].sort()) {
    const file = path.resolve(nextRoot, script.slice('/_next/'.length));
    if (!file.startsWith(path.join(nextRoot, 'static') + path.sep)) throw new Error('Invalid observed static asset path');
    try {
      const bytes = await readFile(file);
      assets.push({ path: script, gzip_bytes: gzipSync(bytes, { level: 6 }).length, sha256: createHash('sha256').update(bytes).digest('hex') });
    } catch { missing.push(script); }
  }
  const total = assets.reduce((sum, asset) => sum + asset.gzip_bytes, 0);
  const reportPath = path.resolve(__dirname, '../../docs/09-performance/evidence/purchase-journey-bundle.json');
  await mkdir(path.dirname(reportPath), { recursive: true });
  const pass = assets.length > 0 && total <= 750 * 1024 && !missing.length && !failedScripts.length;
  await writeFile(reportPath, JSON.stringify({ id: 'PERF-JS-PURCHASE-JOURNEY-LOCAL', status: 'partial', measured_at: new Date().toISOString(), runtime: process.version, build: 'Next.js production', budget_kib: 750, initial_and_journey_js_gzip_bytes: total, initial_and_journey_js_gzip_kib: Math.round(total / 1024 * 100) / 100, asset_count: assets.length, pass, stages: ['OTP authentication', 'owned asset and schema form', 'quote fan-out and comparison', 'checkout declarations', 'order', 'explicit sandbox payment confirmation', 'policy and carrier PDF'], methodology: 'Union of same-origin /_next/static/*.js responses observed by the actual B2C browser test, including visible-link prefetches; each matching production file gzip level6 once.', limitations: ['Compressed asset union estimate, not actual wire transfer bytes', 'One local synthetic journey with the installed Chrome browser', 'No field LCP, INP, CLS or representative network/device qualification'], failed_script_responses: failedScripts, missing_files: missing, assets }, null, 2) + '\n');
  expect(missing).toEqual([]);
  expect(failedScripts).toEqual([]);
  expect(assets.length).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(750 * 1024);
});

test('privileged MFA and feature maker-checker UI preserve mandatory foundations', async ({ page }) => {
  await login(page, 'مدیر پلتفرم');
  await page.goto('/admin/features');
  await expect(page.getByRole('heading', { name: 'کنترل مستقل کانال‌ها و قابلیت‌ها', exact: true })).toBeVisible();
  await expect(page.locator('.flag-card:disabled').first()).toBeVisible();
  const mode = page.locator('.flag-card').filter({ hasText: /^sales\.b2c/ });
  await expect(mode).toHaveCount(1);
  {
    await mode.click();
    await page.getByLabel('دلیل تغییر', { exact: true }).fill('آزمون مستقل پیشنهاد کنترل کانال در محیط ساختگی');
    await page.getByRole('button', { name: 'ثبت پیشنهاد برای تأیید', exact: true }).click();
    await expect(page.getByText('پیشنهاددهنده نمی‌تواند تأیید کند').first()).toBeVisible();
  }
});

test('mobile public experience has RTL landmarks and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /بیمه‌تان را/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'فهرست', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'پیمایش اصلی', exact: true })).toBeVisible();
  await page.screenshot({path:'artifacts/e2e/public-mobile.png',fullPage:true});
});
test('offline navigation shows public guidance and never caches private API responses', async({page,context})=>{
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cachedPaths=await page.evaluate(async()=>{const paths:string[]=[];for(const name of await caches.keys()){if(!name.startsWith('panah-public-shell-'))continue;for(const request of await (await caches.open(name)).keys())paths.push(new URL(request.url).pathname);}return paths;});
  expect(cachedPaths.sort()).toEqual(['/icon.svg','/offline']);
  await context.setOffline(true);
  await page.goto('/account/policies');
  await expect(page.getByRole('heading',{name:'برای این کار، ارتباط لازم است',exact:true})).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(0);
  await context.setOffline(false);
});

test('anonymous private route shows no policy rows', async ({ page }) => {
  await page.goto('/account/policies');
  await expect(page.getByRole('heading', { name: 'برای ادامه وارد حساب خود شوید', exact: true })).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(0);
});
