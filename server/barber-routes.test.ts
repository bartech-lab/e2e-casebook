import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

const HOLD_MS = 300000;
const SLOT_IDS = ['sat-0900', 'sat-0945', 'sat-1030', 'sat-1115'];
const SLOT_LABELS = ['Saturday 09:00', 'Saturday 09:45', 'Saturday 10:30', 'Saturday 11:15'];

async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const created = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(created.statusCode, 201, `create sandbox: ${created.body}`);
  return { app, sb: created.json().id as string };
}

function api(app: App, sb: string, method: string, path: string, payload?: unknown) {
  return app.inject({ method: method as 'GET', url: `/api/s/${sb}${path}`, payload: payload as object | undefined });
}

function hook(app: App, sb: string, op: string, payload?: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: payload as object });
}

const advance = async (app: App, sb: string, ms: number) => {
  const res = await hook(app, sb, 'barber-clock', { advanceMs: ms });
  assert.equal(res.statusCode, 200, `advance: ${res.body}`);
};

const hold = (app: App, sb: string, name: string, slot: string) => api(app, sb, 'POST', '/barber/holds', { name, slot });
const book = (app: App, sb: string, name: string, slot: string) => api(app, sb, 'POST', '/barber/bookings', { name, slot });

async function slots(app: App, sb: string, name?: string) {
  const q = name === undefined ? '' : `?name=${encodeURIComponent(name)}`;
  const res = await api(app, sb, 'GET', `/barber/slots${q}`);
  assert.equal(res.statusCode, 200, `GET slots: ${res.body}`);
  return res.json() as { serverNow: number; slots: { id: string; label: string; state: string; expiresAt?: number }[] };
}

async function slot(app: App, sb: string, name: string, id: string) {
  const s = (await slots(app, sb, name)).slots.find((x) => x.id === id);
  assert.ok(s, `slot ${id} listed`);
  return s;
}

test('slots list the four slots in order with labels, all free, and a numeric serverNow', async (t) => {
  const { app, sb } = await setup(t);
  const r = await slots(app, sb, 'Ann');
  assert.equal(typeof r.serverNow, 'number');
  assert.deepEqual(r.slots.map((s) => s.id), SLOT_IDS);
  assert.deepEqual(r.slots.map((s) => s.label), SLOT_LABELS);
  assert.deepEqual(r.slots.map((s) => s.state), ['free', 'free', 'free', 'free']);
  const anon = await slots(app, sb);
  assert.deepEqual(anon.slots.map((s) => s.state), ['free', 'free', 'free', 'free']);
});

test('a hold is mine with expiresAt for the holder and held without expiresAt for others', async (t) => {
  const { app, sb } = await setup(t);
  const res = await hold(app, sb, 'Ann', 'sat-0900');
  assert.equal(res.statusCode, 200, res.body);
  const h = res.json();
  assert.equal(h.expiresAt, h.serverNow + HOLD_MS);

  const mine = await slot(app, sb, 'Ann', 'sat-0900');
  assert.equal(mine.state, 'mine');
  assert.equal(mine.expiresAt, h.expiresAt);

  const theirs = await slot(app, sb, 'Ben', 'sat-0900');
  assert.equal(theirs.state, 'held');
  assert.equal(theirs.expiresAt, undefined);

  const anon = await slots(app, sb);
  assert.equal(anon.slots[0]?.state, 'held');
  assert.equal(anon.slots[1]?.state, 'free');
});

test('Ben gets 409 taken on Ann live hold, and succeeds once the hold expires', async (t) => {
  const { app, sb } = await setup(t);
  assert.equal((await hold(app, sb, 'Ann', 'sat-0900')).statusCode, 200);
  await advance(app, sb, 299000);
  const blocked = await hold(app, sb, 'Ben', 'sat-0900');
  assert.equal(blocked.statusCode, 409);
  assert.deepEqual(blocked.json(), { error: 'taken' });
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'held');

  await advance(app, sb, 2000);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'free');
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'free');
  const ok = await hold(app, sb, 'Ben', 'sat-0900');
  assert.equal(ok.statusCode, 200, ok.body);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'mine');
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'held');
});

