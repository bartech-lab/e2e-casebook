import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'runs',
  testMatch: '**/tests/**/*.spec.ts',
  retries: 0,
  timeout: 10_000,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
