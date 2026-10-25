import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;
const controllers = new Set<AbortController>();
type T = { after: (fn: () => Promise<void>) => void };

const TOTAL = 100;
const BAD: Record<number, string> = { 13: 'Row 13: email is missing.', 47: 'Row 47: date is not a date.' };

async function setup(t: T) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    for (const ac of controllers) ac.abort();
    controllers.clear();
    await app.close();
  });
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201, `create sandbox: ${res.body}`);
  return { app, sb: res.json().id as string };
}

function hook(app: App, sb: string, op: string, payload?: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: (payload ?? {}) as object });
}

async function manual(app: App, sb: string, on = true) {
  const res = await hook(app, sb, 'import-mode', { manual: on });
  assert.ok(res.statusCode < 300, `import-mode: ${res.statusCode} ${res.body}`);
}

async function step(app: App, sb: string, rows: number) {
  const res = await hook(app, sb, 'import-step', { rows });
  assert.ok(res.statusCode < 300, `import-step: ${res.statusCode} ${res.body}`);
}

async function start(app: App, sb: string) {
  const res = await app.inject({ method: 'POST', url: `/api/s/${sb}/imports` });
  assert.ok(res.statusCode < 300, `POST imports: ${res.statusCode} ${res.body}`);
  return res.json() as { id: number; total: number };
}

function events(app: App, sb: string, id: number, headers?: Record<string, string>) {
  return app.inject({ method: 'GET', url: `/api/s/${sb}/imports/${id}/events`, headers });
}

type Frame = { id: number; event: string; data: any };

function parse(body: string): { retry: boolean; frames: Frame[]; rest: string } {
  const retry = body.startsWith('retry: 500\n\n');
  let rest = retry ? body.slice('retry: 500\n\n'.length) : body;
  const frames: Frame[] = [];
  for (;;) {
    const end = rest.indexOf('\n\n');
    if (end < 0) break;
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    const lines = block.split('\n');
    assert.equal(lines.length, 3, `frame must have 3 lines: ${JSON.stringify(block)}`);
    assert.match(lines[0]!, /^id: \d+$/);
    assert.match(lines[1]!, /^event: /);
    assert.match(lines[2]!, /^data: /);
    frames.push({
      id: Number(lines[0]!.slice(4)),
      event: lines[1]!.slice(7),
      data: JSON.parse(lines[2]!.slice(6)),
    });
  }
  return { retry, frames, rest };
}

function expectedFrames(rows: number, complete = rows >= TOTAL): Frame[] {
  const out: Frame[] = [];
  let id = 0;
  for (let r = 1; r <= rows; r++) {
    if (BAD[r]) out.push({ id: ++id, event: 'row-error', data: { row: r, message: BAD[r] } });
    out.push({ id: ++id, event: 'progress', data: { done: r, total: TOTAL } });
  }
  if (complete) out.push({ id: ++id, event: 'complete', data: { imported: 98, failed: 2 } });
  return out;
}

async function until<V>(what: string, fn: () => V | undefined | false, ms = 4000): Promise<V> {
  const end = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > end) assert.fail(`timed out after ${ms} ms waiting for: ${what}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function listen(app: App): Promise<string> {
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  assert.ok(addr && typeof addr === 'object');
  return `http://127.0.0.1:${addr.port}`;
}

type Live = { text: () => string; ended: () => boolean; status: number; headers: Headers };

async function openLive(_t: T, base: string, sb: string, id: number, headers?: Record<string, string>): Promise<Live> {
  const ac = new AbortController();
  controllers.add(ac);
  const res = await Promise.race([
    fetch(`${base}/api/s/${sb}/imports/${id}/events`, { headers, signal: ac.signal }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timed out opening stream')), 4000)),
  ]);
  let text = '';
  let ended = false;
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
        ended = true;
      } catch {
        ended = true;
      }
    })();
  } else {
    ended = true;
  }
  return { text: () => text, ended: () => ended, status: res.status, headers: res.headers };
}

test('POST /imports returns id 1 and total 100; ids increment per sandbox', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  assert.deepEqual(await start(app, sb), { id: 1, total: 100 });
  assert.deepEqual(await start(app, sb), { id: 2, total: 100 });
  const other = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  await manual(app, other);
  assert.equal((await start(app, other)).id, 1);
});

test('stream of unknown id is 404 with error body; replaced id is 404', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const { id } = await start(app, sb);
  const missing = await events(app, sb, id + 1);
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.json(), { error: 'No such import.' });
  const second = await start(app, sb);
  assert.equal(second.id, id + 1);
  const old = await events(app, sb, id);
  assert.equal(old.statusCode, 404);
  assert.deepEqual(old.json(), { error: 'No such import.' });
});

