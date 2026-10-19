import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

const openClients = new WeakMap<App, { terminate(): void }[]>();

async function makeApp(t: { after: (fn: () => Promise<void>) => void }, testHooks = true): Promise<App> {
  const app = await buildApp({ dbPath: ':memory:', testHooks });
  t.after(async () => {
    for (const ws of openClients.get(app) ?? []) ws.terminate();
    await app.close();
  });
  return app;
}

async function newSandbox(app: App): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201);
  return res.json().id;
}

async function post(app: App, sb: string, payload: unknown) {
  return app.inject({ method: 'POST', url: `/api/s/${sb}/messages`, payload: payload as object });
}

async function list(app: App, sb: string, since?: number) {
  const q = since === undefined ? '' : `?since=${since}`;
  const res = await app.inject({ method: 'GET', url: `/api/s/${sb}/messages${q}` });
  assert.equal(res.statusCode, 200);
  return res.json().messages as { seq: number; name: string; text: string }[];
}

interface Client {
  ws: any;
  msgs: any[];
  closed: Promise<number>;
  waitFor: (n: number) => Promise<any[]>;
}

const wsBases = new WeakMap<App, string>();

async function wsBase(app: App): Promise<string> {
  let base = wsBases.get(app);
  if (!base) {
    base = (await app.listen({ port: 0, host: '127.0.0.1' })).replace(/^http/, 'ws');
    wsBases.set(app, base);
  }
  return base;
}

async function connect(app: App, sb: string, query = 'name=bob&since=0'): Promise<Client> {
  const msgs: any[] = [];
  const waiters: { n: number; resolve: (m: any[]) => void }[] = [];
  let resolveClosed: (c: number) => void = () => {};
  const closed = new Promise<number>((r) => {
    resolveClosed = r;
  });
  const socket = new WebSocket(`${await wsBase(app)}/api/s/${sb}/ws?${query}`);
  socket.addEventListener('message', (e) => {
    msgs.push(JSON.parse(String(e.data)));
    for (const wt of [...waiters]) {
      if (msgs.length >= wt.n) {
        waiters.splice(waiters.indexOf(wt), 1);
        wt.resolve(msgs.slice());
      }
    }
  });
  socket.addEventListener('close', (e) => resolveClosed(e.code));
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const ws = { terminate: () => socket.close() };
  openClients.set(app, [...(openClients.get(app) ?? []), ws]);
  const waitFor = (n: number) =>
    new Promise<any[]>((resolve, reject) => {
      if (msgs.length >= n) return resolve(msgs.slice());
      const timer = setTimeout(
        () => reject(new Error(`timeout waiting for ${n} messages, got ${JSON.stringify(msgs)}`)),
        2000,
      );
      waiters.push({
        n,
        resolve: (m) => {
          clearTimeout(timer);
          resolve(m);
        },
      });
    });
  return { ws, msgs, closed, waitFor };
}

async function connectReady(app: App, sb: string, query?: string): Promise<Client> {
  const c = await connect(app, sb, query);
  const m = await c.waitFor(1);
  // wait until ready appears
  const start = Date.now();
  while (!c.msgs.some((x) => x.type === 'ready')) {
    if (Date.now() - start > 2000) throw new Error('no ready: ' + JSON.stringify(m));
    await new Promise((r) => setTimeout(r, 5));
  }
  return c;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout: ' + label)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// returns true if promise resolved within ms
async function settlesWithin(p: Promise<unknown>, ms: number): Promise<boolean> {
  let done = false;
  p.then(() => {
    done = true;
  });
  await new Promise((r) => setTimeout(r, ms));
  return done;
}

// ---- basics ----

test('GET /api/health returns 200 {ok:true, commit:null} outside Render', async (t) => {
  const app = await makeApp(t);
  const res = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true, commit: null });
});

