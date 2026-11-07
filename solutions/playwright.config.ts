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
  // @red specs fail against the app as shipped on purpose (a shipped bug, a trap, a decoy approach); the scorer
  // runs them, and RED=1 does too.
  grepInvert: exclude([!process.env.NAIVE && '@naive', !(process.env.RED || process.env.SCORE) && '@red']),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : 8,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: (process.env.BROWSERS ?? 'chromium').split(',').map((name) => ({
    name,
    use: { ...devices[{ chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }[name]!] },
  })),
});
