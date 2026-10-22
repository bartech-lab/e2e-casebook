import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;
type After = { after: (fn: () => Promise<void>) => void };
type Card = { id: number; title: string; description: string; status: string; version: number; updatedBy: string; dueDate: string | null };
type Mail = { id: number; to: string; subject: string; text: string; link: string; receivedAt: unknown };
type Res = Awaited<ReturnType<App['inject']>>;

async function makeApp(t: After, testHooks = true): Promise<App> {
  const app = await buildApp({ dbPath: ':memory:', testHooks });
  t.after(async () => {
    await app.close();
  });
  return app;
}

async function newSandbox(app: App): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201, `create sandbox: ${res.body}`);
  return res.json().id as string;
}

async function setup(t: After) {
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

function hook(app: App, sb: string, op: string, payload: unknown = {}) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: payload as object });
}

async function reset(app: App, sb: string) {
  const r = await hook(app, sb, 'reset', {});
  assert.equal(r.statusCode, 200, `reset: ${r.statusCode} ${r.body}`);
}

function setCookies(res: Res): string[] {
  const h = res.headers['set-cookie'];
  if (h === undefined) return [];
  return Array.isArray(h) ? h : [h];
}

function cookieNamed(res: Res, name: string): string | undefined {
  return setCookies(res).find((c) => c.startsWith(`${name}=`));
}

function cookieValue(setCookie: string): string {
  return (setCookie.split(';')[0] ?? '').split('=').slice(1).join('=');
}

function cookieHeader(sb: string, value: string): Record<string, string> {
  return { cookie: `epg_session_${sb}=${value}` };
}

async function getCards(app: App, sb: string, q?: string): Promise<Card[]> {
  const url = q === undefined ? '/cards' : `/cards?q=${encodeURIComponent(q)}`;
  const res = await api(app, sb, 'GET', url);
  assert.equal(res.statusCode, 200, `GET ${url}: ${res.body}`);
  return res.json().cards as Card[];
}

async function mails(app: App, sb: string): Promise<Mail[]> {
  const res = await api(app, sb, 'GET', '/mail');
  assert.equal(res.statusCode, 200, `GET /mail: ${res.body}`);
  return res.json().messages as Mail[];
}

async function requestLink(app: App, sb: string, email: string, headers?: Record<string, string>): Promise<Mail> {
  const before = (await mails(app, sb)).length;
  const r = await api(app, sb, 'POST', '/auth/request', { email }, headers);
  assert.equal(r.statusCode, 202, `auth/request: ${r.statusCode} ${r.body}`);
  const after = await mails(app, sb);
  assert.equal(after.length, before + 1, 'one mail per request');
  return after[0] as Mail;
}

function verifyPath(link: string): string {
  const u = new URL(link);
  return u.pathname + u.search;
}

function tokenOf(link: string): string {
  return new URL(link).searchParams.get('token') ?? '';
}

async function loginViaLink(app: App, sb: string, email = 'a@example.com') {
  const mail = await requestLink(app, sb, email);
  const v = await app.inject({ method: 'GET', url: verifyPath(mail.link) });
  const c = cookieNamed(v, `epg_session_${sb}`);
  assert.ok(c, `verify should set session cookie; got ${v.statusCode} ${JSON.stringify(v.headers)}`);
  return { mail, value: cookieValue(c), verifyRes: v };
}

// ---------- cards: titles ----------

test('POST /cards creates card with defaults, trimmed title and by', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'POST', '/cards', { title: '  Brand new  ', by: '  Ann ' });
  assert.equal(res.statusCode, 201, res.body);
  const c = res.json() as Card;
  assert.equal(c.id, 5, 'next id after 4 defaults');
  assert.equal(c.title, 'Brand new');
  assert.equal(c.version, 1);
  assert.equal(c.updatedBy, 'Ann');
  assert.equal(c.status, 'todo');
  assert.equal(c.description, '');
  assert.equal(c.dueDate, null);
  const res2 = await api(app, sb, 'POST', '/cards', { title: 'Another' });
  assert.equal((res2.json() as Card).updatedBy, 'anonymous');
});

test('duplicate title with case and whitespace variant -> 409 with existing card, nothing created', async (t) => {
  const { app, sb } = await setup(t);
  const before = await getCards(app, sb);
  const res = await api(app, sb, 'POST', '/cards', { title: '  write THE release notes ' });
  assert.equal(res.statusCode, 409, `expected 409, got ${res.statusCode}: ${res.body}`);
  const body = res.json();
  assert.ok(typeof body.error === 'string' && body.error.length > 0, 'error message present');
  assert.equal(body.existing.title, 'Write the release notes');
  const original = before.find((c) => c.title === 'Write the release notes');
  assert.deepEqual(body.existing, original, 'existing is the original card');
  assert.equal((await getCards(app, sb)).length, before.length, 'nothing created');
});