test('POST /api/sandboxes returns 201 with distinct non-empty ids', async (t) => {
  const app = await makeApp(t);
  const a = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  const b = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(a.statusCode, 201);
  assert.equal(b.statusCode, 201);
  assert.equal(typeof a.json().id, 'string');
  assert.ok(a.json().id.length > 0);
  assert.ok(b.json().id.length > 0);
  assert.notEqual(a.json().id, b.json().id);
});

// ---- unknown sandbox (failure 9) ----

test('unknown sandbox: GET and POST messages return 404', async (t) => {
  const app = await makeApp(t);
  const g = await app.inject({ method: 'GET', url: '/api/s/nope/messages' });
  assert.equal(g.statusCode, 404);
  const p = await post(app, 'nope', { name: 'a', text: 'b' });
  assert.equal(p.statusCode, 404);
});

test('unknown sandbox: WS connect is closed with code 4404', async (t) => {
  const app = await makeApp(t);
  await app.listen({ port: 0, host: '127.0.0.1' });
  const port = (app.server.address() as { port: number }).port;
  const msgs: any[] = [];
  const ws = new WebSocket(`ws://127.0.0.1:${port}/api/s/nope/ws?name=bob&since=0`);
  ws.addEventListener('message', (e) => msgs.push(JSON.parse(String(e.data))));
  const code = await withTimeout(
    new Promise<number>((resolve) => ws.addEventListener('close', (e) => resolve(e.code))),
    2000,
    'close',
  );
  assert.equal(code, 4404);
  assert.equal(msgs.some((m) => m.type === 'ready'), false);
});

test('unknown sandbox: test hooks reset/seed/fault return 404', async (t) => {
  const app = await makeApp(t);
  const r = await app.inject({ method: 'POST', url: '/__test__/s/nope/reset' });
  assert.equal(r.statusCode, 404);
  const s = await app.inject({
    method: 'POST',
    url: '/__test__/s/nope/seed',
    payload: { messages: [{ name: 'a', text: 'b' }] },
  });
  assert.equal(s.statusCode, 404);
  const f = await app.inject({ method: 'POST', url: '/__test__/s/nope/fault', payload: { dropSockets: 'all' } });
  assert.equal(f.statusCode, 404);
});

// ---- seq (failure 3, 1) ----

test('seq starts at 1 and increments by 1 within a sandbox', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const r1 = await post(app, sb, { name: 'a', text: 'one' });
  const r2 = await post(app, sb, { name: 'a', text: 'two' });
  const r3 = await post(app, sb, { name: 'a', text: 'three' });
  assert.equal(r1.statusCode, 201);
  assert.deepEqual(r1.json(), { seq: 1, name: 'a', text: 'one' });
  assert.equal(r2.json().seq, 2);
  assert.equal(r3.json().seq, 3);
});

test('seq counters are independent per sandbox (second sandbox starts at 1)', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await post(app, a, { name: 'x', text: '1' });
  await post(app, a, { name: 'x', text: '2' });
  const rb = await post(app, b, { name: 'y', text: 'first in b' });
  assert.equal(rb.json().seq, 1);
  const ra = await post(app, a, { name: 'x', text: '3' });
  assert.equal(ra.json().seq, 3);
});

test('messages do not leak between sandboxes', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await post(app, a, { name: 'x', text: 'only in a' });
  assert.deepEqual(await list(app, b), []);
  assert.equal((await list(app, a)).length, 1);
});

// ---- since filter (failure 4) ----

test('GET messages: since excludes seq == N, sorted ascending, missing since means 0', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  for (const text of ['m1', 'm2', 'm3', 'm4']) await post(app, sb, { name: 'a', text });
  const all = await list(app, sb);
  assert.deepEqual(all.map((m) => m.seq), [1, 2, 3, 4]);
  const since2 = await list(app, sb, 2);
  assert.deepEqual(since2.map((m) => m.seq), [3, 4]);
  assert.deepEqual(since2.map((m) => m.text), ['m3', 'm4']);
  assert.deepEqual(await list(app, sb, 4), []);
  assert.deepEqual((await list(app, sb, 0)).map((m) => m.seq), [1, 2, 3, 4]);
});