test('completed import: headers, retry preamble, exact frame text, ids across row 13', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const { id } = await start(app, sb);
  await step(app, sb, 100);
  const res = await events(app, sb, id);
  assert.equal(res.statusCode, 200);
  assert.match(String(res.headers['content-type']), /^text\/event-stream/);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.ok(res.body.startsWith('retry: 500\n\n'), `body start: ${JSON.stringify(res.body.slice(0, 40))}`);
  assert.ok(
    res.body.includes('id: 13\nevent: row-error\ndata: {"row":13,"message":"Row 13: email is missing."}\n\n'),
    'exact row-error frame for row 13',
  );
  assert.ok(
    res.body.includes('id: 14\nevent: progress\ndata: {"done":13,"total":100}\n\n'),
    'exact progress frame for row 13',
  );
  assert.ok(res.body.startsWith('retry: 500\n\nid: 1\nevent: progress\ndata: {"done":1,"total":100}\n\n'));
  const parsed = parse(res.body);
  assert.equal(parsed.rest, '');
  assert.deepEqual(parsed.frames, expectedFrames(100));
  assert.equal(parsed.frames.length, 103);
  assert.deepEqual(parsed.frames.at(-1), { id: 103, event: 'complete', data: { imported: 98, failed: 2 } });
});

test('partial replay before completion contains only processed rows', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const { id } = await start(app, sb);
  await step(app, sb, 12);
  const live = await openLive(t, base, sb, id);
  assert.equal(live.status, 200);
  await until('12 progress frames replayed', () => parse(live.text()).frames.length >= 12);
  assert.deepEqual(parse(live.text()).frames, expectedFrames(12));
  assert.equal(live.ended(), false);
});

test('Last-Event-ID 14 excludes id 14 and includes 15', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const { id } = await start(app, sb);
  await step(app, sb, 100);
  const res = await events(app, sb, id, { 'last-event-id': '14' });
  assert.equal(res.statusCode, 200);
  const parsed = parse(res.body);
  assert.equal(parsed.retry, true);
  assert.equal(parsed.frames[0]!.id, 15);
  assert.ok(!parsed.frames.some((f) => f.id <= 14));
  assert.deepEqual(parsed.frames, expectedFrames(100).filter((f) => f.id > 14));
  const at13 = parse((await events(app, sb, id, { 'last-event-id': '13' })).body);
  assert.deepEqual(at13.frames[0], { id: 14, event: 'progress', data: { done: 13, total: 100 } });
  const atEnd = parse((await events(app, sb, id, { 'last-event-id': '103' })).body);
  assert.deepEqual(atEnd.frames, []);
  assert.equal(atEnd.retry, true);
});

test('missing or non-numeric Last-Event-ID replays everything', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const { id } = await start(app, sb);
  await step(app, sb, 100);
  const all = expectedFrames(100);
  assert.deepEqual(parse((await events(app, sb, id)).body).frames, all);
  assert.deepEqual(parse((await events(app, sb, id, { 'last-event-id': 'abc' })).body).frames, all);
  assert.deepEqual(parse((await events(app, sb, id, { 'last-event-id': '' })).body).frames, all);
});

test('step beyond 100 stops at 100 with exactly one complete event', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const { id } = await start(app, sb);
  await step(app, sb, 60);
  await step(app, sb, 60);
  await step(app, sb, 5);
  const parsed = parse((await events(app, sb, id)).body);
  assert.equal(parsed.frames.filter((f) => f.event === 'complete').length, 1);
  assert.equal(parsed.frames.filter((f) => f.event === 'progress').length, 100);
  assert.equal(parsed.frames.filter((f) => f.event === 'row-error').length, 2);
  assert.deepEqual(parsed.frames, expectedFrames(100));
  assert.deepEqual(parsed.frames.at(-2)?.data, { done: 100, total: 100 });
});

test('live stream receives events after a step and ends after completion', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const { id } = await start(app, sb);
  const live = await openLive(t, base, sb, id);
  assert.equal(live.status, 200);
  assert.match(live.headers.get('content-type') ?? '', /^text\/event-stream/);
  assert.equal(live.headers.get('cache-control'), 'no-store');
  await until('retry preamble', () => live.text().startsWith('retry: 500\n\n'));
  assert.deepEqual(parse(live.text()).frames, []);
  await step(app, sb, 14);
  await until('14 rows streamed', () => parse(live.text()).frames.length >= 15);
  assert.deepEqual(parse(live.text()).frames, expectedFrames(14));
  assert.equal(live.ended(), false);
  await step(app, sb, 200);
  await until('stream ended', () => live.ended());
  const parsed = parse(live.text());
  assert.deepEqual(parsed.frames, expectedFrames(100));
  assert.equal(parsed.rest, '');
});

