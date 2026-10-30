import { expect, join, test, type Sandbox } from '../fixtures.ts';
import type { Page } from '@playwright/test';

async function boardWith(page: Page, sandbox: Sandbox, dueDate: string) {
  await sandbox.seedCards([{ title: 'Pay the invoice', dueDate }]);
  await join(page, sandbox, 'alice', 'board');
  return page.getByRole('listitem').filter({ hasText: 'Pay the invoice' }).getByTestId('due');
}

test.describe('Los Angeles', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });

  test('late evening is still today, although UTC is already tomorrow', async ({ page, sandbox }) => {
    await page.clock.install({ time: new Date('2026-03-10T23:30:00-07:00') });
    await expect(await boardWith(page, sandbox, '2026-03-10')).toHaveText('Due today');
  });

  test('the badge turns to Overdue when midnight passes', async ({ page, sandbox }) => {
    await page.clock.install({ time: new Date('2026-03-10T23:59:30-07:00') });
    const badge = await boardWith(page, sandbox, '2026-03-10');
    await expect(badge).toHaveText('Due today');
    await page.clock.runFor(60_000);
    await expect(badge).toHaveText('Overdue');
  });
});

test.describe('Warsaw', () => {
  test.use({ timezoneId: 'Europe/Warsaw' });

  test('two calendar days stay two days across the spring DST change', async ({ page, sandbox }) => {
    await page.clock.install({ time: new Date('2026-03-28T10:00:00+01:00') });
    await expect(await boardWith(page, sandbox, '2026-03-30')).toHaveText('Due in 2 days');
  });
});