// ---- validation (failure 6) ----

test('POST accepts name of exactly 40 chars and rejects 41', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const ok = await post(app, sb, { name: 'n'.repeat(40), text: 'hi' });
  assert.equal(ok.statusCode, 201);
  const bad = await post(app, sb, { name: 'n'.repeat(41), text: 'hi' });
  assert.equal(bad.statusCode, 400);
});

test('POST accepts text of exactly 500 chars and rejects 501', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const ok = await post(app, sb, { name: 'a', text: 't'.repeat(500) });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.json().text.length, 500);
  const bad = await post(app, sb, { name: 'a', text: 't'.repeat(501) });
  assert.equal(bad.statusCode, 400);
});

test('length limits apply after trimming', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const ok = await post(app, sb, { name: `  ${'n'.repeat(40)}  `, text: ` ${'t'.repeat(500)} ` });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.json().name.length, 40);
  assert.equal(ok.json().text.length, 500);
});

test('POST rejects whitespace-only and empty name or text', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  for (const payload of [
    { name: '   ', text: 'x' },
    { name: '', text: 'x' },
    { name: 'a', text: '   ' },
    { name: 'a', text: '' },
    { name: 'a', text: '\n\t ' },
  ]) {
    const res = await post(app, sb, payload);
    assert.equal(res.statusCode, 400, JSON.stringify(payload));
  }
  assert.deepEqual(await list(app, sb), []);
});

test('POST rejects non-string name or text and missing fields', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  for (const payload of [
    { name: 5, text: 'x' },
    { name: 'a', text: 5 },
    { name: null, text: 'x' },
    { name: 'a', text: null },
    { name: ['a'], text: 'x' },
    { name: 'a', text: { t: 1 } },
    { text: 'x' },
    { name: 'a' },
    {},
  ]) {
    const res = await post(app, sb, payload);
    assert.equal(res.statusCode, 400, JSON.stringify(payload));
  }
  assert.deepEqual(await list(app, sb), []);
});

test('POST with missing body returns 400', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const res = await app.inject({ method: 'POST', url: `/api/s/${sb}/messages` });
  assert.equal(res.statusCode, 400);
});

test('rejected POST does not consume a seq number', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  await post(app, sb, { name: 'a', text: '' });
  const ok = await post(app, sb, { name: 'a', text: 'real' });
  assert.equal(ok.json().seq, 1);
});

test('name and text are trimmed; text otherwise stored verbatim', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const res = await post(app, sb, { name: '  bob  ', text: '  <b>x</b> & "q"  ' });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { seq: 1, name: 'bob', text: '<b>x</b> & "q"' });
  const stored = await list(app, sb);
  assert.deepEqual(stored, [{ seq: 1, name: 'bob', text: '<b>x</b> & "q"' }]);
});

// ---- WebSocket replay and broadcast (failures 1, 5) ----

test('WS connect replays stored messages with seq > since in order, then ready', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  for (const text of ['m1', 'm2', 'm3']) await post(app, sb, { name: 'a', text });
  const c = await connect(app, sb, 'name=bob&since=1');
  t.after(() => c.ws.terminate());
  const got = await c.waitFor(3);
  assert.deepEqual(got.slice(0, 3), [
    { type: 'msg', seq: 2, name: 'a', text: 'm2' },
    { type: 'msg', seq: 3, name: 'a', text: 'm3' },
    { type: 'ready' },
  ]);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(c.msgs.length, 3, 'no duplicates or extra messages after ready');
});

test('WS connect with since=0 and no stored messages sends only ready', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c = await connect(app, sb, 'name=bob&since=0');
  t.after(() => c.ws.terminate());
  const got = await c.waitFor(1);
  assert.deepEqual(got[0], { type: 'ready' });
});