test('duplicate title is detected against a card created by POST, not only defaults', async (t) => {
  const { app, sb } = await setup(t);
  assert.equal((await api(app, sb, 'POST', '/cards', { title: 'Mixed Case' })).statusCode, 201);
  const dup = await api(app, sb, 'POST', '/cards', { title: 'mIXED cASE' });
  assert.equal(dup.statusCode, 409, `case variant of a created card accepted: ${dup.body}`);
  assert.equal((await getCards(app, sb)).filter((c) => c.title.toLowerCase() === 'mixed case').length, 1);
});

test('same title in a different sandbox is allowed', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  assert.equal((await api(app, sb, 'POST', '/cards', { title: 'Shared name' })).statusCode, 201);
  const res = await api(app, sb2, 'POST', '/cards', { title: 'Shared name' });
  assert.equal(res.statusCode, 201, `duplicate check leaked across sandboxes: ${res.body}`);
  const res3 = await api(app, sb2, 'POST', '/cards', { title: 'Write the release notes' });
  assert.equal(res3.statusCode, 409, 'defaults still unique within sandbox 2');
});

test('PATCH title onto another card title -> 409 and nothing changes; own title with other case allowed', async (t) => {
  const { app, sb } = await setup(t);
  const before = await getCards(app, sb);
  const target = before.find((c) => c.title === 'Fix the login redirect') as Card;
  const other = before.find((c) => c.title === 'Write the release notes') as Card;
  const res = await api(app, sb, 'PATCH', `/cards/${target.id}`, { title: ' WRITE the release NOTES' });
  assert.equal(res.statusCode, 409, `rename onto another title accepted: ${res.statusCode} ${res.body}`);
  assert.deepEqual(res.json().existing, other);
  assert.deepEqual(await getCards(app, sb), before, 'no card changed');

  const ok = await api(app, sb, 'PATCH', `/cards/${target.id}`, { title: 'FIX THE LOGIN REDIRECT' });
  assert.equal(ok.statusCode, 200, `case-only self rename must be allowed: ${ok.body}`);
  assert.equal(ok.json().title, 'FIX THE LOGIN REDIRECT');
});

test('invalid titles -> 400 and nothing created', async (t) => {
  const { app, sb } = await setup(t);
  const n = (await getCards(app, sb)).length;
  for (const title of ['', '   ', 'x'.repeat(81), undefined, 5]) {
    const res = await api(app, sb, 'POST', '/cards', { title });
    assert.equal(res.statusCode, 400, `title ${JSON.stringify(title)} -> ${res.statusCode}`);
  }
  assert.equal((await api(app, sb, 'POST', '/cards', { title: 'y'.repeat(80) })).statusCode, 201, '80 chars ok');
  assert.equal((await getCards(app, sb)).length, n + 1);
});

// ---------- cards: dueDate ----------

test('POST dueDate: valid accepted, invalid calendar dates rejected without creating', async (t) => {
  const { app, sb } = await setup(t);
  const ok = await api(app, sb, 'POST', '/cards', { title: 'Leap', dueDate: '2028-02-29' });
  assert.equal(ok.statusCode, 201, ok.body);
  assert.equal(ok.json().dueDate, '2028-02-29');
  const n = (await getCards(app, sb)).length;
  for (const d of ['2026-02-30', '2027-02-29', '2026-2-3', '2026-10-25T00:00', '2026-13-01', '2026-00-10', '2026-04-31', 'tomorrow', 20261025]) {
    const res = await api(app, sb, 'POST', '/cards', { title: `Bad ${String(d)}`, dueDate: d });
    assert.equal(res.statusCode, 400, `dueDate ${JSON.stringify(d)} -> ${res.statusCode}`);
  }
  assert.equal((await getCards(app, sb)).length, n, 'nothing created by invalid posts');
  const nul = await api(app, sb, 'POST', '/cards', { title: 'Null due', dueDate: null });
  assert.equal(nul.statusCode, 201);
  assert.equal(nul.json().dueDate, null);
});

test('PATCH dueDate: set, keep when absent, clear with null, invalid -> 400 unchanged', async (t) => {
  const { app, sb } = await setup(t);
  const set = await api(app, sb, 'PATCH', '/cards/1', { dueDate: '2026-10-25' });
  assert.equal(set.statusCode, 200, set.body);
  assert.equal(set.json().dueDate, '2026-10-25');

  const keep = await api(app, sb, 'PATCH', '/cards/1', { description: 'changed' });
  assert.equal(keep.statusCode, 200, keep.body);
  assert.equal(keep.json().dueDate, '2026-10-25', 'dueDate wiped by PATCH that does not mention it');
  assert.equal(keep.json().description, 'changed');

  const bad = await api(app, sb, 'PATCH', '/cards/1', { dueDate: '2026-02-30' });
  assert.equal(bad.statusCode, 400, bad.body);
  const bad2 = await api(app, sb, 'PATCH', '/cards/1', { dueDate: '2026-2-3' });
  assert.equal(bad2.statusCode, 400, bad2.body);
  const after = (await getCards(app, sb)).find((c) => c.id === 1) as Card;
  assert.equal(after.dueDate, '2026-10-25', 'invalid PATCH must not change dueDate');

  const clear = await api(app, sb, 'PATCH', '/cards/1', { dueDate: null });
  assert.equal(clear.statusCode, 200, clear.body);
  assert.equal(clear.json().dueDate, null);
  assert.equal(((await getCards(app, sb)).find((c) => c.id === 1) as Card).dueDate, null);
});

