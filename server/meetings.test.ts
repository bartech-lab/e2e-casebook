import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('meetings: weekly starts keep the wall time across DST and month ends', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const add = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/meetings`, payload });
  const weekly = (await add({ title: 'Standup', date: '2026-03-23', time: '09:00', zone: 'Europe/Warsaw', weeks: 4 })).json();
  assert.deepEqual(weekly.starts, ['2026-03-23T08:00:00.000Z', '2026-03-30T07:00:00.000Z', '2026-04-06T07:00:00.000Z', '2026-04-13T07:00:00.000Z']);
  const ny = (await add({ title: 'Sync', date: '2026-03-02', time: '10:00', zone: 'America/New_York', weeks: 2 })).json();
  assert.deepEqual(ny.starts, ['2026-03-02T15:00:00.000Z', '2026-03-09T14:00:00.000Z']);
  assert.equal((await add({ title: 'X', date: '2026-03-02', time: '10:00', zone: 'Mars/Base' })).statusCode, 400);
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/meetings` })).json().length, 2);
});