test('WS replay does not include seq == since', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  await post(app, sb, { name: 'a', text: 'm1' });
  await post(app, sb, { name: 'a', text: 'm2' });
  const c = await connect(app, sb, 'name=bob&since=2');
  t.after(() => c.ws.terminate());
  const got = await c.waitFor(1);
  assert.deepEqual(got[0], { type: 'ready' });
});

test('live broadcast after ready reaches all sockets in that sandbox with the posted message', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c1 = await connectReady(app, sb, 'name=alice&since=0');
  const c2 = await connectReady(app, sb, 'name=bob&since=0');
  t.after(() => {
    c1.ws.terminate();
    c2.ws.terminate();
  });
  const res = await post(app, sb, { name: 'alice', text: ' hello ' });
  assert.equal(res.statusCode, 201);
  const expected = { type: 'msg', seq: 1, name: 'alice', text: 'hello' };
  const g1 = await c1.waitFor(2);
  const g2 = await c2.waitFor(2);
  assert.deepEqual(g1[1], expected);
  assert.deepEqual(g2[1], expected);
});

test('broadcast does not leak to sockets of another sandbox', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const ca = await connectReady(app, a);
  const cb = await connectReady(app, b);
  t.after(() => {
    ca.ws.terminate();
    cb.ws.terminate();
  });
  await post(app, a, { name: 'x', text: 'for a' });
  await ca.waitFor(2);
  // positive control: sandbox b gets its own message next; it must be the first message b sees
  await post(app, b, { name: 'y', text: 'for b' });
  const gb = await cb.waitFor(2);
  assert.deepEqual(gb[1], { type: 'msg', seq: 1, name: 'y', text: 'for b' });
  assert.equal(gb.length, 2);
  assert.equal(ca.msgs.length, 2);
});

test('rejected POST is not broadcast', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c = await connectReady(app, sb);
  t.after(() => c.ws.terminate());
  await post(app, sb, { name: 'a', text: '   ' });
  await post(app, sb, { name: 'a', text: 'good' });
  const got = await c.waitFor(2);
  assert.deepEqual(got[1], { type: 'msg', seq: 1, name: 'a', text: 'good' });
  assert.equal(got.length, 2);
});

// ---- test hooks gating (failure 2) ----

test('with testHooks false every /__test__ POST returns 404', async (t) => {
  const app = await makeApp(t, false);
  const sb = await newSandbox(app);
  const urls: [string, object][] = [
    [`/__test__/s/${sb}/reset`, {}],
    [`/__test__/s/${sb}/seed`, { messages: [{ name: 'a', text: 'b' }] }],
    [`/__test__/s/${sb}/fault`, { dropSockets: 'all' }],
  ];
  for (const [url, payload] of urls) {
    const res = await app.inject({ method: 'POST', url, payload });
    assert.equal(res.statusCode, 404, url);
  }
  assert.deepEqual(await list(app, sb), [], 'seed must not have stored anything');
});

test('with testHooks omitted every /__test__ POST returns 404', async (t) => {
  const app = await buildApp({ dbPath: ':memory:' } as any);
  t.after(async () => {
    await app.close();
  });
  const sb = await newSandbox(app);
  await post(app, sb, { name: 'a', text: 'keep' });
  for (const sub of ['reset', 'seed', 'fault']) {
    const res = await app.inject({ method: 'POST', url: `/__test__/s/${sb}/${sub}`, payload: {} });
    assert.equal(res.statusCode, 404, sub);
  }
  assert.equal((await list(app, sb)).length, 1, 'reset must not have deleted anything');
});

// ---- reset (failures 1, 3) ----

test('reset deletes messages, restarts seq at 1, returns {ok:true}', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  await post(app, sb, { name: 'a', text: 'm1' });
  await post(app, sb, { name: 'a', text: 'm2' });
  const res = await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });
  assert.deepEqual(await list(app, sb), []);
  const next = await post(app, sb, { name: 'a', text: 'again' });
  assert.equal(next.json().seq, 1);
});

