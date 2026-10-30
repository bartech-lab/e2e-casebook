import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'cases',
  globalSetup: './global-setup.ts',
  // Specs tagged @naive demonstrate an anti-pattern and fail by design; run them with NAIVE=1.
  grepInvert: process.env.NAIVE ? undefined : /@naive/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: (process.env.BROWSERS ?? 'chromium').split(',').map((name) => ({
    name,
    use: { ...devices[{ chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }[name]!] },
  })),
});
