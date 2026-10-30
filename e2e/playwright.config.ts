import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.SMOKE_PORT ?? 3100);

export default defineConfig({
  testDir: '.',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `TEST_HOOKS=1 PORT=${port} node server/main.ts`,
    cwd: '..',
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
  },
});