test('reset sends {type:reset} then closes that sandbox sockets with 4000', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c = await connectReady(app, sb);
  t.after(() => c.ws.terminate());
  const res = await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal(res.statusCode, 200);
  const code = await withTimeout(c.closed, 2000, 'close after reset');
  assert.equal(code, 4000);
  assert.deepEqual(c.msgs[c.msgs.length - 1], { type: 'reset' });
});

test('reset leaves other sandboxes untouched (messages, seq, sockets)', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await post(app, b, { name: 'y', text: 'b1' });
  await post(app, b, { name: 'y', text: 'b2' });
  const cb = await connectReady(app, b, 'name=y&since=2');
  t.after(() => cb.ws.terminate());
  const ca = await connectReady(app, a);
  t.after(() => ca.ws.terminate());

  await app.inject({ method: 'POST', url: `/__test__/s/${a}/reset` });
  await withTimeout(ca.closed, 2000, 'a closed');

  assert.equal((await list(app, b)).length, 2);
  assert.equal(await settlesWithin(cb.closed, 150), false, 'b socket must stay open');
  const next = await post(app, b, { name: 'y', text: 'b3' });
  assert.equal(next.json().seq, 3);
  const got = await cb.waitFor(2);
  assert.deepEqual(got[1], { type: 'msg', seq: 3, name: 'y', text: 'b3' });
  assert.equal(got.some((m) => m.type === 'reset'), false);
});

