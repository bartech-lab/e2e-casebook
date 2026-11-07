import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const exclude = (tags: (string | false)[]) => {
  const kept = tags.filter((t): t is string => !!t);
  return kept.length ? new RegExp(kept.join('|')) : undefined;
};

export default defineConfig({
  testDir: 'cases',
  globalSetup: './global-setup.ts',
  // @naive specs demonstrate an anti-pattern and fail by design; run them with NAIVE=1.
  grepInvert: exclude([!process.env.NAIVE && '@naive']),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : 8,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', actionTimeout: 10_000 },
  projects: (process.env.BROWSERS ?? 'chromium').split(',').map((name) => ({
    name,
    use: { ...devices[{ chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }[name]!] },
  })),
});
