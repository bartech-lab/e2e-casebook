import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

async function makeApp(t: { after: (fn: () => Promise<void>) => void }): Promise<App> {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  return app;
}

async function newSandbox(app: App): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201, `create sandbox: ${res.body}`);
  return res.json().id;
}

async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  return { app, sb };
}

function api(app: App, sb: string, method: string, path: string, payload?: unknown) {
  return app.inject({
    method: method as 'GET',
    url: `/api/s/${sb}${path}`,
    payload: payload as object | undefined,
  });
}

function hook(app: App, sb: string, op: string, payload?: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: (payload ?? {}) as object });
}

async function writes(app: App, sb: string) {
  const res = await app.inject({ method: 'GET', url: `/__test__/s/${sb}/staff-writes` });
  assert.equal(res.statusCode, 200, res.body);
  return res.json().writes as any[];
}

async function timedGet(app: App, sb: string, id: number) {
  const start = Date.now();
  const res = await api(app, sb, 'GET', `/staff/${id}`);
  assert.equal(res.statusCode, 200, res.body);
  return Date.now() - start;
}

test('list has five people with id, name, role and no phone', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'GET', '/staff');
  assert.equal(res.statusCode, 200);
  const staff = res.json().staff as any[];
  assert.deepEqual(staff.map((s) => s.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(staff[0], { id: 1, name: 'Ola Nowak', role: 'Chef' });
  for (const s of staff) {
    assert.ok(!('phone' in s), `phone leaked for ${s.id}`);
    assert.deepEqual(Object.keys(s).sort(), ['id', 'name', 'role']);
  }
});

test('GET one returns the full member with phone; unknown id is 404', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'GET', '/staff/1');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { id: 1, name: 'Ola Nowak', role: 'Chef', phone: '+48 600 100 201' });
  const last = await api(app, sb, 'GET', '/staff/5');
  assert.equal(last.statusCode, 200);
  assert.equal(last.json().id, 5);
  for (const id of [0, 6, 999]) {
    const miss = await api(app, sb, 'GET', `/staff/${id}`);
    assert.equal(miss.statusCode, 404);
    assert.deepEqual(miss.json(), { error: 'No such person.' });
  }
});

test('PUT trims strings, returns the full member, and a later GET and list show it', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'PUT', '/staff/2', { name: '  Ann Kim  ', role: '  Tiler ', phone: ' +48 1 ' });
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { id: 2, name: 'Ann Kim', role: 'Tiler', phone: '+48 1' });
  const got = await api(app, sb, 'GET', '/staff/2');
  assert.deepEqual(got.json(), { id: 2, name: 'Ann Kim', role: 'Tiler', phone: '+48 1' });
  const list = (await api(app, sb, 'GET', '/staff')).json().staff as any[];
  assert.deepEqual(list[1], { id: 2, name: 'Ann Kim', role: 'Tiler' });
  assert.equal(list[0].name, 'Ola Nowak');
});

test('PUT with missing role and phone stores empty strings', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'PUT', '/staff/1', { name: 'Solo' });
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { id: 1, name: 'Solo', role: '', phone: '' });
  assert.deepEqual((await api(app, sb, 'GET', '/staff/1')).json(), { id: 1, name: 'Solo', role: '', phone: '' });
});

test('PUT with blank, whitespace-only or missing name is 400 and changes nothing', async (t) => {
  const { app, sb } = await setup(t);
  const before = (await api(app, sb, 'GET', '/staff/1')).json();
  for (const body of [{ name: '', role: 'X', phone: '1' }, { name: '   \t ', role: 'X', phone: '1' }, { role: 'X', phone: '1' }, {}]) {
    const res = await api(app, sb, 'PUT', '/staff/1', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), { error: 'Enter a name.' });
  }
  assert.deepEqual((await api(app, sb, 'GET', '/staff/1')).json(), before);
  assert.deepEqual(await writes(app, sb), []);
});

test('PUT unknown id is 404', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'PUT', '/staff/6', { name: 'Ghost', role: 'r', phone: 'p' });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.json(), { error: 'No such person.' });
  assert.deepEqual(await writes(app, sb), []);
});

