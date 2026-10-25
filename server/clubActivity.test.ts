import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createClubActivity } from './clubActivity.ts';

test('a sandbox shows two recent events until seeded, then exactly what was seeded', async () => {
  const feed = createClubActivity();
  const f = Fastify();
  await f.register(async (scope) => feed.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal((await f.inject({ url: '/api/s/a/club-activity' })).json().events.length, 2);
  assert.equal(feed.seed('a', [{ text: 'x', at: 'nope' }]), false);
  assert.equal(feed.seed('a', [{ text: 'Court 1 booked', at: '2026-03-12T10:00:00+01:00' }]), true);
  assert.deepEqual((await f.inject({ url: '/api/s/a/club-activity' })).json().events, [{ text: 'Court 1 booked', at: '2026-03-12T09:00:00.000Z' }]);
  assert.equal((await f.inject({ url: '/api/s/b/club-activity' })).json().events.length, 2);
});

test('club activity seeds refuse empty items, keep only text and time, and clear restores the defaults', async () => {
  const club = createClubActivity();
  const f = Fastify();
  await f.register(async (scope) => club.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal(club.seed('a', [null]), false);
  assert.equal(club.seed('a', [{ text: 'Ola won', at: '2026-10-01T10:00:00Z', secret: 'x' }]), true);
  assert.deepEqual((await f.inject({ url: '/api/s/a/club-activity' })).json().events, [{ text: 'Ola won', at: '2026-10-01T10:00:00.000Z' }]);
  club.clear('a');
  assert.equal((await f.inject({ url: '/api/s/a/club-activity' })).json().events.length, 2);
});