// ---------- cards: search ----------

test('GET /cards?q matches title case-insensitively, not description, sorted by id', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'POST', '/cards', { title: 'Alpha', description: 'zebra stripes' });
  await api(app, sb, 'POST', '/cards', { title: 'The ZEBRA crossing' });
  await api(app, sb, 'POST', '/cards', { title: 'zebra first?' });
  const r = await getCards(app, sb, 'ZeBrA');
  assert.deepEqual(r.map((c) => c.title), ['The ZEBRA crossing', 'zebra first?'], 'description match or case-sensitivity bug');
  const ids = r.map((c) => c.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b), 'sorted by id');
  const sub = await getCards(app, sb, 'release');
  assert.deepEqual(sub.map((c) => c.title), ['Write the release notes'], 'substring match');
  assert.deepEqual(await getCards(app, sb, 'no-such-title-xyz'), []);
});

test('GET /cards?q empty or whitespace returns all cards', async (t) => {
  const { app, sb } = await setup(t);
  const all = await getCards(app, sb);
  assert.deepEqual(await getCards(app, sb, ''), all);
  assert.deepEqual(await getCards(app, sb, '   '), all);
});

// ---------- flags ----------

test('flags: default null, set per sandbox, invalid -> 400, reset clears', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  const none = { createCard: null, draw: null };
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), none);
  const set = await hook(app, sb, 'flags', { createCard: 'dialog' });
  assert.equal(set.statusCode, 200, set.body);
  assert.deepEqual(set.json(), { createCard: 'dialog', draw: null });
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), { createCard: 'dialog', draw: null });
  assert.deepEqual((await api(app, sb2, 'GET', '/flags')).json(), none, 'flag leaked to other sandbox');
  for (const bad of ['popup', 1, true, undefined]) {
    const r = await hook(app, sb, 'flags', { createCard: bad });
    assert.equal(r.statusCode, 400, `createCard ${JSON.stringify(bad)} -> ${r.statusCode}`);
  }
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), { createCard: 'dialog', draw: null }, 'invalid must not change state');
  assert.equal((await hook(app, sb, 'flags', { createCard: 'inline' })).statusCode, 200);
  await reset(app, sb);
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), none, 'reset must clear flag');
  const nul = await hook(app, sb, 'flags', { createCard: null });
  assert.equal(nul.statusCode, 200);
  assert.deepEqual(nul.json(), none);
});

test('flags: draw is set alone, keeps the pin, rejects bad values, and resets', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  assert.equal((await hook(app, sb, 'flags', { createCard: 'inline' })).statusCode, 200);
  const set = await hook(app, sb, 'flags', { draw: 'dialog' });
  assert.equal(set.statusCode, 200, set.body);
  assert.deepEqual(set.json(), { createCard: 'inline', draw: 'dialog' }, 'setting draw must keep the pin');
  assert.deepEqual((await api(app, sb2, 'GET', '/flags')).json(), { createCard: null, draw: null }, 'draw leaked to other sandbox');
  assert.deepEqual((await hook(app, sb, 'flags', { createCard: null })).json(), { createCard: null, draw: 'dialog' }, 'clearing the pin must keep draw');
  for (const bad of ['popup', 0, false]) {
    const r = await hook(app, sb, 'flags', { draw: bad });
    assert.equal(r.statusCode, 400, `draw ${JSON.stringify(bad)} -> ${r.statusCode}`);
  }
  const mixed = await hook(app, sb, 'flags', { createCard: 'inline', draw: 'popup' });
  assert.equal(mixed.statusCode, 400, 'one bad key rejects the whole body');
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), { createCard: null, draw: 'dialog' }, 'invalid must not change state');
  assert.equal((await hook(app, sb, 'flags', {})).statusCode, 400, 'empty body');
  await reset(app, sb);
  assert.deepEqual((await api(app, sb, 'GET', '/flags')).json(), { createCard: null, draw: null }, 'reset must clear draw');
});

// ---------- playlist ----------

test('playlist: default order, saves a full reordering per sandbox, rejects partial or repeated lists, reset restores', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  const ids = () => api(app, sb, 'GET', '/playlist').then((r) => (r.json() as { songs: { id: number }[] }).songs.map((s) => s.id));
  assert.deepEqual(await ids(), [1, 2, 3, 4, 5]);
  for (const order of [[1, 2, 3, 4], [1, 2, 3, 4, 5, 1], [1, 1, 2, 3, 4], [1, 2, 3, 4, 9], '1,2,3,4,5', undefined]) {
    assert.equal((await api(app, sb, 'PUT', '/playlist', { order })).statusCode, 400, JSON.stringify(order));
  }
  assert.deepEqual(await ids(), [1, 2, 3, 4, 5], 'a rejected order was saved');
  const put = await api(app, sb, 'PUT', '/playlist', { order: [3, 1, 2, 5, 4] });
  assert.equal(put.statusCode, 200, put.body);
  assert.deepEqual(await ids(), [3, 1, 2, 5, 4]);
  const other = (await api(app, sb2, 'GET', '/playlist')).json() as { songs: { id: number }[] };
  assert.deepEqual(other.songs.map((s) => s.id), [1, 2, 3, 4, 5], 'playlist leaked across sandboxes');
  await reset(app, sb);
  assert.deepEqual(await ids(), [1, 2, 3, 4, 5], 'reset left the order behind');
});

