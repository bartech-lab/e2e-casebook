import fc from 'fast-check';
import { column, expect, join, moveCard, test, type Card } from '../fixtures.ts';

type Status = 'todo' | 'doing' | 'done';
type Outcome = 'fast' | 'slow' | 'fail';
type Move = { pick: number; to: number; outcome: Outcome };

const STATUSES: Status[] = ['todo', 'doing', 'done'];
const LABEL = { todo: 'To do', doing: 'Doing', done: 'Done' } as const;
const SLOW_MS = 1000;

const move: fc.Arbitrary<Move> = fc.record({
  pick: fc.nat(99),
  to: fc.nat(1),
  outcome: fc.constantFrom<Outcome>('fast', 'slow', 'fail'),
});
const batches = fc.array(fc.array(move, { minLength: 1, maxLength: 3 }), { minLength: 1, maxLength: 3 });

test('random batches of overlapping moves match a model of the server', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'board');
  await fc.assert(
    fc.asyncProperty(batches, async (plan) => {
      await sandbox.reset();
      await page.reload();
      const res = await page.request.get(`/api/s/${sandbox.id}/cards`);
      const { cards } = (await res.json()) as { cards: Card[] };
      const server = new Map(cards.map((c) => [c.id, c.status as Status]));
      let failures = 0;

      for (const batch of plan) {
        const shown = new Map(server);
        const clicks = batch.map((m, i) => {
          const card = cards[m.pick % cards.length]!;
          const others = STATUSES.filter((s) => s !== shown.get(card.id));
          const to = others[m.to % others.length]!;
          shown.set(card.id, to);
          return { card, to, outcome: m.outcome, i };
        });
        await sandbox.fault({
          http: clicks.map((c) => ({
            method: 'PATCH',
            path: `cards/${c.card.id}`,
            delayMs: c.outcome === 'fast' ? 0 : SLOW_MS,
            ...(c.outcome === 'fail' ? { status: 500 } : {}),
          })),
        });
        let answered = 0;
        const count = (r: { request(): { method(): string } }) => {
          if (r.request().method() === 'PATCH') answered++;
        };
        page.on('response', count);
        for (const c of clicks) await moveCard(page, c.card.title, LABEL[c.to]);
        await expect.poll(() => answered, { timeout: SLOW_MS * 5 }).toBe(clicks.length);
        page.off('response', count);

        // Moves of one card at the same speed may reach the server in either order, so any of
        // their targets is a valid end state; a fast move always lands before a slow one.
        for (const card of cards) {
          const ok = clicks.filter((c) => c.card.id === card.id && c.outcome !== 'fail');
          if (!ok.length) continue;
          const lastClass = ok.some((c) => c.outcome === 'slow') ? 'slow' : 'fast';
          const allowed = new Set(ok.filter((c) => c.outcome === lastClass).map((c) => c.to));
          const actual = (await sandbox.card(card.id)).status as Status;
          expect([...allowed], `${card.title} on the server`).toContain(actual);
          server.set(card.id, actual);
        }
        for (const card of cards) expect((await sandbox.card(card.id)).status, card.title).toBe(server.get(card.id));
        failures += clicks.filter((c) => c.outcome === 'fail').length;

        for (const s of STATUSES) {
          const titles = cards.filter((c) => server.get(c.id) === s).map((c) => c.title);
          await expect(column(page, LABEL[s])).toHaveCount(titles.length, { timeout: SLOW_MS * 4 });
          for (const t of titles) await expect(column(page, LABEL[s]).filter({ hasText: t })).toHaveCount(1);
        }
        await expect(page.getByRole('alert')).toHaveCount(failures);
      }
    }),
    { seed: 20261022, numRuns: 8, endOnFailure: true },
  );
});