test('expiry boundary: advancing exactly expiresAt minus serverNow expires the hold', async (t) => {
  const { app, sb } = await setup(t);
  const h = (await hold(app, sb, 'Ann', 'sat-0900')).json();
  await advance(app, sb, h.expiresAt - h.serverNow);
  const after = await slots(app, sb, 'Ann');
  assert.ok(after.serverNow >= h.expiresAt);
  assert.equal(after.slots[0]?.state, 'free');
  assert.equal(after.slots[0]?.expiresAt, undefined);
  assert.equal((await book(app, sb, 'Ann', 'sat-0900')).statusCode, 409);
});

test('a hold just short of expiry is still live and can be booked', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  await advance(app, sb, 299000);
  const s = await slot(app, sb, 'Ann', 'sat-0900');
  assert.equal(s.state, 'mine');
  const res = await book(app, sb, 'Ann', 'sat-0900');
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { ok: true });
});

test('holding a second slot releases my first hold but not other people holds', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  await hold(app, sb, 'Ben', 'sat-1030');
  assert.equal((await hold(app, sb, 'Ann', 'sat-0945')).statusCode, 200);

  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'free');
  assert.equal((await slot(app, sb, 'Ann', 'sat-0945')).state, 'mine');
  assert.equal((await slot(app, sb, 'Ann', 'sat-1030')).state, 'held');
  assert.equal((await slot(app, sb, 'Ben', 'sat-1030')).state, 'mine');
  assert.equal((await book(app, sb, 'Ann', 'sat-0900')).statusCode, 409);
  assert.equal((await book(app, sb, 'Ben', 'sat-1030')).statusCode, 200);
});

test('re-holding my own live hold extends expiry and keeps it live past the original', async (t) => {
  const { app, sb } = await setup(t);
  const first = (await hold(app, sb, 'Ann', 'sat-0900')).json();
  await advance(app, sb, 200000);
  const again = await hold(app, sb, 'Ann', 'sat-0900');
  assert.equal(again.statusCode, 200, again.body);
  const second = again.json();
  assert.equal(second.expiresAt, second.serverNow + HOLD_MS);
  assert.ok(second.expiresAt - first.expiresAt >= 199000);

  await advance(app, sb, 200000);
  const s = await slot(app, sb, 'Ann', 'sat-0900');
  assert.equal(s.state, 'mine');
  assert.equal(s.expiresAt, second.expiresAt);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'held');
  assert.equal((await book(app, sb, 'Ann', 'sat-0900')).statusCode, 200);
});

test('booking someone else hold or booking without a hold is 409 expired', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  const stolen = await book(app, sb, 'Ben', 'sat-0900');
  assert.equal(stolen.statusCode, 409);
  assert.deepEqual(stolen.json(), { error: 'expired' });
  const none = await book(app, sb, 'Ben', 'sat-1115');
  assert.equal(none.statusCode, 409);
  assert.deepEqual(none.json(), { error: 'expired' });
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine');
  assert.equal((await slot(app, sb, 'Ben', 'sat-1115')).state, 'free');
});

test('booking consumes the hold: slot is mine-booked for me, booked for others, and holds on it are 409 taken', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  const res = await book(app, sb, 'Ann', 'sat-0900');
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { ok: true });

  const again = await book(app, sb, 'Ann', 'sat-0900');
  assert.equal(again.statusCode, 409);
  assert.deepEqual(again.json(), { error: 'expired' });

  const mine = await slot(app, sb, 'Ann', 'sat-0900');
  assert.equal(mine.state, 'mine-booked');
  assert.equal(mine.expiresAt, undefined);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'booked');
  assert.equal((await slots(app, sb)).slots[0]?.state, 'booked');

  for (const who of ['Ann', 'Ben']) {
    const h = await hold(app, sb, who, 'sat-0900');
    assert.equal(h.statusCode, 409);
    assert.deepEqual(h.json(), { error: 'taken' });
  }

  await advance(app, sb, HOLD_MS * 2);
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine-booked');
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'booked');
});

test('booking another slot after booking one still works and keeps the first booked', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  await book(app, sb, 'Ann', 'sat-0900');
  assert.equal((await hold(app, sb, 'Ann', 'sat-1115')).statusCode, 200);
  assert.equal((await book(app, sb, 'Ann', 'sat-1115')).statusCode, 200);
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine-booked');
  assert.equal((await slot(app, sb, 'Ann', 'sat-1115')).state, 'mine-booked');
});

test('names are trimmed so padded and plain names are the same person', async (t) => {
  const { app, sb } = await setup(t);
  assert.equal((await hold(app, sb, '  Ann  ', 'sat-0900')).statusCode, 200);
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine');
  assert.equal((await hold(app, sb, 'Ann', 'sat-0900')).statusCode, 200);
  assert.equal((await book(app, sb, ' Ann ', 'sat-0900')).statusCode, 200);
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine-booked');
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'booked');
});