// ---------- top-ups ----------

test('top-ups: card checks, CORS for the card form, decline charges nothing, tokens pay once, reset clears', async (t) => {
  const { app, sb } = await setup(t);
  const token = async (number: string, expiry = '12/35', cvc = '123') =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/card-tokens`, headers: { 'content-type': 'text/plain' }, payload: JSON.stringify({ number, expiry, cvc }) });
  for (const [number, expiry, cvc, field] of [
    ['4242 4242 4242 4241', '12/35', '123', 'number'],
    ['4242 4242 4242 424', '12/35', '123', 'number'],
    ['4242 4242 4242 4242', '01/20', '123', 'expiry'],
    ['4242 4242 4242 4242', '00/35', '123', 'expiry'],
    ['4242 4242 4242 4242', '12/35', '12', 'cvc'],
  ]) {
    const res = await token(number!, expiry, cvc);
    assert.equal(res.statusCode, 400, `${number} ${expiry} ${cvc}`);
    assert.equal(res.json().field, field);
  }
  const good = await token('4242 4242 4242 4242');
  assert.equal(good.statusCode, 201, good.body);
  assert.equal(good.headers['access-control-allow-origin'], '*');
  assert.equal(good.json().last4, '4242');
  const pay = (amount: unknown, tok: unknown) => api(app, sb, 'POST', '/topups', { amount, token: tok });
  assert.equal((await pay(99, good.json().token)).statusCode, 400, 'amount below 1.00 PLN');
  const paid = await pay(2000, good.json().token);
  assert.equal(paid.statusCode, 200, paid.body);
  assert.deepEqual(paid.json(), { balance: 2000, topups: [{ amount: 2000, last4: '4242' }] });
  assert.equal((await pay(2000, good.json().token)).statusCode, 400, 'a used token paid again');
  const declined = await token('4000 0000 0000 0002');
  assert.equal((await pay(5000, declined.json().token)).statusCode, 402);
  assert.equal((await api(app, sb, 'GET', '/topups')).json().balance, 2000, 'a declined card was charged');
  await reset(app, sb);
  assert.deepEqual((await api(app, sb, 'GET', '/topups')).json(), { balance: 0, topups: [] });
});

// ---------- draft ----------

test('draft: empty by default, keeps only newer versions, validates, reset clears', async (t) => {
  const { app, sb } = await setup(t);
  assert.deepEqual((await api(app, sb, 'GET', '/draft')).json(), { text: '', version: 0 });
  assert.deepEqual((await api(app, sb, 'PUT', '/draft', { text: 'Dear Ann, thanks.', version: 2 })).json(), { text: 'Dear Ann, thanks.', version: 2 });
  assert.deepEqual((await api(app, sb, 'PUT', '/draft', { text: 'Dear Ann,', version: 1 })).json(), { text: 'Dear Ann, thanks.', version: 2 }, 'an older version replaced a newer one');
  assert.deepEqual((await api(app, sb, 'PUT', '/draft', { text: 'Same version', version: 2 })).json(), { text: 'Dear Ann, thanks.', version: 2 });
  for (const body of [{ text: 'x', version: 0 }, { text: 'x', version: 1.5 }, { text: 5, version: 3 }, { text: 'x'.repeat(5001), version: 3 }]) {
    assert.equal((await api(app, sb, 'PUT', '/draft', body)).statusCode, 400, JSON.stringify(body).slice(0, 40));
  }
  await reset(app, sb);
  assert.deepEqual((await api(app, sb, 'GET', '/draft')).json(), { text: '', version: 0 });
});

// ---------- settings / notifications ----------

test('settings: defaults, save with trimmed name, per sandbox, reset restores defaults', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  assert.deepEqual((await api(app, sb, 'GET', '/settings')).json(), { displayName: '', theme: 'light', emailDigest: false });
  const put = await api(app, sb, 'PUT', '/settings', { displayName: '  Zed  ', theme: 'dark', emailDigest: true });
  assert.equal(put.statusCode, 200, put.body);
  assert.deepEqual(put.json(), { displayName: 'Zed', theme: 'dark', emailDigest: true });
  assert.deepEqual((await api(app, sb, 'GET', '/settings')).json(), { displayName: 'Zed', theme: 'dark', emailDigest: true });
  assert.deepEqual((await api(app, sb2, 'GET', '/settings')).json(), { displayName: '', theme: 'light', emailDigest: false }, 'settings leaked across sandboxes');
  await reset(app, sb);
  assert.deepEqual((await api(app, sb, 'GET', '/settings')).json(), { displayName: '', theme: 'light', emailDigest: false }, 'reset left settings behind');
});

test('settings: invalid payloads -> 400 and nothing saved; 40 char boundary after trim', async (t) => {
  const { app, sb } = await setup(t);
  const valid = { displayName: 'Ok', theme: 'dark', emailDigest: true };
  const bads: unknown[] = [
    { theme: 'dark', emailDigest: true },
    { displayName: 'Ok', emailDigest: true },
    { displayName: 'Ok', theme: 'dark' },
    { ...valid, theme: 'blue' },
    { ...valid, emailDigest: 'yes' },
    { ...valid, displayName: 5 },
    { ...valid, displayName: 'n'.repeat(41) },
    { ...valid, displayName: `  ${'n'.repeat(41)}  ` },
  ];
  for (const b of bads) {
    const r = await api(app, sb, 'PUT', '/settings', b);
    assert.equal(r.statusCode, 400, `${JSON.stringify(b)} -> ${r.statusCode}`);
  }
  assert.deepEqual((await api(app, sb, 'GET', '/settings')).json(), { displayName: '', theme: 'light', emailDigest: false }, 'invalid PUT saved something');
  const edge = await api(app, sb, 'PUT', '/settings', { ...valid, displayName: `  ${'n'.repeat(40)}  ` });
  assert.equal(edge.statusCode, 200, `40 chars after trim must be accepted: ${edge.body}`);
  assert.equal(edge.json().displayName, 'n'.repeat(40));
});

test('notifications unread equals message count, per sandbox, reset clears', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  assert.deepEqual((await api(app, sb, 'GET', '/notifications')).json(), { unread: 0 });
  for (const text of ['one', 'two', 'three']) {
    const r = await api(app, sb, 'POST', '/messages', { name: 'n', text });
    assert.ok(r.statusCode < 300, `post message ${r.statusCode} ${r.body}`);
  }
  assert.equal((await api(app, sb, 'GET', '/notifications')).json().unread, 3);
  assert.equal((await api(app, sb2, 'GET', '/notifications')).json().unread, 0, 'count leaked across sandboxes');
  await reset(app, sb);
  assert.equal((await api(app, sb, 'GET', '/notifications')).json().unread, 0, 'reset must clear messages');
});

// ---------- activity ----------

type Entry = { n: number; text: string };

async function activity(app: App, sb: string, qs: string) {
  const res = await api(app, sb, 'GET', `/activity${qs}`);
  return res;
}

test('activity defaults: total 10000, from 1, 50 consecutive entries', async (t) => {
  const { app, sb } = await setup(t);
  const res = await activity(app, sb, '');
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json() as { total: number; entries: Entry[] };
  assert.equal(body.total, 10000);
  assert.deepEqual(body.entries.map((e) => e.n), Array.from({ length: 50 }, (_, i) => i + 1));
  for (const e of body.entries) assert.ok(typeof e.text === 'string' && e.text.length > 0, `entry ${e.n} text`);
});

test('activity edge: from=9999 limit=5 -> exactly 9999 and 10000', async (t) => {
  const { app, sb } = await setup(t);
  const body = (await activity(app, sb, '?from=9999&limit=5')).json() as { entries: Entry[] };
  assert.deepEqual(body.entries.map((e) => e.n), [9999, 10000]);
  const last = (await activity(app, sb, '?from=10000&limit=1')).json() as { entries: Entry[] };
  assert.deepEqual(last.entries.map((e) => e.n), [10000]);
  const beyond = await activity(app, sb, '?from=10001&limit=5');
  assert.equal(beyond.statusCode, 200, beyond.body);
  assert.deepEqual(beyond.json().entries, []);
  const first = (await activity(app, sb, '?from=1&limit=1')).json() as { entries: Entry[] };
  assert.deepEqual(first.entries.map((e) => e.n), [1]);
});

test('activity limit boundaries: 500 ok with 500 entries, 501 and 0 rejected', async (t) => {
  const { app, sb } = await setup(t);
  const ok = await activity(app, sb, '?from=1&limit=500');
  assert.equal(ok.statusCode, 200, ok.body);
  const entries = (ok.json() as { entries: Entry[] }).entries;
  assert.equal(entries.length, 500);
  entries.forEach((e, i) => assert.equal(e.n, i + 1, `gap at index ${i}`));
  for (const qs of ['?limit=501', '?limit=0', '?limit=-1', '?limit=1.5', '?limit=abc', '?from=0', '?from=-3', '?from=2.5', '?from=x']) {
    const r = await activity(app, sb, qs);
    assert.equal(r.statusCode, 400, `${qs} -> ${r.statusCode}`);
  }
});

test('activity text is deterministic across calls, windows and sandboxes, and consecutive', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  const a = (await activity(app, sb, '?from=4990&limit=20')).json().entries as Entry[];
  const b = (await activity(app, sb, '?from=4990&limit=20')).json().entries as Entry[];
  const c = (await activity(app, sb2, '?from=4990&limit=20')).json().entries as Entry[];
  const d = (await activity(app, sb, '?from=5000&limit=5')).json().entries as Entry[];
  assert.deepEqual(b, a, 'text differs between identical calls');
  assert.deepEqual(c, a, 'text differs between sandboxes');
  assert.deepEqual(d, a.slice(10, 15), 'text for same n differs between windows');
  a.forEach((e, i) => assert.equal(e.n, 4990 + i));
  assert.ok(new Set(a.map((e) => e.text)).size > 1, 'texts should vary by n');
});

// ---------- auth ----------

test('auth/request: 202, email trimmed and lowercased, invalid -> 400 and no mail', async (t) => {
  const { app, sb } = await setup(t);
  for (const email of ['', 'nope', 'a@', '@b.com', 'a b@c.com', undefined, 7]) {
    const r = await api(app, sb, 'POST', '/auth/request', { email });
    assert.equal(r.statusCode, 400, `email ${JSON.stringify(email)} -> ${r.statusCode}`);
  }
  assert.deepEqual(await mails(app, sb), [], 'invalid request produced mail');
  const mail = await requestLink(app, sb, '  Some.One@Example.COM ');
  assert.equal(mail.to, 'some.one@example.com');
});

test('mailbox: newest first, ids per sandbox, GET /mail/:id, 404 unknown, per sandbox', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = await newSandbox(app);
  await requestLink(app, sb, 'one@example.com');
  await requestLink(app, sb, 'two@example.com');
  await requestLink(app, sb2, 'other@example.com');
  const list = await mails(app, sb);
  assert.deepEqual(list.map((m) => m.id), [2, 1], 'newest first with ids 1,2');
  assert.deepEqual(list.map((m) => m.to), ['two@example.com', 'one@example.com']);
  const list2 = await mails(app, sb2);
  assert.deepEqual(list2.map((m) => m.id), [1], 'ids restart per sandbox');
  assert.deepEqual(list2.map((m) => m.to), ['other@example.com'], 'mail leaked across sandboxes');
  const one = await api(app, sb, 'GET', '/mail/1');
  assert.equal(one.statusCode, 200);
  assert.deepEqual(one.json(), list[1] as Mail, 'GET /mail/:id equals list item (or is wrapped)');
  assert.equal((await api(app, sb, 'GET', '/mail/99')).statusCode, 404);
  assert.equal((await api(app, sb2, 'GET', '/mail/2')).statusCode, 404, 'mail 2 of sandbox 1 visible in sandbox 2');
  for (const m of list) {
    assert.ok(typeof m.subject === 'string' && m.subject.length > 0);
    assert.ok(m.receivedAt !== undefined && m.receivedAt !== null);
  }
});

test('mail link uses request public scheme and host, text contains link', async (t) => {
  const { app, sb } = await setup(t);
  const def = await requestLink(app, sb, 'a@example.com');
  assert.equal(def.link.startsWith(`http://localhost:80/api/s/${sb}/auth/verify?token=`) || def.link.startsWith(`http://localhost/api/s/${sb}/auth/verify?token=`), true, `default link: ${def.link}`);
  assert.ok(def.text.includes(def.link), 'text contains link');
  const pub = await requestLink(app, sb, 'b@example.com', { host: 'demo.example', 'x-forwarded-proto': 'https' });
  assert.ok(pub.link.startsWith(`https://demo.example/api/s/${sb}/auth/verify?token=`), `proxy link: ${pub.link}`);
  assert.ok(pub.text.includes(pub.link));
  assert.ok(tokenOf(pub.link).length > 0, 'token present');
  assert.notEqual(tokenOf(pub.link), tokenOf(def.link));
});

