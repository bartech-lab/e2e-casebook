import { expect, join, test, type Sandbox } from '../fixtures.ts';
import type { Page } from '@playwright/test';

async function freezeDate(page: Page, iso: string) {
  await page.addInitScript((fixed) => {
    const RealDate = Date;
    const now = new RealDate(fixed).getTime();
    class FrozenDate extends RealDate {
      constructor(...args: unknown[]) {
        super(...((args.length ? args : [now]) as []));
      }
      static override now() {
        return now;
      }
    }
    globalThis.Date = FrozenDate as DateConstructor;
  }, iso);
}

async function boardWith(page: Page, sandbox: Sandbox, dueDate: string) {
  await sandbox.seedCards([{ title: 'Pay the invoice', dueDate }]);
  await join(page, sandbox, 'alice', 'board');
  return page.getByRole('listitem').filter({ hasText: 'Pay the invoice' }).getByTestId('due');
}

test.describe('Los Angeles', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  test('late evening is still today (Date frozen by an init script)', async ({ page, sandbox }) => {
    await freezeDate(page, '2026-03-10T23:30:00-07:00');
    await expect(await boardWith(page, sandbox, '2026-03-10')).toHaveText('Due today');
  });
});

test.describe('Warsaw', () => {
  test.use({ timezoneId: 'Europe/Warsaw' });
  test('two days across spring DST (Date frozen by an init script)', async ({ page, sandbox }) => {
    await freezeDate(page, '2026-03-28T10:00:00+01:00');
    await expect(await boardWith(page, sandbox, '2026-03-30')).toHaveText('Due in 2 days');
  });
});