test('reset clears the broadcast delay', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/fault`, payload: { broadcastDelayMs: 1500 } });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  const c = await connectReady(app, sb);
  t.after(() => c.ws.terminate());
  const start = Date.now();
  await post(app, sb, { name: 'a', text: 'fast' });
  await c.waitFor(2);
  assert.ok(Date.now() - start < 1000, `broadcast took ${Date.now() - start}ms after reset`);
});

// ---- seed (failures 3, 8) ----

test('seed stores and broadcasts like normal posts and returns seq-numbered messages', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c = await connectReady(app, sb);
  t.after(() => c.ws.terminate());
  const res = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: ' a ', text: ' one ' }, { name: 'b', text: 'two' }] },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    messages: [
      { seq: 1, name: 'a', text: 'one' },
      { seq: 2, name: 'b', text: 'two' },
    ],
  });
  assert.deepEqual(await list(app, sb), res.json().messages);
  const got = await c.waitFor(3);
  assert.deepEqual(got.slice(1, 3), [
    { type: 'msg', seq: 1, name: 'a', text: 'one' },
    { type: 'msg', seq: 2, name: 'b', text: 'two' },
  ]);
  const after = await post(app, sb, { name: 'a', text: 'next' });
  assert.equal(after.json().seq, 3);
});

test('seed with one invalid entry returns 400 and stores nothing (invalid last)', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const res = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: 'a', text: 'ok1' }, { name: 'b', text: 'ok2' }, { name: 'c', text: '   ' }] },
  });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(await list(app, sb), []);
  const next = await post(app, sb, { name: 'a', text: 'x' });
  assert.equal(next.json().seq, 1, 'failed seed must not consume seq numbers');
});

test('seed with invalid entry in the middle stores nothing and broadcasts nothing', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const c = await connectReady(app, sb);
  t.after(() => c.ws.terminate());
  const res = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: 'a', text: 'ok' }, { name: 'n'.repeat(41), text: 'bad' }, { name: 'b', text: 'ok' }] },
  });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(await list(app, sb), []);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(c.msgs.length, 1, 'only ready, no msg broadcasts');
});

test('seed rejects non-string and oversized text entries (501) but accepts 500', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const bad1 = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: 'a', text: 5 }] },
  });
  assert.equal(bad1.statusCode, 400);
  const bad2 = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: 'a', text: 't'.repeat(501) }] },
  });
  assert.equal(bad2.statusCode, 400);
  assert.deepEqual(await list(app, sb), []);
  const ok = await app.inject({
    method: 'POST',
    url: `/__test__/s/${sb}/seed`,
    payload: { messages: [{ name: 'a', text: 't'.repeat(500) }] },
  });
  assert.equal(ok.statusCode, 200);
});

test('seed into one sandbox does not touch another', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await app.inject({
    method: 'POST',
    url: `/__test__/s/${a}/seed`,
    payload: { messages: [{ name: 'x', text: '1' }, { name: 'x', text: '2' }] },
  });
  assert.deepEqual(await list(app, b), []);
  const rb = await post(app, b, { name: 'y', text: 'first' });
  assert.equal(rb.json().seq, 1);
});

// ---- fault (failures 1, 7) ----

test('dropSockets by name terminates only that name in that sandbox', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const alice = await connectReady(app, a, 'name=alice&since=0');
  const bob = await connectReady(app, a, 'name=bob&since=0');
  const aliceOther = await connectReady(app, b, 'name=alice&since=0');
  t.after(() => {
    alice.ws.terminate();
    bob.ws.terminate();
    aliceOther.ws.terminate();
  });
  const res = await app.inject({ method: 'POST', url: `/__test__/s/${a}/fault`, payload: { dropSockets: 'alice' } });
  assert.equal(res.statusCode, 200);
  await withTimeout(alice.closed, 2000, 'alice closed');
  assert.equal(await settlesWithin(bob.closed, 150), false, 'bob must stay open');
  assert.equal(await settlesWithin(aliceOther.closed, 10), false, 'alice in other sandbox must stay open');
  await post(app, a, { name: 'z', text: 'still works' });
  const got = await bob.waitFor(2);
  assert.deepEqual(got[1], { type: 'msg', seq: 1, name: 'z', text: 'still works' });
});

test("dropSockets 'all' terminates every socket in that sandbox only", async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const a1 = await connectReady(app, a, 'name=alice&since=0');
  const a2 = await connectReady(app, a, 'name=bob&since=0');
  const b1 = await connectReady(app, b, 'name=alice&since=0');
  t.after(() => {
    a1.ws.terminate();
    a2.ws.terminate();
    b1.ws.terminate();
  });
  const res = await app.inject({ method: 'POST', url: `/__test__/s/${a}/fault`, payload: { dropSockets: 'all' } });
  assert.equal(res.statusCode, 200);
  await withTimeout(a1.closed, 2000, 'a1 closed');
  await withTimeout(a2.closed, 2000, 'a2 closed');
  assert.equal(await settlesWithin(b1.closed, 150), false, 'other sandbox socket must stay open');
});

test('broadcastDelayMs delays broadcasts in that sandbox only', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const ca = await connectReady(app, a);
  const cb = await connectReady(app, b);
  t.after(() => {
    ca.ws.terminate();
    cb.ws.terminate();
  });
  const res = await app.inject({ method: 'POST', url: `/__test__/s/${a}/fault`, payload: { broadcastDelayMs: 400 } });
  assert.equal(res.statusCode, 200);

  const startB = Date.now();
  await post(app, b, { name: 'y', text: 'undelayed' });
  await cb.waitFor(2);
  assert.ok(Date.now() - startB < 300, `other sandbox delayed ${Date.now() - startB}ms`);

  const startA = Date.now();
  const pr = await post(app, a, { name: 'x', text: 'delayed' });
  assert.equal(pr.statusCode, 201);
  await ca.waitFor(2);
  const elapsed = Date.now() - startA;
  assert.ok(elapsed >= 300, `broadcast arrived after only ${elapsed}ms`);
  assert.deepEqual(ca.msgs[1], { type: 'msg', seq: 1, name: 'x', text: 'delayed' });
});