test('verify: valid token -> 302 to account with HttpOnly Path=/ session cookie; /auth/me returns email', async (t) => {
  const { app, sb } = await setup(t);
  const { value, verifyRes } = await loginViaLink(app, sb, 'Me@Example.com');
  assert.equal(verifyRes.statusCode, 302);
  assert.equal(verifyRes.headers.location, `/s/${sb}/account`);
  const c = cookieNamed(verifyRes, `epg_session_${sb}`) as string;
  assert.match(c, /HttpOnly/i);
  assert.match(c, /Path=\//i);
  const me = await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, value));
  assert.equal(me.statusCode, 200, me.body);
  assert.deepEqual(me.json(), { email: 'me@example.com' });
});

test('verify token is single-use; second use redirects to invalid-link with no session', async (t) => {
  const { app, sb } = await setup(t);
  const mail = await requestLink(app, sb, 'a@example.com');
  const first = await app.inject({ method: 'GET', url: verifyPath(mail.link) });
  assert.ok(cookieNamed(first, `epg_session_${sb}`), 'first use signs in');
  const second = await app.inject({ method: 'GET', url: verifyPath(mail.link) });
  assert.equal(second.statusCode, 302);
  assert.equal(second.headers.location, `/s/${sb}/account?error=invalid-link`, 'token reusable');
  assert.equal(cookieNamed(second, `epg_session_${sb}`), undefined, 'reused token created a session');
});