test('staff-pace cycles round-robin: slow, fast, slow', async (t) => {
  const { app, sb } = await setup(t);
  const set = await hook(app, sb, 'staff-pace', { ms: [150, 0] });
  assert.ok(set.statusCode < 300, set.body);
  const first = await timedGet(app, sb, 1);
  const second = await timedGet(app, sb, 1);
  const third = await timedGet(app, sb, 1);
  const fourth = await timedGet(app, sb, 1);
  assert.ok(first >= 120, `first ${first}`);
  assert.ok(second < 100, `second ${second}`);
  assert.ok(third >= 120, `third ${third}`);
  assert.ok(fourth < 100, `fourth ${fourth}`);
});

test('staff-pace restarts the cycle when a new list is set', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'staff-pace', { ms: [0, 150] });
  const a = await timedGet(app, sb, 1);
  assert.ok(a < 100, `a ${a}`);
  await hook(app, sb, 'staff-pace', { ms: [150, 0] });
  const b = await timedGet(app, sb, 1);
  assert.ok(b >= 120, `b ${b}`);
  const c = await timedGet(app, sb, 1);
  assert.ok(c < 100, `c ${c}`);
});

test('staff-pace delays only GET /staff/:id, not the list or PUT', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'staff-pace', { ms: [150] });
  const start = Date.now();
  const list = await api(app, sb, 'GET', '/staff');
  const put = await api(app, sb, 'PUT', '/staff/1', { name: 'Fast' });
  assert.equal(list.statusCode, 200);
  assert.equal(put.statusCode, 200);
  assert.ok(Date.now() - start < 100);
});

test('staff-pace validates its list', async (t) => {
  const { app, sb } = await setup(t);
  for (const ms of [[-1], [10001], 'x', [150, -1], [0, 'a'], [1.5, 'x']]) {
    const res = await hook(app, sb, 'staff-pace', { ms });
    assert.equal(res.statusCode, 400, JSON.stringify(ms));
    assert.deepEqual(res.json(), { error: 'ms must be a list of 0 to 10000' });
  }
  const ok = await hook(app, sb, 'staff-pace', { ms: [0, 10000] });
  assert.ok(ok.statusCode < 300, ok.body);
});

test('rejected staff-pace leaves the earlier pace in force', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'staff-pace', { ms: [150] });
  const bad = await hook(app, sb, 'staff-pace', { ms: [-1] });
  assert.equal(bad.statusCode, 400);
  const d = await timedGet(app, sb, 1);
  assert.ok(d >= 120, `d ${d}`);
});

test('staff-writes records a snapshot per successful PUT, in order, immune to later PUTs', async (t) => {
  const { app, sb } = await setup(t);
  assert.deepEqual(await writes(app, sb), []);
  await api(app, sb, 'PUT', '/staff/1', { name: 'One', role: 'A', phone: '1' });
  const afterFirst = await writes(app, sb);
  assert.deepEqual(afterFirst, [{ id: 1, name: 'One', role: 'A', phone: '1' }]);
  await api(app, sb, 'PUT', '/staff/1', { name: 'Two', role: 'B', phone: '2' });
  await api(app, sb, 'PUT', '/staff/3', { name: 'Three' });
  const all = await writes(app, sb);
  assert.deepEqual(all, [
    { id: 1, name: 'One', role: 'A', phone: '1' },
    { id: 1, name: 'Two', role: 'B', phone: '2' },
    { id: 3, name: 'Three', role: '', phone: '' },
  ]);
  assert.deepEqual(afterFirst, [{ id: 1, name: 'One', role: 'A', phone: '1' }]);
});

test('reset restores the seeded roster and clears pace and writes', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'PUT', '/staff/1', { name: 'Changed', role: 'Z', phone: '9' });
  await hook(app, sb, 'staff-pace', { ms: [150] });
  const res = await hook(app, sb, 'reset');
  assert.ok(res.statusCode < 300, res.body);
  assert.deepEqual((await api(app, sb, 'GET', '/staff/1')).json(), { id: 1, name: 'Ola Nowak', role: 'Chef', phone: '+48 600 100 201' });
  assert.deepEqual(await writes(app, sb), []);
  const d = await timedGet(app, sb, 1);
  assert.ok(d < 100, `d ${d}`);
});

test('each sandbox has its own roster and writes', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await api(app, a, 'PUT', '/staff/1', { name: 'Only A', role: 'r', phone: 'p' });
  assert.equal((await api(app, a, 'GET', '/staff/1')).json().name, 'Only A');
  assert.equal((await api(app, b, 'GET', '/staff/1')).json().name, 'Ola Nowak');
  assert.equal((await writes(app, a)).length, 1);
  assert.deepEqual(await writes(app, b), []);
});
