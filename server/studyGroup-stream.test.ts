import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;
type T = { after: (fn: () => Promise<void>) => void };
type Frame = { event: string; data: any };

const controllers = new Set<AbortController>();

async function setup(t: T) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    for (const ac of controllers) ac.abort();
    controllers.clear();
    await app.close();
  });
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201, `create sandbox: ${res.body}`);
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  assert.ok(addr && typeof addr === 'object');
  return { app, base: `http://127.0.0.1:${addr.port}`, sb: res.json().id as string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<V>(what: string, fn: () => V | undefined | false, ms = 3000): Promise<V> {
  const end = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > end) assert.fail(`timed out after ${ms} ms waiting for: ${what}`);
    await sleep(10);
  }
}

function parseFrames(text: string): Frame[] {
  const out: Frame[] = [];
  let rest = text;
  for (;;) {
    const end = rest.indexOf('\n\n');
    if (end < 0) break;
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    const lines = block.split('\n');
    assert.equal(lines.length, 2, `frame must have 2 lines: ${JSON.stringify(block)}`);
    assert.match(lines[0]!, /^event: \S+$/);
    assert.match(lines[1]!, /^data: /);
    out.push({ event: lines[0]!.slice(7), data: JSON.parse(lines[1]!.slice(6)) });
  }
  return out;
}

type Live = {
  status: number;
  headers: Headers;
  text: () => string;
  frames: () => Frame[];
  ended: () => boolean;
  close: () => void;
  next: (what: string, ms?: number) => Promise<Frame>;
};

async function open(base: string, sb: string, name: string): Promise<Live> {
  const ac = new AbortController();
  controllers.add(ac);
  const res = await Promise.race([
    fetch(`${base}/api/s/${sb}/study-group/stream?name=${encodeURIComponent(name)}`, { signal: ac.signal }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timed out opening stream')), 4000)),
  ]);
  let text = '';
  let ended = false;
  let consumed = 0;
  if (res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    (async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
        }
      } catch {}
      ended = true;
    })();
  } else {
    ended = true;
  }
  const live: Live = {
    status: res.status,
    headers: res.headers,
    text: () => text,
    frames: () => parseFrames(text),
    ended: () => ended,
    close: () => ac.abort(),
    next: async (what, ms = 3000) => {
      const f = await until(what, () => live.frames()[consumed], ms);
      consumed++;
      return f;
    },
  };
  return live;
}

async function openReady(base: string, sb: string, name: string) {
  const s = await open(base, sb, name);
  assert.equal(s.status, 200);
  const m = await s.next('initial messages');
  const ty = await s.next('initial typing');
  return { s, initial: [m, ty] };
}

