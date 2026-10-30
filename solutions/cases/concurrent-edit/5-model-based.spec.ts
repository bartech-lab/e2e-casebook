import fc from 'fast-check';
import { expect, join, test } from '../fixtures.ts';

type Step = 'bobTypes' | 'aliceSaves' | 'bobSaves' | 'keepMine' | 'useTheirs';

const steps = fc.array(
  fc.constantFrom<Step>('bobTypes', 'bobTypes', 'aliceSaves', 'bobSaves', 'bobSaves', 'keepMine', 'useTheirs'),
  { minLength: 2, maxLength: 12 },
);

test('random interleavings of two editors match a model of If-Match', async ({ page, sandbox }) => {
  await join(page, sandbox, 'bob', 'cards/1');
  let run = 0;
  await fc.assert(
    fc.asyncProperty(steps, async (plan) => {
      run++;
      await sandbox.reset();
      await page.reload();
      const title = page.getByLabel('Title');
      const conflictBox = page.getByRole('alert', { name: 'Conflict' });
      const start = await sandbox.card(1);
      const server = { title: start.title, version: start.version };
      let base = server.version;
      let draft = server.title;
      let conflict: { title: string; version: number } | null = null;
      let n = 0;
      await expect(title).toHaveValue(draft);

      for (const s of plan) {
        if (s === 'bobTypes') {
          draft = `Bob ${run}.${++n}`;
          await title.fill(draft);
        } else if (s === 'aliceSaves') {
          const next = `Alice ${run}.${++n}`;
          expect(await sandbox.patchCard(1, { title: next, by: 'alice' })).toBe(200);
          server.title = next;
          server.version++;
        } else if (s === 'bobSaves') {
          if (conflict) continue;
          await page.getByRole('button', { name: 'Save' }).click();
          if (base === server.version) {
            server.title = draft;
            server.version++;
            base = server.version;
            await expect(page.getByRole('status')).toHaveText('Saved.');
          } else {
            conflict = { ...server };
          }
        } else if (s === 'keepMine') {
          if (!conflict) continue;
          await conflictBox.getByRole('button', { name: 'Keep mine' }).click();
          if (conflict.version === server.version) {
            server.title = draft;
            server.version++;
            base = server.version;
            conflict = null;
            await expect(page.getByRole('status')).toHaveText('Saved.');
          } else {
            conflict = { ...server };
          }
        } else {
          if (!conflict) continue;
          await conflictBox.getByRole('button', { name: 'Use theirs' }).click();
          draft = conflict.title;
          base = conflict.version;
          conflict = null;
        }

        await expect(title).toHaveValue(draft);
        if (conflict) await expect(conflictBox).toContainText(conflict.title);
        else await expect(conflictBox).toHaveCount(0);
        await expect.poll(async () => {
          const c = await sandbox.card(1);
          return { title: c.title, version: c.version };
        }).toEqual(server);
      }
    }),
    { seed: 20261022, numRuns: 60, endOnFailure: true },
  );
});