test('hold validation: blank name and unknown slot are 400, missing fields too', async (t) => {
  const { app, sb } = await setup(t);
  const msg = { error: 'name and a known slot are required' };
  for (const body of [
    { name: 'Ann', slot: 'sat-1200' },
    { name: '   ', slot: 'sat-0900' },
    { name: '', slot: 'sat-0900' },
    { slot: 'sat-0900' },
    { name: 'Ann' },
    { name: 'Ann', slot: 'SAT-0900' },
  ]) {
    const res = await api(app, sb, 'POST', '/barber/holds', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), msg);
  }
  assert.deepEqual((await slots(app, sb, 'Ann')).slots.map((s) => s.state), ['free', 'free', 'free', 'free']);
});

test('booking validation: blank name or missing slot is 400 name and slot are required', async (t) => {
  const { app, sb } = await setup(t);
  const msg = { error: 'name and slot are required' };
  for (const body of [{ name: '  ', slot: 'sat-0900' }, { name: 'Ann' }, { slot: 'sat-0900' }, { name: 'Ann', slot: 5 }]) {
    const res = await api(app, sb, 'POST', '/barber/bookings', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), msg);
  }
});

test('clock advances are cumulative and invalid advances are 400 without moving the clock', async (t) => {
  const { app, sb } = await setup(t);
  const h = (await hold(app, sb, 'Ann', 'sat-0900')).json();
  await advance(app, sb, 150000);
  await advance(app, sb, 0);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'held');
  const mid = await slots(app, sb, 'Ben');
  assert.ok(mid.serverNow >= h.serverNow + 150000);
  assert.ok(mid.serverNow < h.serverNow + 150000 + 100000);

  for (const body of [{ advanceMs: -1 }, { advanceMs: 'abc' }, {}, { advanceMs: null }]) {
    const res = await hook(app, sb, 'barber-clock', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), { error: 'advanceMs must be a number of ms' });
  }
  const after = await slots(app, sb, 'Ben');
  assert.ok(after.serverNow < h.serverNow + 150000 + 100000);
  assert.equal(after.slots[0]?.state, 'held');

  await advance(app, sb, 150000);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'free');
});

test('serverNow moves forward by the advanced amount', async (t) => {
  const { app, sb } = await setup(t);
  const a = (await slots(app, sb)).serverNow;
  await advance(app, sb, 1000000);
  const b = (await slots(app, sb)).serverNow;
  assert.ok(b - a >= 1000000);
  assert.ok(b - a < 1000000 + 100000);
});

test('reset clears holds, bookings and the clock offset', async (t) => {
  const { app, sb } = await setup(t);
  await hold(app, sb, 'Ann', 'sat-0900');
  await hold(app, sb, 'Ben', 'sat-0945');
  await book(app, sb, 'Ben', 'sat-0945');
  const before = (await slots(app, sb)).serverNow;
  await advance(app, sb, 5000000);

  const res = await hook(app, sb, 'reset');
  assert.ok(res.statusCode < 300, res.body);
  const r = await slots(app, sb, 'Ann');
  assert.deepEqual(r.slots.map((s) => s.state), ['free', 'free', 'free', 'free']);
  assert.ok(r.serverNow - before < 1000000);
  assert.equal((await hold(app, sb, 'Ben', 'sat-0900')).statusCode, 200);
  assert.equal((await hold(app, sb, 'Ann', 'sat-0945')).statusCode, 200);
});

test('sandboxes are independent for holds, bookings, clock and reset', async (t) => {
  const { app, sb } = await setup(t);
  const other = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  await hold(app, sb, 'Ann', 'sat-0900');
  await hold(app, other, 'Ben', 'sat-0900');
  await book(app, other, 'Ben', 'sat-0900');
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'held');
  assert.equal((await slot(app, other, 'Ann', 'sat-0900')).state, 'booked');

  await advance(app, other, HOLD_MS * 2);
  assert.equal((await slot(app, sb, 'Ben', 'sat-0900')).state, 'held');

  await hook(app, other, 'reset');
  assert.equal((await slot(app, other, 'Ann', 'sat-0900')).state, 'free');
  assert.equal((await slot(app, sb, 'Ann', 'sat-0900')).state, 'mine');
});