test('verify: unknown or missing token -> invalid-link, no session', async (t) => {
  const { app, sb } = await setup(t);
  for (const qs of ['?token=doesnotexist', '', '?token=']) {
    const r = await api(app, sb, 'GET', `/auth/verify${qs}`);
    assert.equal(r.statusCode, 302, `${qs} -> ${r.statusCode}`);
    assert.equal(r.headers.location, `/s/${sb}/account?error=invalid-link`, qs);
    assert.equal(cookieNamed(r, `epg_session_${sb}`), undefined);
  }
});

test('token from sandbox A is invalid in sandbox B verify URL', async (t) => {
  const { app, sb } = await setup(t);
  const sbB = await newSandbox(app);
  const mail = await requestLink(app, sb, 'a@example.com');
  const r = await api(app, sbB, 'GET', `/auth/verify?token=${tokenOf(mail.link)}`);
  assert.equal(r.headers.location, `/s/${sbB}/account?error=invalid-link`, 'cross-sandbox token accepted');
  assert.equal(cookieNamed(r, `epg_session_${sbB}`), undefined);
  const still = await app.inject({ method: 'GET', url: verifyPath(mail.link) });
  assert.equal(still.headers.location, `/s/${sb}/account`, 'token still valid in its own sandbox');
});

test('session cookie of sandbox A does not sign into sandbox B; unknown cookie and none -> 401', async (t) => {
  const { app, sb } = await setup(t);
  const sbB = await newSandbox(app);
  const { value } = await loginViaLink(app, sb);
  const asB = await api(app, sbB, 'GET', '/auth/me', undefined, cookieHeader(sbB, value));
  assert.equal(asB.statusCode, 401, `A's session value accepted in B: ${asB.body}`);
  const crossName = await api(app, sbB, 'GET', '/auth/me', undefined, cookieHeader(sb, value));
  assert.equal(crossName.statusCode, 401, 'A cookie name sent to B');
  assert.equal((await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, 'bogus'))).statusCode, 401);
  assert.equal((await api(app, sb, 'GET', '/auth/me')).statusCode, 401);
  assert.equal((await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, value))).statusCode, 200);
});

