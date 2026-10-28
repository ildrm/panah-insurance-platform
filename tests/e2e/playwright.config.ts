import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
export default defineConfig({
  testDir: '.', testMatch: '**/*.spec.ts', timeout: 90_000, expect: { timeout: 20_000 }, workers: 1, fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, '../../artifacts/e2e/results.json') }]],
  outputDir: path.resolve(__dirname, '../../artifacts/e2e/output'),
  use: { baseURL: process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure', ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } },
});
