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

test('meetings: defaults, validation boundaries, trimming, ids and reset', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const post = (body: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/meetings`, payload: { title: 'Standup', date: '2026-10-05', time: '09:00', zone: 'Europe/Warsaw', ...body } });
  const first = (await post({ title: '  Standup  ' })).json();
  assert.equal(first.id, 1);
  assert.equal(first.title, 'Standup');
  assert.equal(first.minutes, 30);
  assert.equal(first.starts.length, 1);
  assert.equal((await post({ weeks: 12 })).json().id, 2);
  for (const bad of [{ title: '   ' }, { date: '2026-10-055' }, { time: '009:00' }, { weeks: 13 }, { weeks: 0 }, { weeks: 1.5 }]) {
    assert.equal((await post(bad)).statusCode, 400, JSON.stringify(bad));
  }
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/meetings` })).json(), []);
});

test('meetings: a wall time just before the spring DST jump resolves to the right UTC instant', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const res = await app.inject({ method: 'POST', url: `/api/s/${sb}/meetings`, payload: { title: 'Night shift', date: '2026-03-29', time: '01:30', zone: 'Europe/Warsaw' } });
  assert.deepEqual(res.json().starts, ['2026-03-29T00:30:00.000Z']);
});

test('meetings: accepts current and legacy IANA names, rejects offsets', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const add = (zone: string) =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/meetings`, payload: { title: 'Call', date: '2026-10-05', time: '09:00', zone } });
  for (const [zone, start] of [
    ['Asia/Kolkata', '2026-10-05T03:30:00.000Z'],
    ['Asia/Calcutta', '2026-10-05T03:30:00.000Z'],
    ['Europe/Kyiv', '2026-10-05T06:00:00.000Z'],
    ['UTC', '2026-10-05T09:00:00.000Z'],
  ] as const) {
    const res = await add(zone);
    assert.equal(res.statusCode, 200, zone);
    assert.equal(res.json().zone, zone);
    assert.deepEqual(res.json().starts, [start]);
  }
  for (const bad of ['+01:00', 'Mars/Base', '']) assert.equal((await add(bad)).statusCode, 400, bad);
});