test('reconnect with Last-Event-ID on a live stream gets only newer events', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const { id } = await start(app, sb);
  await step(app, sb, 20);
  const live = await openLive(t, base, sb, id, { 'Last-Event-ID': '14' });
  await until('replay after 14', () => parse(live.text()).frames.length >= 6);
  assert.deepEqual(parse(live.text()).frames, expectedFrames(20).filter((f) => f.id > 14));
  await step(app, sb, 1);
  await until('row 21 live', () => parse(live.text()).frames.some((f) => f.id === 22));
  assert.deepEqual(parse(live.text()).frames.at(-1), { id: 22, event: 'progress', data: { done: 21, total: 100 } });
});

test('import-drop ends two open streams and returns 2; none open returns 0', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const { id } = await start(app, sb);
  assert.deepEqual((await hook(app, sb, 'import-drop')).json(), { dropped: 0 });
  const a = await openLive(t, base, sb, id);
  const b = await openLive(t, base, sb, id);
  await until('both preambles', () => a.text().startsWith('retry') && b.text().startsWith('retry'));
  const dropped = await hook(app, sb, 'import-drop');
  assert.equal(dropped.statusCode, 200);
  assert.deepEqual(dropped.json(), { dropped: 2 });
  await until('both streams ended', () => a.ended() && b.ended());
  assert.deepEqual((await hook(app, sb, 'import-drop')).json(), { dropped: 0 });
});

test('after a drop the client can reconnect and resume from its last id', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const { id } = await start(app, sb);
  await step(app, sb, 5);
  const first = await openLive(t, base, sb, id);
  await until('5 frames', () => parse(first.text()).frames.length >= 5);
  await hook(app, sb, 'import-drop');
  await until('first ended', () => first.ended());
  await step(app, sb, 2);
  const second = await openLive(t, base, sb, id, { 'Last-Event-ID': '5' });
  await until('resumed frames', () => parse(second.text()).frames.length >= 2);
  assert.deepEqual(parse(second.text()).frames, expectedFrames(7).filter((f) => f.id > 5));
});

test('second POST ends the first job open stream and old id becomes 404', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const first = await start(app, sb);
  const live = await openLive(t, base, sb, first.id);
  await until('preamble', () => live.text().startsWith('retry'));
  const second = await start(app, sb);
  assert.equal(second.id, first.id + 1);
  await until('first stream ended', () => live.ended());
  assert.equal((await events(app, sb, first.id)).statusCode, 404);
  await step(app, sb, 1);
  const fresh = await openLive(t, base, sb, second.id);
  await until('new job replay', () => parse(fresh.text()).frames.length >= 1);
  assert.deepEqual(parse(fresh.text()).frames, expectedFrames(1));
});

test('manual mode does not advance by itself; manual false restores automatic advance', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  const first = await start(app, sb);
  const idle = await openLive(t, base, sb, first.id);
  await new Promise((r) => setTimeout(r, 250));
  assert.deepEqual(parse(idle.text()).frames, []);
  await manual(app, sb, false);
  const second = await start(app, sb);
  const live = await openLive(t, base, sb, second.id);
  await until('automatic job completes', () => live.ended(), 8000);
  assert.deepEqual(parse(live.text()).frames, expectedFrames(100));
});

test('automatic mode advances on its own and completes in a few seconds', async (t) => {
  const { app, sb } = await setup(t);
  const base = await listen(app);
  const { id } = await start(app, sb);
  const live = await openLive(t, base, sb, id);
  await until('some progress', () => parse(live.text()).frames.length >= 1, 2000);
  assert.equal(live.ended(), false);
  await until('stream ended', () => live.ended(), 8000);
  const parsed = parse(live.text());
  assert.deepEqual(parsed.frames, expectedFrames(100));
});

test('reset clears job and manual mode: next import is id 1 and runs automatically', async (t) => {
  const { app, sb } = await setup(t);
  await manual(app, sb);
  const base = await listen(app);
  await start(app, sb);
  const second = await start(app, sb);
  assert.equal(second.id, 2);
  const res = await hook(app, sb, 'reset');
  assert.ok(res.statusCode < 300, `reset: ${res.statusCode}`);
  assert.equal((await events(app, sb, 2)).statusCode, 404);
  const fresh = await start(app, sb);
  assert.deepEqual(fresh, { id: 1, total: 100 });
  const live = await openLive(t, base, sb, 1);
  await until('automatic progress after reset', () => parse(live.text()).frames.length >= 1, 2000);
  await until('automatic completion after reset', () => live.ended(), 8000);
  assert.deepEqual(parse(live.text()).frames, expectedFrames(100));
});