test('logout clears cookie (Max-Age=0) and old cookie value -> 401', async (t) => {
  const { app, sb } = await setup(t);
  const { value } = await loginViaLink(app, sb);
  const out = await api(app, sb, 'POST', '/auth/logout', undefined, cookieHeader(sb, value));
  assert.equal(out.statusCode, 200, out.body);
  const c = cookieNamed(out, `epg_session_${sb}`);
  assert.ok(c, 'logout must send clearing Set-Cookie');
  assert.match(c, /Max-Age=0/i);
  const me = await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, value));
  assert.equal(me.statusCode, 401, 'session still valid after logout');
});

test('each request creates a new token; older unused tokens keep working', async (t) => {
  const { app, sb } = await setup(t);
  const m1 = await requestLink(app, sb, 'a@example.com');
  const m2 = await requestLink(app, sb, 'a@example.com');
  assert.notEqual(tokenOf(m1.link), tokenOf(m2.link));
  const v2 = await app.inject({ method: 'GET', url: verifyPath(m2.link) });
  assert.equal(v2.headers.location, `/s/${sb}/account`);
  const v1 = await app.inject({ method: 'GET', url: verifyPath(m1.link) });
  assert.equal(v1.headers.location, `/s/${sb}/account`, 'older unused token must still work');
  assert.ok(cookieNamed(v1, `epg_session_${sb}`));
});

test('fault tokenTtlMs 0 makes new links expire immediately; earlier links unaffected; invalid -> 400', async (t) => {
  const { app, sb } = await setup(t);
  const early = await requestLink(app, sb, 'a@example.com');
  const f = await hook(app, sb, 'fault', { auth: { tokenTtlMs: 0 } });
  assert.equal(f.statusCode, 200, f.body);
  const expired = await requestLink(app, sb, 'b@example.com');
  await new Promise((r) => setTimeout(r, 20));
  const r = await app.inject({ method: 'GET', url: verifyPath(expired.link) });
  assert.equal(r.headers.location, `/s/${sb}/account?error=invalid-link`, 'ttl 0 token still accepted');
  assert.equal(cookieNamed(r, `epg_session_${sb}`), undefined);
  const e = await app.inject({ method: 'GET', url: verifyPath(early.link) });
  assert.equal(e.headers.location, `/s/${sb}/account`, 'link requested before the fault must still be valid');
  for (const bad of [-1, 3600001, 'x', null]) {
    const b = await hook(app, sb, 'fault', { auth: { tokenTtlMs: bad } });
    assert.equal(b.statusCode, 400, `tokenTtlMs ${JSON.stringify(bad)} -> ${b.statusCode}`);
  }
  assert.equal((await hook(app, sb, 'fault', { auth: { tokenTtlMs: 3600000 } })).statusCode, 200, 'upper bound accepted');
  const long = await requestLink(app, sb, 'c@example.com');
  const l = await app.inject({ method: 'GET', url: verifyPath(long.link) });
  assert.equal(l.headers.location, `/s/${sb}/account`, 'long ttl token valid');
});

