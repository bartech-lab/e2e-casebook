import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

async function makeApp(t: { after: (fn: () => Promise<void>) => void }, testHooks = true): Promise<App> {
  const app = await buildApp({ dbPath: ':memory:', testHooks });
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

function api(app: App, sb: string, method: string, path: string, payload?: unknown, headers?: Record<string, string>) {
  return app.inject({
    method: method as 'GET',
    url: `/api/s/${sb}${path}`,
    payload: payload as object | undefined,
    headers,
  });
}

function hook(app: App, sb: string, op: string, payload: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: payload as object });
}

async function fault(app: App, sb: string, body: unknown) {
  const res = await hook(app, sb, 'fault', body);
  assert.ok(res.statusCode < 300, `fault hook setup failed ${res.statusCode}: ${res.body}`);
}

async function getCard(app: App, sb: string, id: number) {
  const res = await api(app, sb, 'GET', `/cards/${id}`);
  assert.equal(res.statusCode, 200, `GET card ${id}: ${res.body}`);
  return res.json();
}

async function getCards(app: App, sb: string) {
  const res = await api(app, sb, 'GET', '/cards');
  assert.equal(res.statusCode, 200, `GET cards: ${res.body}`);
  return res.json().cards as any[];
}

async function until<T>(what: string, fn: () => Promise<T | undefined | false>, deadlineMs = 3000): Promise<T> {
  const end = Date.now() + deadlineMs;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) assert.fail(`timed out after ${deadlineMs} ms waiting for: ${what}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function getExport(app: App, sb: string, id: number) {
  const res = await api(app, sb, 'GET', `/exports/${id}`);
  assert.equal(res.statusCode, 200, `GET export ${id}: ${res.body}`);
  return res.json();
}

async function startExport(app: App, sb: string) {
  const res = await api(app, sb, 'POST', '/exports');
  assert.equal(res.statusCode, 201, `POST exports: ${res.body}`);
  return res.json();
}

async function waitStatus(app: App, sb: string, id: number, status: string) {
  return until(`export ${id} status ${status}`, async () => {
    const e = await getExport(app, sb, id);
    return e.status === status ? e : undefined;
  });
}

// ---------- basics ----------

test('GET sandbox root returns id; unknown sandbox is 404 on every route', async (t) => {
  const { app, sb } = await setup(t);
  const r = await api(app, sb, 'GET', '');
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().id, sb);
  const routes: [string, string][] = [
    ['GET', ''],
    ['GET', '/cards'],
    ['GET', '/cards/1'],
    ['PATCH', '/cards/1'],
    ['POST', '/exports'],
    ['GET', '/exports'],
    ['GET', '/exports/1'],
    ['POST', '/exports/1/cancel'],
    ['POST', '/exports/1/retry'],
    ['GET', '/exports/1/file'],
  ];
  for (const [m, p] of routes) {
    const res = await api(app, 'nope-no-such-sandbox', m, p, m === 'PATCH' ? { title: 'x' } : undefined);
    assert.equal(res.statusCode, 404, `${m} ${p} on unknown sandbox -> ${res.statusCode} ${res.body}`);
  }
});

test('new sandbox has exactly 4 seed cards, ids 1..4, version 1, updatedBy seed, sorted', async (t) => {
  const { app, sb } = await setup(t);
  const cards = await getCards(app, sb);
  assert.deepEqual(cards.map((c) => c.id), [1, 2, 3, 4]);
  for (const c of cards) {
    assert.equal(c.version, 1, `card ${c.id} version`);
    assert.equal(c.updatedBy, 'seed', `card ${c.id} updatedBy`);
    assert.equal(typeof c.title, 'string');
    assert.equal(typeof c.description, 'string');
    assert.ok(['todo', 'doing', 'done'].includes(c.status), `card ${c.id} status ${c.status}`);
  }
});

test('GET card returns ETag "<version>" and 404 for unknown id', async (t) => {
  const { app, sb } = await setup(t);
  const r = await api(app, sb, 'GET', '/cards/2');
  assert.equal(r.statusCode, 200);
  assert.equal(r.headers.etag, '"1"');
  assert.equal(r.json().id, 2);
  await api(app, sb, 'PATCH', '/cards/2', { title: 'bump' });
  const r2 = await api(app, sb, 'GET', '/cards/2');
  assert.equal(r2.headers.etag, '"2"');
  assert.equal((await api(app, sb, 'GET', '/cards/999')).statusCode, 404);
  assert.equal((await api(app, sb, 'PATCH', '/cards/999', { title: 'x' })).statusCode, 404);
});

// ---------- PATCH ----------

test('PATCH increments version by exactly 1 per success, sets ETag and updatedBy (second card)', async (t) => {
  const { app, sb } = await setup(t);
  const r1 = await api(app, sb, 'PATCH', '/cards/2', { title: 'one', by: '  alice  ' });
  assert.equal(r1.statusCode, 200, r1.body);
  assert.equal(r1.json().version, 2);
  assert.equal(r1.json().updatedBy, 'alice');
  assert.equal(r1.headers.etag, '"2"');
  const r2 = await api(app, sb, 'PATCH', '/cards/2', { title: 'two' });
  assert.equal(r2.json().version, 3);
  assert.equal(r2.json().updatedBy, 'anonymous');
  assert.equal(r2.headers.etag, '"3"');
  assert.equal((await getCard(app, sb, 1)).version, 1, 'card 1 must be untouched');
  assert.equal((await getCard(app, sb, 2)).version, 3);
});

test('partial PATCH keeps fields not in the body', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'seed', { cards: [{ title: 'a', description: 'desc a', status: 'doing' }, { title: 'b', description: 'desc b', status: 'done' }] });
  const before = await getCard(app, sb, 2);
  const r = await api(app, sb, 'PATCH', '/cards/2', { status: 'todo' });
  assert.equal(r.statusCode, 200, r.body);
  assert.equal(r.json().title, 'b');
  assert.equal(r.json().description, 'desc b');
  assert.equal(r.json().status, 'todo');
  const r2 = await api(app, sb, 'PATCH', '/cards/2', { title: 'b2' });
  assert.equal(r2.json().description, 'desc b');
  assert.equal(r2.json().status, 'todo');
  const r3 = await api(app, sb, 'PATCH', '/cards/2', { description: 'd3' });
  assert.equal(r3.json().title, 'b2');
  assert.equal(before.id, 2);
});

test('title is trimmed; boundary 80 ok, 81 rejected, whitespace-only rejected', async (t) => {
  const { app, sb } = await setup(t);
  const ok = await api(app, sb, 'PATCH', '/cards/2', { title: '  ' + 'a'.repeat(80) + '  ' });
  assert.equal(ok.statusCode, 200, `80 chars after trim should be accepted: ${ok.body}`);
  assert.equal(ok.json().title, 'a'.repeat(80));
  const v = (await getCard(app, sb, 2)).version;
  for (const [label, title] of [['81 chars', 'a'.repeat(81)], ['whitespace only', '   '], ['empty', '']] as const) {
    const bad = await api(app, sb, 'PATCH', '/cards/2', { title });
    assert.equal(bad.statusCode, 400, `${label} should be 400, got ${bad.statusCode}`);
  }
  const after = await getCard(app, sb, 2);
  assert.equal(after.version, v, 'rejected patches must not bump version');
  assert.equal(after.title, 'a'.repeat(80));
});

test('description: empty ok, 1000 ok stored untrimmed, 1001 rejected', async (t) => {
  const { app, sb } = await setup(t);
  const empty = await api(app, sb, 'PATCH', '/cards/2', { description: '' });
  assert.equal(empty.statusCode, 200, empty.body);
  assert.equal(empty.json().description, '');
  const raw = ' ' + 'x'.repeat(998) + ' ';
  const ok = await api(app, sb, 'PATCH', '/cards/2', { description: raw });
  assert.equal(ok.statusCode, 200, `1000 chars should be accepted: ${ok.body}`);
  assert.equal(ok.json().description, raw, 'description must be stored as sent, not trimmed');
  const v = (await getCard(app, sb, 2)).version;
  const bad = await api(app, sb, 'PATCH', '/cards/2', { description: 'x'.repeat(1001) });
  assert.equal(bad.statusCode, 400);
  const after = await getCard(app, sb, 2);
  assert.equal(after.version, v);
  assert.equal(after.description, raw);
});

test('status and by validation', async (t) => {
  const { app, sb } = await setup(t);
  for (const s of ['todo', 'doing', 'done']) {
    const r = await api(app, sb, 'PATCH', '/cards/2', { status: s });
    assert.equal(r.statusCode, 200, `status ${s}: ${r.body}`);
    assert.equal(r.json().status, s);
  }
  const v = (await getCard(app, sb, 2)).version;
  const bads: [string, unknown][] = [
    ['bad status', { status: 'blocked' }],
    ['numeric status', { status: 1 }],
    ['empty by', { title: 'ok', by: '' }],
    ['blank by', { title: 'ok', by: '   ' }],
    ['41-char by', { title: 'ok', by: 'b'.repeat(41) }],
    ['non-string by', { title: 'ok', by: 5 }],
    ['valid field plus invalid field', { title: 'fine', status: 'nope' }],
  ];
  for (const [label, body] of bads) {
    const r = await api(app, sb, 'PATCH', '/cards/2', body);
    assert.equal(r.statusCode, 400, `${label} should be 400, got ${r.statusCode} ${r.body}`);
  }
  const after = await getCard(app, sb, 2);
  assert.equal(after.version, v, 'invalid patches changed version');
  assert.notEqual(after.title, 'fine', 'invalid patch partially applied');
  const ok = await api(app, sb, 'PATCH', '/cards/2', { title: 'ok', by: 'b'.repeat(40) });
  assert.equal(ok.statusCode, 200, `40-char by should be accepted: ${ok.body}`);
});

test('PATCH with none of title/description/status is 400 (even with by)', async (t) => {
  const { app, sb } = await setup(t);
  for (const body of [{}, { by: 'bob' }]) {
    const r = await api(app, sb, 'PATCH', '/cards/2', body);
    assert.equal(r.statusCode, 400, `${JSON.stringify(body)} -> ${r.statusCode}`);
  }
  assert.equal((await getCard(app, sb, 2)).version, 1);
});

// ---------- If-Match ----------

test('If-Match current version applies; stale (n-1) gives 412 with current card and ETag; nothing changes', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'PATCH', '/cards/2', { title: 'v2' });
  await api(app, sb, 'PATCH', '/cards/2', { title: 'v3' });
  const stale = await api(app, sb, 'PATCH', '/cards/2', { title: 'stale' }, { 'if-match': '"2"' });
  assert.equal(stale.statusCode, 412, `stale If-Match accepted: ${stale.statusCode} ${stale.body}`);
  assert.equal(stale.headers.etag, '"3"');
  const body = stale.json();
  assert.equal(typeof body.error, 'string');
  assert.equal(body.current.id, 2);
  assert.equal(body.current.version, 3);
  assert.equal(body.current.title, 'v3');
  const after = await getCard(app, sb, 2);
  assert.equal(after.version, 3, '412 changed version');
  assert.equal(after.title, 'v3', '412 changed data');
  const ok = await api(app, sb, 'PATCH', '/cards/2', { title: 'fresh' }, { 'if-match': '"3"' });
  assert.equal(ok.statusCode, 200, `current If-Match rejected: ${ok.body}`);
  assert.equal(ok.json().version, 4);
  assert.equal(ok.json().title, 'fresh');
});

test('If-Match ahead of current (n+1) is 412; weak validator W/"n" is accepted when current', async (t) => {
  const { app, sb } = await setup(t);
  const ahead = await api(app, sb, 'PATCH', '/cards/2', { title: 'x' }, { 'if-match': '"2"' });
  assert.equal(ahead.statusCode, 412);
  const weak = await api(app, sb, 'PATCH', '/cards/2', { title: 'weak' }, { 'if-match': 'W/"1"' });
  assert.equal(weak.statusCode, 200, weak.body);
  assert.equal(weak.json().version, 2);
  const weakStale = await api(app, sb, 'PATCH', '/cards/2', { title: 'weak2' }, { 'if-match': 'W/"1"' });
  assert.equal(weakStale.statusCode, 412);
});

test('If-Match is per card: version of card 1 does not satisfy card 2', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'PATCH', '/cards/1', { title: 'a' });
  await api(app, sb, 'PATCH', '/cards/1', { title: 'b' });
  const r = await api(app, sb, 'PATCH', '/cards/2', { title: 'c' }, { 'if-match': '"3"' });
  assert.equal(r.statusCode, 412);
  const r2 = await api(app, sb, 'PATCH', '/cards/2', { title: 'c' }, { 'if-match': '"1"' });
  assert.equal(r2.statusCode, 200);
});

test('malformed If-Match is 400 and changes nothing', async (t) => {
  const { app, sb } = await setup(t);
  for (const h of ['abc', '1', '"abc"', '""']) {
    const r = await api(app, sb, 'PATCH', '/cards/2', { title: 'x' }, { 'if-match': h });
    assert.equal(r.statusCode, 400, `If-Match ${h} -> ${r.statusCode} ${r.body}`);
  }
  assert.equal((await getCard(app, sb, 2)).version, 1);
});

test('absent If-Match applies regardless of version', async (t) => {
  const { app, sb } = await setup(t);
  for (let i = 0; i < 3; i++) await api(app, sb, 'PATCH', '/cards/3', { title: `t${i}` });
  const r = await api(app, sb, 'PATCH', '/cards/3', { title: 'final' });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().version, 5);
});

// ---------- faults ----------

test('fault rule with status answers 503 without executing the handler, then expires after times (default 1)', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { http: [{ method: 'PATCH', path: 'cards/2', status: 503 }] });
  const r = await api(app, sb, 'PATCH', '/cards/2', { title: 'faulted' });
  assert.equal(r.statusCode, 503);
  assert.deepEqual(r.json(), { error: 'injected fault' });
  const c = await getCard(app, sb, 2);
  assert.equal(c.version, 1, 'faulted PATCH executed the real handler');
  assert.notEqual(c.title, 'faulted');
  const r2 = await api(app, sb, 'PATCH', '/cards/2', { title: 'real' });
  assert.equal(r2.statusCode, 200, `rule should have expired after 1 use: ${r2.statusCode}`);
  assert.equal(r2.json().version, 2);
});

test('fault times: N applies exactly N times, method is case-insensitive, other methods/paths unaffected', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { http: [{ method: 'get', path: 'cards/2', status: 500, times: 2 }] });
  assert.equal((await api(app, sb, 'GET', '/cards/3')).statusCode, 200, 'other card must not be faulted');
  assert.equal((await api(app, sb, 'PATCH', '/cards/2', { title: 'zz' })).statusCode, 200, 'other method must not be faulted');
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 500);
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 500);
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 200, 'applied more than times');
});

test('fault always:true never expires', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards', status: 502, always: true }] });
  for (let i = 0; i < 5; i++) {
    assert.equal((await api(app, sb, 'GET', '/cards')).statusCode, 502, `request ${i}`);
  }
});

test('fault: first matching rule wins', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, {
    http: [
      { method: 'GET', path: 'cards/2', status: 500 },
      { method: 'GET', path: 'cards/*', status: 503, always: true },
    ],
  });
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 500);
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 503, 'second rule applies once first expired');
});

test("fault '*' matches exactly one segment: cards/* does not match 'cards' nor 'cards/1/x'", async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards/*', status: 500, always: true }] });
  assert.equal((await api(app, sb, 'GET', '/cards')).statusCode, 200, "'cards/*' wrongly matched 'cards'");
  assert.equal((await api(app, sb, 'GET', '/cards/1')).statusCode, 500);
  assert.equal((await api(app, sb, 'GET', '/cards/4')).statusCode, 500);
  assert.equal((await api(app, sb, 'GET', '/exports/1/file')).statusCode, 404, 'unrelated path must reach real handler (404 unknown export)');
  const sb2 = await newSandbox(app);
  await fault(app, sb2, { http: [{ method: 'GET', path: 'exports/*', status: 500, always: true }] });
  assert.equal((await api(app, sb2, 'GET', '/exports/1/file')).statusCode, 404, "'exports/*' wrongly matched 'exports/1/file'");
});

test('fault delayMs only delays then handles normally; delayed fault with status still faults', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards/1', delayMs: 120 }] });
  const t0 = Date.now();
  const r = await api(app, sb, 'GET', '/cards/1');
  const dt = Date.now() - t0;
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().id, 1);
  assert.ok(dt >= 100, `expected request to be delayed ~120 ms, took ${dt} ms`);
  const t1 = Date.now();
  await api(app, sb, 'GET', '/cards/1');
  assert.ok(Date.now() - t1 < 100, 'delay rule applied twice (times default 1)');
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards/3', delayMs: 80, status: 500 }] });
  const t2 = Date.now();
  const r2 = await api(app, sb, 'GET', '/cards/3');
  assert.equal(r2.statusCode, 500);
  assert.ok(Date.now() - t2 >= 60, 'delay before status fault missing');
});

test('faults and export settings are per sandbox', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards/2', status: 500, always: true }, { method: 'PATCH', path: 'cards/2', status: 500, always: true }] });
  assert.equal((await api(app, sb2, 'GET', '/cards/2')).statusCode, 200, 'fault leaked to second sandbox');
  assert.equal((await api(app, sb2, 'PATCH', '/cards/2', { title: 'ok' })).statusCode, 200);
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 500);
  await fault(app, sb, { exports: { stepMs: 10, failAtStep: 1, failRuns: 5 } });
  await fault(app, sb2, { exports: { stepMs: 10 } });
  const e = await startExport(app, sb2);
  const done = await waitStatus(app, sb2, e.id, 'done');
  assert.equal(done.progress, 100, 'export settings of sandbox A affected sandbox B');
});

test('invalid fault rules are 400 and add no rule', async (t) => {
  const { app, sb } = await setup(t);
  const bads: unknown[] = [
    { http: [{ method: 'GET', path: 'cards', status: 200 }] },
    { http: [{ method: 'GET', path: 'cards', status: 600 }] },
    { http: [{ method: 'GET', path: 'cards', status: 399 }] },
    { http: [{ method: 'GET', path: 'cards', delayMs: -1 }] },
    { http: [{ method: 'GET', path: 'cards', delayMs: 30001 }] },
    { http: [{ method: 'GET', path: 'cards', status: 500, times: 0 }] },
    { http: [{ path: 'cards', status: 500 }] },
    { http: [{ method: 'GET', status: 500 }] },
    { http: [{ method: 'GET', path: 'cards' }] },
    { http: [{ method: 'GET', path: 'cards', status: 500, always: true }, { method: 'GET', path: 'cards', status: 99 }] },
  ];
  for (const b of bads) {
    const r = await hook(app, sb, 'fault', b);
    assert.equal(r.statusCode, 400, `${JSON.stringify(b)} -> ${r.statusCode} ${r.body}`);
  }
  assert.equal((await api(app, sb, 'GET', '/cards')).statusCode, 200, 'an invalid rule set was partially added');
});

test('invalid export settings are 400', async (t) => {
  const { app, sb } = await setup(t);
  const bads: unknown[] = [
    { exports: { stepMs: 9 } },
    { exports: { stepMs: 10001 } },
    { exports: { failAtStep: 0 } },
    { exports: { failAtStep: 11 } },
    { exports: { failRuns: -1 } },
  ];
  for (const b of bads) {
    const r = await hook(app, sb, 'fault', b);
    assert.equal(r.statusCode, 400, `${JSON.stringify(b)} -> ${r.statusCode} ${r.body}`);
  }
  for (const b of [{ exports: { stepMs: 10 } }, { exports: { stepMs: 10000 } }, { exports: { failAtStep: 10 } }, { exports: { failAtStep: null } }]) {
    const r = await hook(app, sb, 'fault', b);
    assert.ok(r.statusCode < 300, `${JSON.stringify(b)} should be valid -> ${r.statusCode} ${r.body}`);
  }
});

test('with testHooks false all /__test__ routes are 404', async (t) => {
  const app = await makeApp(t, false);
  const sb = await newSandbox(app);
  for (const op of ['fault', 'seed', 'reset']) {
    const r = await hook(app, sb, op, op === 'seed' ? { cards: [{ title: 'x' }] } : {});
    assert.equal(r.statusCode, 404, `${op} -> ${r.statusCode}`);
  }
  assert.equal((await getCards(app, sb)).length, 4);
});

// ---------- seed / reset ----------

test('seed cards replaces all cards, restarts ids at 1, applies defaults', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'PATCH', '/cards/4', { title: 'edited' });
  const r = await hook(app, sb, 'seed', { cards: [{ title: 'only' }, { title: 'second', description: 'd', status: 'done' }] });
  assert.equal(r.statusCode, 200, r.body);
  assert.deepEqual(r.json().cards.map((c: any) => c.id), [1, 2]);
  const cards = await getCards(app, sb);
  assert.equal(cards.length, 2, 'old cards kept after seeding');
  assert.equal(cards[0].title, 'only');
  assert.equal(cards[0].status, 'todo');
  assert.equal(cards[0].description, '');
  assert.equal(cards[0].version, 1);
  assert.equal(cards[1].status, 'done');
  assert.equal(cards[1].description, 'd');
  assert.equal(cards[1].version, 1);
  assert.equal((await api(app, sb, 'GET', '/cards/3')).statusCode, 404, 'old id 3 still exists');
  assert.equal((await api(app, sb, 'GET', '/cards/4')).statusCode, 404, 'old id 4 still exists');
});

test('seed does not touch other sandboxes', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  await hook(app, sb, 'seed', { cards: [{ title: 'only' }] });
  assert.equal((await getCards(app, sb2)).length, 4);
});

test('seed with an invalid card is 400 and leaves cards unchanged; empty body is 400', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'PATCH', '/cards/2', { title: 'keep me' });
  const before = await getCards(app, sb);
  const bads: unknown[] = [
    { cards: [{ title: 'good' }, { title: '' }] },
    { cards: [{ title: 'good' }, { title: 'x'.repeat(81) }] },
    { cards: [{ title: 'good', status: 'weird' }] },
    { cards: [{ title: 'good', description: 'x'.repeat(1001) }] },
    { cards: [{ description: 'no title' }] },
    {},
  ];
  for (const b of bads) {
    const r = await hook(app, sb, 'seed', b);
    assert.equal(r.statusCode, 400, `${JSON.stringify(b).slice(0, 60)} -> ${r.statusCode} ${r.body.slice(0, 100)}`);
  }
  assert.deepEqual(await getCards(app, sb), before, 'cards changed by rejected seed');
});

test('reset restores default cards, clears faults and export settings, removes export jobs; other sandboxes untouched', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  await api(app, sb, 'PATCH', '/cards/2', { title: 'edited', by: 'me' });
  await hook(app, sb, 'seed', { cards: [{ title: 'one' }] });
  await api(app, sb2, 'PATCH', '/cards/2', { title: 'other edited' });
  await fault(app, sb, { http: [{ method: 'GET', path: 'cards', status: 500, always: true }, { method: 'GET', path: 'cards/*', status: 500, always: true }] });
  await fault(app, sb, { exports: { stepMs: 10, failAtStep: 1, failRuns: 9 } });
  const e1 = await startExport(app, sb);
  await waitStatus(app, sb, e1.id, 'failed');
  await fault(app, sb, { exports: { stepMs: 10000, failAtStep: null } });
  const running = await startExport(app, sb);
  const rr = await hook(app, sb, 'reset', {});
  assert.ok(rr.statusCode < 300, `reset -> ${rr.statusCode} ${rr.body}`);

  const cards = await getCards(app, sb);
  assert.deepEqual(cards.map((c) => c.id), [1, 2, 3, 4], 'reset did not restore default cards / faults left behind');
  for (const c of cards) {
    assert.equal(c.version, 1);
    assert.equal(c.updatedBy, 'seed');
  }
  assert.equal((await api(app, sb, 'GET', '/cards/2')).statusCode, 200, 'wildcard fault survived reset');
  const list = await api(app, sb, 'GET', '/exports');
  assert.deepEqual(list.json().exports, [], 'export jobs survived reset');
  assert.equal((await api(app, sb, 'GET', `/exports/${running.id}`)).statusCode, 404, 'running job still reachable after reset');
  assert.equal((await getCard(app, sb2, 2)).title, 'other edited', 'reset touched another sandbox');

  const fresh = await startExport(app, sb);
  assert.equal(fresh.id, 1, 'export ids should restart at 1 after reset');
  await new Promise((r) => setTimeout(r, 150));
  const e = await getExport(app, sb, fresh.id);
  assert.equal(e.status, 'running', `export settings survived reset (stepMs/failAtStep): ${JSON.stringify(e)}`);
  assert.ok(e.progress <= 10, `stepMs should be back to default 500, progress=${e.progress}`);
});

test('reset stops a running job: it does not reappear nor progress later', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 10 } });
  await startExport(app, sb);
  await hook(app, sb, 'reset', {});
  await new Promise((r) => setTimeout(r, 150));
  const list = await api(app, sb, 'GET', '/exports');
  assert.deepEqual(list.json().exports, []);
});

// ---------- exports ----------

test('export lifecycle: shape, ids, monotonic progress to 100, status done, newest-first list', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 20 } });
  const e1 = await startExport(app, sb);
  assert.deepEqual(e1, { id: 1, status: 'running', progress: 0, error: null, retryOf: null });
  const e2 = await startExport(app, sb);
  assert.equal(e2.id, 2);
  let last = 0;
  const seen = new Set<number>();
  const done = await until('export 1 done', async () => {
    const e = await getExport(app, sb, 1);
    assert.ok(e.progress >= last, `progress decreased ${last} -> ${e.progress}`);
    assert.equal(e.progress % 10, 0, `progress ${e.progress} not a multiple of 10`);
    seen.add(e.progress);
    last = e.progress;
    return e.status === 'done' ? e : undefined;
  });
  assert.equal(done.progress, 100);
  assert.equal(done.error, null);
  assert.equal(done.retryOf, null);
  await waitStatus(app, sb, 2, 'done');
  const list = (await api(app, sb, 'GET', '/exports')).json().exports;
  assert.deepEqual(list.map((e: any) => e.id), [2, 1], 'list must be newest first');
  const other = await newSandbox(app);
  assert.equal((await startExport(app, other)).id, 1, 'export ids must be per sandbox');
});

test('export unknown ids are 404 for get/cancel/retry/file', async (t) => {
  const { app, sb } = await setup(t);
  await startExport(app, sb);
  for (const [m, p] of [['GET', '/exports/9'], ['POST', '/exports/9/cancel'], ['POST', '/exports/9/retry'], ['GET', '/exports/9/file']] as [string, string][]) {
    const r = await api(app, sb, m, p);
    assert.equal(r.statusCode, 404, `${m} ${p} -> ${r.statusCode}`);
  }
});

test('cancel stops progress; second cancel is 409; cancel of done is 409; file of cancelled is 409', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 60 } });
  const e = await startExport(app, sb);
  await until('progress >= 10', async () => (await getExport(app, sb, e.id)).progress >= 10);
  const c = await api(app, sb, 'POST', `/exports/${e.id}/cancel`);
  assert.equal(c.statusCode, 200, c.body);
  assert.equal(c.json().status, 'cancelled');
  const frozen = (await getExport(app, sb, e.id)).progress;
  assert.ok(frozen < 100);
  await new Promise((r) => setTimeout(r, 200));
  const after = await getExport(app, sb, e.id);
  assert.equal(after.status, 'cancelled');
  assert.equal(after.progress, frozen, 'progress advanced after cancel');
  assert.equal((await api(app, sb, 'POST', `/exports/${e.id}/cancel`)).statusCode, 409);
  assert.equal((await api(app, sb, 'GET', `/exports/${e.id}/file`)).statusCode, 409);

  await fault(app, sb, { exports: { stepMs: 10 } });
  const d = await startExport(app, sb);
  await waitStatus(app, sb, d.id, 'done');
  assert.equal((await api(app, sb, 'POST', `/exports/${d.id}/cancel`)).statusCode, 409, 'cancel of done job');
  assert.equal((await getExport(app, sb, d.id)).status, 'done', 'cancel of done job changed status');
});

test('retry of cancelled creates a new job and leaves the old one unchanged', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 80 } });
  const a = await startExport(app, sb);
  const b = await startExport(app, sb);
  await api(app, sb, 'POST', `/exports/${b.id}/cancel`);
  await api(app, sb, 'POST', `/exports/${a.id}/cancel`);
  const oldBefore = await getExport(app, sb, a.id);
  const r = await api(app, sb, 'POST', `/exports/${a.id}/retry`);
  assert.equal(r.statusCode, 201, r.body);
  const n = r.json();
  assert.notEqual(n.id, a.id, 'retry reused old id');
  assert.equal(n.id, 3);
  assert.equal(n.status, 'running');
  assert.equal(n.progress, 0);
  assert.equal(n.retryOf, a.id);
  assert.equal(n.error, null);
  await new Promise((r) => setTimeout(r, 150));
  assert.deepEqual(await getExport(app, sb, a.id), oldBefore, 'old job mutated by retry');
  const list = (await api(app, sb, 'GET', '/exports')).json().exports;
  assert.deepEqual(list.map((e: any) => e.id), [3, 2, 1]);
  assert.equal((await api(app, sb, 'POST', `/exports/${n.id}/retry`)).statusCode, 409, 'retry of running job');
});

test('retry of a done job is 409', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 10 } });
  const e = await startExport(app, sb);
  await waitStatus(app, sb, e.id, 'done');
  assert.equal((await api(app, sb, 'POST', `/exports/${e.id}/retry`)).statusCode, 409);
  assert.equal((await api(app, sb, 'GET', '/exports')).json().exports.length, 1, 'rejected retry created a job');
});

test('failAtStep 3 fails with progress 20, failRuns 1 means the next run succeeds, retry works from failed', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 20, failAtStep: 3 } });
  const e1 = await startExport(app, sb);
  const failed = await waitStatus(app, sb, e1.id, 'failed');
  assert.equal(failed.progress, 20, 'progress should stay at last completed step');
  assert.equal(typeof failed.error, 'string');
  assert.ok(failed.error.length > 0, 'error must be non-empty');
  assert.equal((await api(app, sb, 'GET', `/exports/${e1.id}/file`)).statusCode, 409);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal((await getExport(app, sb, e1.id)).progress, 20, 'failed job progressed');
  const e2 = await startExport(app, sb);
  const ok = await waitStatus(app, sb, e2.id, 'done');
  assert.equal(ok.progress, 100, 'second run should succeed with failRuns default 1');
  const rt = await api(app, sb, 'POST', `/exports/${e1.id}/retry`);
  assert.equal(rt.statusCode, 201, rt.body);
  assert.equal(rt.json().retryOf, e1.id);
  const rd = await waitStatus(app, sb, rt.json().id, 'done');
  assert.equal(rd.progress, 100);
  assert.equal((await getExport(app, sb, e1.id)).status, 'failed', 'old failed job changed by retry');
});

test('failRuns 2 fails exactly two runs, the third succeeds', async (t) => {
  const { app, sb } = await setup(t);
  await fault(app, sb, { exports: { stepMs: 10, failAtStep: 1, failRuns: 2 } });
  const ids: number[] = [];
  for (let i = 0; i < 3; i++) {
    const e = await startExport(app, sb);
    ids.push(e.id);
    await until(`export ${e.id} finished`, async () => {
      const s = (await getExport(app, sb, e.id)).status;
      return s !== 'running' ? s : undefined;
    });
  }
  const statuses = [];
  for (const id of ids) statuses.push((await getExport(app, sb, id)).status);
  assert.deepEqual(statuses, ['failed', 'failed', 'done']);
  assert.equal((await getExport(app, sb, ids[0]!)).progress, 0, 'failAtStep 1 -> progress 0');
});

test('file: 409 until done, then CSV with header and quoted rows in id order reflecting cards at finish', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'seed', {
    cards: [
      { title: 'Plain', status: 'todo' },
      { title: 'He said "hi", ok', status: 'doing' },
      { title: 'Third', status: 'done' },
    ],
  });
  await api(app, sb, 'PATCH', '/cards/3', { title: 'Third v2' });
  await fault(app, sb, { exports: { stepMs: 40 } });
  const e = await startExport(app, sb);
  const early = await api(app, sb, 'GET', `/exports/${e.id}/file`);
  assert.equal(early.statusCode, 409, `file served before done: ${early.statusCode} ${early.body}`);
  await waitStatus(app, sb, e.id, 'done');
  const f = await api(app, sb, 'GET', `/exports/${e.id}/file`);
  assert.equal(f.statusCode, 200, f.body);
  assert.ok(String(f.headers['content-type']).startsWith('text/csv'), `content-type ${f.headers['content-type']}`);
  const lines = f.body.split(/\r?\n/).filter((l, i, a) => !(l === '' && i === a.length - 1));
  assert.equal(lines[0], 'id,title,status,version');
  assert.deepEqual(lines.slice(1), [
    '"1","Plain","todo","1"',
    '"2","He said ""hi"", ok","doing","1"',
    '"3","Third v2","done","2"',
  ]);
});

test('file reflects cards at the moment the job finished, not at start', async (t) => {
  const { app, sb } = await setup(t);
  await hook(app, sb, 'seed', { cards: [{ title: 'A' }, { title: 'B' }] });
  await fault(app, sb, { exports: { stepMs: 50 } });
  const e = await startExport(app, sb);
  await api(app, sb, 'PATCH', '/cards/2', { title: 'edited during export' });
  await waitStatus(app, sb, e.id, 'done');
  const f = await api(app, sb, 'GET', `/exports/${e.id}/file`);
  assert.equal(f.statusCode, 200);
  const lines = f.body.split(/\r?\n/).filter(Boolean);
  assert.deepEqual(lines, ['id,title,status,version', '"1","A","todo","1"', '"2","edited during export","todo","2"']);
});