function post(base: string, sb: string, path: string, body: unknown) {
  return fetch(`${base}/api/s/${sb}/study-group/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function typing(base: string, sb: string, name: string) {
  const res = await post(base, sb, 'typing', { name });
  assert.equal(res.status, 200, `typing ${name}`);
}

async function signals(base: string, sb: string): Promise<number> {
  const res = await fetch(`${base}/__test__/s/${sb}/typing-signals`);
  assert.equal(res.status, 200);
  return ((await res.json()) as { signals: number }).signals;
}

test('initial events are exactly framed and the stream has SSE headers', async (t) => {
  const { base, sb } = await setup(t);
  const s = await open(base, sb, 'Ola');
  assert.equal(s.status, 200);
  assert.match(s.headers.get('content-type') ?? '', /^text\/event-stream/);
  assert.equal(s.headers.get('cache-control'), 'no-store');
  const expected = 'event: messages\ndata: []\n\nevent: typing\ndata: []\n\n';
  await until('both initial frames', () => s.text().length >= expected.length);
  assert.equal(s.text(), expected);
});

test('typing: only a new typer broadcasts, repeats count a signal, names keep start order', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  await typing(base, sb, 'Ola');
  assert.deepEqual(await s.next('typing Ola'), { event: 'typing', data: ['Ola'] });
  await typing(base, sb, ' Ola ');
  await typing(base, sb, 'Ola');
  assert.equal(await signals(base, sb), 3);
  await typing(base, sb, 'Ben');
  assert.deepEqual(await s.next('typing Ola,Ben'), { event: 'typing', data: ['Ola', 'Ben'] });
  assert.equal(await signals(base, sb), 4);
  assert.equal(s.frames().length, 2 + 2, 'repeat signals must not broadcast');
});

test('typing and stop validation: blank, missing and non-string names are 400 and not counted', async (t) => {
  const { base, sb } = await setup(t);
  for (const path of ['typing', 'typing/stop']) {
    for (const body of [{}, { name: '   ' }, { name: 5 }, { name: null }]) {
      const res = await post(base, sb, path, body);
      assert.equal(res.status, 400, `${path} ${JSON.stringify(body)}`);
      assert.deepEqual(await res.json(), { error: 'name is required' });
    }
  }
  assert.equal(await signals(base, sb), 0);
});

test('stop removes a typer and broadcasts; stopping a non-typer broadcasts nothing', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  await typing(base, sb, 'Ola');
  await s.next('typing Ola');
  const none = await post(base, sb, 'typing/stop', { name: 'Ben' });
  assert.equal(none.status, 200);
  assert.deepEqual(await none.json(), { ok: true });
  await typing(base, sb, 'Marker');
  assert.deepEqual(await s.next('marker is next frame'), { event: 'typing', data: ['Ola', 'Marker'] });
  const stop = await post(base, sb, 'typing/stop', { name: ' Ola ' });
  assert.deepEqual(await stop.json(), { ok: true });
  assert.deepEqual(await s.next('typing after stop', 1000), { event: 'typing', data: ['Marker'] });
  await typing(base, sb, 'Ola');
  assert.deepEqual(await s.next('Ola retypes'), { event: 'typing', data: ['Marker', 'Ola'] });
});

test('message: typing broadcast without the sender comes before the message event; ids start at 1', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  await typing(base, sb, 'Ola');
  await typing(base, sb, 'Ben');
  await s.next('typing Ola');
  await s.next('typing Ola,Ben');
  const res = await post(base, sb, 'messages', { name: ' Ola ', text: ' Page 12? ' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id: 1, name: 'Ola', text: 'Page 12?' });
  assert.deepEqual(await s.next('typing without sender'), { event: 'typing', data: ['Ben'] });
  assert.deepEqual(await s.next('message event'), { event: 'message', data: { id: 1, name: 'Ola', text: 'Page 12?' } });
  const res2 = await post(base, sb, 'messages', { name: 'Ola', text: 'Thanks' });
  assert.deepEqual(await res2.json(), { id: 2, name: 'Ola', text: 'Thanks' });
  assert.deepEqual(await s.next('second message directly'), { event: 'message', data: { id: 2, name: 'Ola', text: 'Thanks' } });
  const late = await openReady(base, sb, 'Late');
  assert.deepEqual(late.initial, [
    { event: 'messages', data: [{ id: 1, name: 'Ola', text: 'Page 12?' }, { id: 2, name: 'Ola', text: 'Thanks' }] },
    { event: 'typing', data: ['Ben'] },
  ]);
});

test('message from a non-typer sends only the message event; invalid bodies are 400 and send nothing', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  for (const body of [{}, { name: 'Ola' }, { text: 'hi' }, { name: ' ', text: 'hi' }, { name: 'Ola', text: '  ' }, { name: 'Ola', text: 4 }]) {
    const res = await post(base, sb, 'messages', body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(await res.json(), { error: 'name and text are required' });
  }
  const ok = await post(base, sb, 'messages', { name: 'Ben', text: 'first' });
  assert.deepEqual(await ok.json(), { id: 1, name: 'Ben', text: 'first' });
  assert.deepEqual(await s.next('message is next frame'), { event: 'message', data: { id: 1, name: 'Ben', text: 'first' } });
});

test('closing a stream stops its typer only when no other open stream has the same name', async (t) => {
  const { base, sb } = await setup(t);
  const { s: watcher } = await openReady(base, sb, 'Watcher');
  const { s: first } = await openReady(base, sb, 'Ola');
  const { s: second } = await openReady(base, sb, 'Ola');
  await typing(base, sb, 'Ola');
  assert.deepEqual(await watcher.next('Ola typing'), { event: 'typing', data: ['Ola'] });
  first.close();
  await until('first stream ended', () => first.ended());
  await typing(base, sb, 'Marker');
  assert.deepEqual(await watcher.next('marker, so Ola stayed'), { event: 'typing', data: ['Ola', 'Marker'] });
  second.close();
  assert.deepEqual(await watcher.next('Ola stopped after last close', 1000), { event: 'typing', data: ['Marker'] });
});

test('closing the stream of a name that is not typing broadcasts nothing', async (t) => {
  const { base, sb } = await setup(t);
  const { s: watcher } = await openReady(base, sb, 'Watcher');
  const { s: ola } = await openReady(base, sb, 'Ola');
  ola.close();
  await until('ola stream ended', () => ola.ended());
  await typing(base, sb, 'Marker');
  assert.deepEqual(await watcher.next('marker is next frame'), { event: 'typing', data: ['Marker'] });
});

test('reset ends open streams, clears messages, typing and signals; sandboxes are independent', async (t) => {
  const { app, base, sb } = await setup(t);
  const other = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const { s } = await openReady(base, sb, 'Watcher');
  const { s: o } = await openReady(base, other, 'Watcher');
  await typing(base, sb, 'Ola');
  await post(base, sb, 'messages', { name: 'Ben', text: 'hello' });
  await typing(base, other, 'Zed');
  assert.equal(await signals(base, sb), 1);
  assert.deepEqual(await o.next('other typing Zed'), { event: 'typing', data: ['Zed'] });
  assert.equal(o.frames().length, 3, 'other sandbox saw nothing from sb');
  const res = await fetch(`${base}/__test__/s/${sb}/reset`, { method: 'POST' });
  assert.ok(res.status < 300, `reset ${res.status}`);
  await until('stream ended by reset', () => s.ended());
  assert.equal(o.ended(), false);
  assert.equal(await signals(base, sb), 0);
  assert.equal(await signals(base, other), 1);
  const fresh = await openReady(base, sb, 'Fresh');
  assert.deepEqual(fresh.initial, [
    { event: 'messages', data: [] },
    { event: 'typing', data: [] },
  ]);
  const msg = await post(base, sb, 'messages', { name: 'Ben', text: 'again' });
  assert.equal(((await msg.json()) as { id: number }).id, 1);
  const otherMsg = await post(base, other, 'messages', { name: 'Zed', text: 'x' });
  assert.equal(((await otherMsg.json()) as { id: number }).id, 1);
});

test('typing expires about 3 s after the signal and every stream gets the update', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  const { s: s2 } = await openReady(base, sb, 'Other');
  const t0 = Date.now();
  await typing(base, sb, 'Ola');
  await s.next('typing Ola');
  assert.deepEqual(await s.next('expiry', 6000), { event: 'typing', data: [] });
  const elapsed = Date.now() - t0;
  assert.ok(elapsed >= 2500 && elapsed <= 4500, `expired after ${elapsed} ms`);
  await s2.next('typing Ola');
  assert.deepEqual(await s2.next('expiry on second stream'), { event: 'typing', data: [] });
});

test('a repeat signal at about 2 s restarts the 3 s expiry', async (t) => {
  const { base, sb } = await setup(t);
  const { s } = await openReady(base, sb, 'Watcher');
  await typing(base, sb, 'Ola');
  await s.next('typing Ola');
  await sleep(2000);
  const t1 = Date.now();
  await typing(base, sb, 'Ola');
  await sleep(1500);
  assert.equal(s.frames().length, 3, 'must still be typing 3.5 s after the first signal');
  assert.deepEqual(await s.next('expiry after repeat', 6000), { event: 'typing', data: [] });
  const elapsed = Date.now() - t1;
  assert.ok(elapsed >= 2500 && elapsed <= 4500, `expired ${elapsed} ms after the last signal`);
  assert.equal(await signals(base, sb), 2);
});