test('fault tokenTtlMs is per sandbox', async (t) => {
  const { app, sb } = await setup(t);
  const sbB = await newSandbox(app);
  await hook(app, sb, 'fault', { auth: { tokenTtlMs: 0 } });
  const m = await requestLink(app, sbB, 'a@example.com');
  const r = await app.inject({ method: 'GET', url: verifyPath(m.link) });
  assert.equal(r.headers.location, `/s/${sbB}/account`, 'ttl leaked to other sandbox');
});

test('login hook: returns cookie usable on /auth/me, sets Set-Cookie, invalid email -> 400', async (t) => {
  const { app, sb } = await setup(t);
  const r = await hook(app, sb, 'login', { email: ' Hook@Example.com ' });
  assert.equal(r.statusCode, 200, r.body);
  const body = r.json() as { email: string; cookie: { name: string; value: string } };
  assert.equal(body.cookie.name, `epg_session_${sb}`);
  const sc = cookieNamed(r, body.cookie.name);
  assert.ok(sc, 'Set-Cookie present');
  assert.equal(cookieValue(sc), body.cookie.value);
  const me = await api(app, sb, 'GET', '/auth/me', undefined, { cookie: `${body.cookie.name}=${body.cookie.value}` });
  assert.equal(me.statusCode, 200, me.body);
  assert.equal(me.json().email, body.email);
  assert.equal(body.email.toLowerCase(), 'hook@example.com');
  const bad = await hook(app, sb, 'login', { email: 'nope' });
  assert.equal(bad.statusCode, 400);
  const sbB = await newSandbox(app);
  assert.equal((await api(app, sbB, 'GET', '/auth/me', undefined, cookieHeader(sbB, body.cookie.value))).statusCode, 401);
});

test('reset clears mail, tokens, sessions, ttl, settings', async (t) => {
  const { app, sb } = await setup(t);
  const mail = await requestLink(app, sb, 'a@example.com');
  const { value } = await loginViaLink(app, sb, 'b@example.com');
  const hl = (await hook(app, sb, 'login', { email: 'c@example.com' })).json() as { cookie: { value: string } };
  await api(app, sb, 'PUT', '/settings', { displayName: 'X', theme: 'dark', emailDigest: true });
  await hook(app, sb, 'fault', { auth: { tokenTtlMs: 0 } });
  await reset(app, sb);
  assert.deepEqual(await mails(app, sb), [], 'mail left behind');
  assert.equal((await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, value))).statusCode, 401, 'verify session survived reset');
  assert.equal((await api(app, sb, 'GET', '/auth/me', undefined, cookieHeader(sb, hl.cookie.value))).statusCode, 401, 'hook session survived reset');
  const old = await app.inject({ method: 'GET', url: verifyPath(mail.link) });
  assert.equal(old.headers.location, `/s/${sb}/account?error=invalid-link`, 'unused token survived reset');
  assert.deepEqual((await api(app, sb, 'GET', '/settings')).json(), { displayName: '', theme: 'light', emailDigest: false });
  const fresh = await requestLink(app, sb, 'd@example.com');
  assert.equal(fresh.id, 1, 'mail ids restart after reset');
  const ok = await app.inject({ method: 'GET', url: verifyPath(fresh.link) });
  assert.equal(ok.headers.location, `/s/${sb}/account`, 'ttl must be reset to default (non-zero)');
});

test('reset of one sandbox leaves another sandbox sessions and mail intact', async (t) => {
  const { app, sb } = await setup(t);
  const sbB = await newSandbox(app);
  const { value } = await loginViaLink(app, sbB, 'keep@example.com');
  await reset(app, sb);
  assert.equal((await api(app, sbB, 'GET', '/auth/me', undefined, cookieHeader(sbB, value))).statusCode, 200);
  assert.equal((await mails(app, sbB)).length, 1);
});

// ---------- unknown sandbox / hooks off ----------

test('unknown sandbox -> 404 for new endpoints', async (t) => {
  const app = await makeApp(t);
  const sb = 'does-not-exist';
  for (const [m, p] of [['GET', '/flags'], ['GET', '/settings'], ['GET', '/notifications'], ['GET', '/activity'], ['GET', '/mail'], ['GET', '/auth/me'], ['GET', '/cards?q=a']] as const) {
    const r = await api(app, sb, m, p);
    assert.equal(r.statusCode, 404, `${m} ${p} -> ${r.statusCode}`);
  }
  assert.equal((await api(app, sb, 'POST', '/auth/request', { email: 'a@example.com' })).statusCode, 404);
});

test('testHooks false: /__test__ routes -> 404 and normal endpoints work', async (t) => {
  const app = await makeApp(t, false);
  const sb = await newSandbox(app);
  for (const op of ['flags', 'login', 'fault', 'reset']) {
    const r = await hook(app, sb, op, { createCard: 'inline', email: 'a@example.com', auth: { tokenTtlMs: 0 } });
    assert.equal(r.statusCode, 404, `${op} -> ${r.statusCode}`);
  }
  assert.equal((await api(app, sb, 'GET', '/flags')).statusCode, 200);
});
