import { expect, join, test } from '../fixtures.ts';

const localDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('badges with the real clock and the machine time zone', async ({ page, sandbox }) => {
  await sandbox.seedCards([
    { title: 'Due today card', dueDate: localDate(0) },
    { title: 'Due tomorrow card', dueDate: localDate(1) },
    { title: 'Overdue card', dueDate: localDate(-1) },
  ]);
  await join(page, sandbox, 'alice', 'board');
  const badge = (title: string) => page.getByRole('listitem').filter({ hasText: title }).getByTestId('due');
  await expect(badge('Due today card')).toHaveText('Due today');
  await expect(badge('Due tomorrow card')).toHaveText('Due tomorrow');
  await expect(badge('Overdue card')).toHaveText('Overdue');
});
