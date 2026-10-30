import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';
import { totp } from './vault.ts';

type App = Awaited<ReturnType<typeof buildApp>>;
type T = { after: (fn: () => Promise<void>) => void };

const STEP_MS = 30_000;
const S = 56_666_667;
const NOW = S * STEP_MS + 15_000;
const NOTES = ['Door code: 4711', 'Wi-Fi: correct-horse-battery', 'Locker: 18'];
const WRONG = { error: 'Wrong code.' };
const USED = { error: 'That code was already used. Wait for a new one.' };
const LOCKED = { error: 'Too many tries. Try again in 1 minute.' };

async function makeApp(t: T): Promise<App> {
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

function api(app: App, sb: string, method: string, path: string, payload?: unknown) {
  return app.inject({ method: method as 'GET', url: `/api/s/${sb}${path}`, payload: payload as object | undefined });
}

function hook(app: App, sb: string, op: string, payload: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: payload as object });
}

async function pin(app: App, sb: string, nowMs: number | null) {
  const res = await hook(app, sb, 'clock', { nowMs });
  assert.ok(res.statusCode < 300, `clock hook: ${res.statusCode} ${res.body}`);
}

function vaultCodeRes(app: App, sb: string) {
  return app.inject({ method: 'GET', url: `/__test__/s/${sb}/vault-code` });
}

async function vaultCode(app: App, sb: string): Promise<string> {
  const res = await vaultCodeRes(app, sb);
  assert.equal(res.statusCode, 200, `vault-code: ${res.body}`);
  return res.json().code;
}

async function begin(t: T, at: number | null = NOW) {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  if (at !== null) await pin(app, sb, at);
  const res = await api(app, sb, 'POST', '/vault/setup');
  assert.equal(res.statusCode, 200, `setup: ${res.body}`);
  return { app, sb, secret: res.json().secret as string };
}

const enable = (app: App, sb: string, code: unknown) => api(app, sb, 'POST', '/vault/enable', { code });
const unlock = (app: App, sb: string, code: unknown) => api(app, sb, 'POST', '/vault/unlock', { code });

async function enabled(app: App, sb: string): Promise<boolean> {
  const res = await api(app, sb, 'GET', '/vault');
  assert.equal(res.statusCode, 200);
  return res.json().enabled;
}

function badCode(secret: string): string {
  const valid = new Set<string>();
  for (let s = S - 3; s <= S + 5; s++) valid.add(totp(secret, s));
  for (let k = 100; ; k++) {
    const c = totp(secret, S + k);
    if (!valid.has(c)) return c;
  }
}

async function expectWrong(res: Awaited<ReturnType<typeof enable>>) {
  assert.equal(res.statusCode, 401, res.body);
  assert.deepEqual(res.json(), WRONG);
}

async function enableOk(app: App, sb: string, secret: string, step = S) {
  const res = await enable(app, sb, totp(secret, step));
  assert.equal(res.statusCode, 200, `enable: ${res.body}`);
}

function realSteps(): Set<number> {
  const s = Math.floor(Date.now() / STEP_MS);
  return new Set([s - 1, s, s + 1]);
}

function matchesRealStep(secret: string, code: string): boolean {
  return [...realSteps()].some((s) => totp(secret, s) === code);
}

test('new sandbox: vault is off, and vault-code is 404 before setup', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  assert.equal(await enabled(app, sb), false);
  assert.equal((await vaultCodeRes(app, sb)).statusCode, 404);
});

test('setup returns a 16-char base32 secret and the vault stays off until enabled', async (t) => {
  const { app, sb, secret } = await begin(t);
  assert.match(secret, /^[A-Z2-7]{16}$/);
  assert.equal(await enabled(app, sb), false);
});

test('setup twice before enabling replaces the secret: old code wrong, new code accepted', async (t) => {
  const { app, sb, secret: first } = await begin(t);
  const res = await api(app, sb, 'POST', '/vault/setup');
  assert.equal(res.statusCode, 200);
  const second = res.json().secret as string;
  assert.notEqual(second, first);
  assert.equal(await vaultCode(app, sb), totp(second, S));
  await expectWrong(await enable(app, sb, totp(first, S)));
  assert.equal((await enable(app, sb, totp(second, S))).statusCode, 200);
});

test('enable before setup is 409 start the setup first', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const res = await enable(app, sb, '123456');
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), { error: 'start the setup first' });
});

test('enable with the correct code turns the vault on', async (t) => {
  const { app, sb } = await begin(t);
  const res = await enable(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { enabled: true });
  assert.equal(await enabled(app, sb), true);
});

test('a wrong code on enable leaves the vault off', async (t) => {
  const { app, sb, secret } = await begin(t);
  await expectWrong(await enable(app, sb, badCode(secret)));
  assert.equal(await enabled(app, sb), false);
});

test('when enabled: setup is 409 already on and keeps the secret; enable is 409 start the setup first', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret);
  const again = await api(app, sb, 'POST', '/vault/setup');
  assert.equal(again.statusCode, 409);
  assert.deepEqual(again.json(), { error: 'already on' });
  const en = await enable(app, sb, totp(secret, S + 1));
  assert.equal(en.statusCode, 409);
  assert.deepEqual(en.json(), { error: 'start the setup first' });
  const un = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(un.statusCode, 200);
  assert.deepEqual(un.json(), { notes: NOTES });
});

test('unlock is 409 two-step verification is off before setup, during setup, and after setup without enabling', async (t) => {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  const off = { error: 'two-step verification is off' };
  let res = await unlock(app, sb, '123456');
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), off);
  await api(app, sb, 'POST', '/vault/setup');
  res = await unlock(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), off);
});

for (const [name, offset, ok] of [
  ['previous step', -1, true],
  ['next step', 1, true],
  ['two steps back', -2, false],
  ['two steps ahead', 2, false],
] as const) {
  test(`enable window: ${name} is ${ok ? 'accepted' : 'rejected'}`, async (t) => {
    const { app, sb, secret } = await begin(t);
    const res = await enable(app, sb, totp(secret, S + offset));
    if (ok) {
      assert.equal(res.statusCode, 200, res.body);
      assert.equal(await enabled(app, sb), true);
    } else {
      await expectWrong(res);
      assert.equal(await enabled(app, sb), false);
    }
  });
}

for (const offset of [-2, 2]) {
  test(`unlock window: ${offset} steps away is rejected`, async (t) => {
    const { app, sb, secret } = await begin(t);
    await enableOk(app, sb, secret, S + 1);
    await expectWrong(await unlock(app, sb, totp(secret, S + offset)));
  });
}

test('unlock window: previous and next steps are accepted', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  assert.equal((await unlock(app, sb, totp(secret, S - 1))).statusCode, 200);
  assert.equal((await unlock(app, sb, totp(secret, S + 1))).statusCode, 200);
});

test('window follows floor of the pinned clock: 1 ms before a step edge is still the old step', async (t) => {
  const { app, sb, secret } = await begin(t, S * STEP_MS + 29_999);
  assert.equal(await vaultCode(app, sb), totp(secret, S));
  await expectWrong(await enable(app, sb, totp(secret, S + 2)));
  assert.equal((await enable(app, sb, totp(secret, S - 1))).statusCode, 200);
});

test('window follows floor of the pinned clock: exactly on a step edge is the new step', async (t) => {
  const { app, sb, secret } = await begin(t, (S + 1) * STEP_MS);
  assert.equal(await vaultCode(app, sb), totp(secret, S + 1));
  await expectWrong(await enable(app, sb, totp(secret, S - 1)));
  assert.equal((await enable(app, sb, totp(secret, S))).statusCode, 200);
});

test('surrounding whitespace in the code is ignored', async (t) => {
  const { app, sb, secret } = await begin(t);
  const res = await enable(app, sb, `  ${totp(secret, S)}\t\n`);
  assert.equal(res.statusCode, 200, res.body);
  const un = await unlock(app, sb, ` ${totp(secret, S + 1)} `);
  assert.equal(un.statusCode, 200, un.body);
});

test('non-string and missing codes are wrong, even a numerically correct code', async (t) => {
  const { app, sb, secret } = await begin(t);
  await expectWrong(await enable(app, sb, Number(totp(secret, S))));
  await expectWrong(await enable(app, sb, null));
  await expectWrong(await enable(app, sb, [totp(secret, S)]));
  await expectWrong(await api(app, sb, 'POST', '/vault/enable', {}));
  await expectWrong(await api(app, sb, 'POST', '/vault/enable'));
  assert.equal(await enabled(app, sb), false);
});

test('non-string codes count as failures toward the lock', async (t) => {
  const { app, sb, secret } = await begin(t);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, i % 2 ? null : 123456 + i));
  const res = await enable(app, sb, totp(secret, S));
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.json(), LOCKED);
});

test('code reuse: a step that succeeded on enable is 409 on unlock; the next step still works', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  const reused = await unlock(app, sb, totp(secret, S));
  assert.equal(reused.statusCode, 409);
  assert.deepEqual(reused.json(), USED);
  const ok = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.json(), { notes: NOTES });
});

test('code reuse: a step that succeeded on unlock is 409 on a second unlock', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S - 1);
  assert.equal((await unlock(app, sb, totp(secret, S))).statusCode, 200);
  const again = await unlock(app, sb, totp(secret, S));
  assert.equal(again.statusCode, 409);
  assert.deepEqual(again.json(), USED);
  assert.equal((await unlock(app, sb, totp(secret, S + 1))).statusCode, 200);
});

test('code reuse is not a failure: 3 wrong, 1 reuse, 1 wrong is 4 failures and does not lock', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  const bad = badCode(secret);
  for (let i = 0; i < 3; i++) await expectWrong(await unlock(app, sb, bad));
  assert.equal((await unlock(app, sb, totp(secret, S))).statusCode, 409);
  await expectWrong(await unlock(app, sb, bad));
  const res = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(res.statusCode, 200, res.body);
});

test('code reuse is not a success: it does not reset the failure count', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  const bad = badCode(secret);
  for (let i = 0; i < 3; i++) await expectWrong(await unlock(app, sb, bad));
  assert.equal((await unlock(app, sb, totp(secret, S))).statusCode, 409);
  await expectWrong(await unlock(app, sb, bad));
  await expectWrong(await unlock(app, sb, bad));
  const res = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.json(), LOCKED);
});

test('5th wrong code is still 401, then even the correct code is 429', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  const res = await enable(app, sb, totp(secret, S));
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.json(), LOCKED);
  assert.equal(await enabled(app, sb), false);
  const wrongDuring = await enable(app, sb, bad);
  assert.equal(wrongDuring.statusCode, 429);
});

test('lock on enable ends at exactly lockStart + 60000 ms, not 1 ms earlier', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  await pin(app, sb, NOW + 59_999);
  const early = await enable(app, sb, await vaultCode(app, sb));
  assert.equal(early.statusCode, 429);
  assert.deepEqual(early.json(), LOCKED);
  await pin(app, sb, NOW + 60_000);
  const res = await enable(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(await enabled(app, sb), true);
});

test('lock on unlock blocks the correct code and the notes until lockStart + 60000 ms', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await unlock(app, sb, bad));
  await pin(app, sb, NOW + 59_999);
  const early = await unlock(app, sb, await vaultCode(app, sb));
  assert.equal(early.statusCode, 429);
  assert.deepEqual(early.json(), LOCKED);
  assert.equal(early.json().notes, undefined);
  await pin(app, sb, NOW + 60_000);
  const res = await unlock(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { notes: NOTES });
});

test('lock start is the 5th failure time, not the first', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 4; i++) await expectWrong(await enable(app, sb, bad));
  await pin(app, sb, NOW + 20_000);
  await expectWrong(await enable(app, sb, bad));
  await pin(app, sb, NOW + 60_000);
  assert.equal((await enable(app, sb, totp(secret, S + 2))).statusCode, 429);
  await pin(app, sb, NOW + 80_000);
  assert.equal((await enable(app, sb, totp(secret, S + 2))).statusCode, 200);
});

test('after the lock ends the failure count restarts: 4 more wrong codes do not lock', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  await pin(app, sb, NOW + 60_000);
  for (let i = 0; i < 4; i++) await expectWrong(await enable(app, sb, bad));
  const res = await enable(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 200, res.body);
});

test('after the lock ends, 5 more wrong codes lock again', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  await pin(app, sb, NOW + 60_000);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  const res = await enable(app, sb, await vaultCode(app, sb));
  assert.equal(res.statusCode, 429);
  await pin(app, sb, NOW + 120_000);
  assert.equal((await enable(app, sb, await vaultCode(app, sb))).statusCode, 200);
});

test('a success resets the failure count: 4 wrong, 1 right, 4 wrong is not locked', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 4; i++) await expectWrong(await enable(app, sb, bad));
  await enableOk(app, sb, secret, S);
  for (let i = 0; i < 4; i++) await expectWrong(await unlock(app, sb, bad));
  const res = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(res.statusCode, 200, res.body);
});

test('a success resets the failure count: after the reset, the 5th wrong code locks', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  await enableOk(app, sb, secret, S);
  for (let i = 0; i < 4; i++) await expectWrong(await unlock(app, sb, bad));
  assert.equal((await unlock(app, sb, totp(secret, S - 1))).statusCode, 200);
  for (let i = 0; i < 5; i++) await expectWrong(await unlock(app, sb, bad));
  assert.equal((await unlock(app, sb, totp(secret, S + 1))).statusCode, 429);
});

test('clock null returns the vault to real time', async (t) => {
  const { app, sb, secret } = await begin(t);
  assert.equal(await vaultCode(app, sb), totp(secret, S));
  await pin(app, sb, null);
  assert.ok(matchesRealStep(secret, await vaultCode(app, sb)));
  const res = await enable(app, sb, totp(secret, Math.floor(Date.now() / STEP_MS)));
  assert.equal(res.statusCode, 200, res.body);
});

test('reset clears the vault and the pinned clock', async (t) => {
  const { app, sb, secret } = await begin(t);
  await enableOk(app, sb, secret, S);
  const r = await hook(app, sb, 'reset', {});
  assert.ok(r.statusCode < 300, r.body);
  assert.equal(await enabled(app, sb), false);
  assert.equal((await vaultCodeRes(app, sb)).statusCode, 404);
  const un = await unlock(app, sb, totp(secret, S + 1));
  assert.equal(un.statusCode, 409);
  assert.deepEqual(un.json(), { error: 'two-step verification is off' });
  const fresh = await api(app, sb, 'POST', '/vault/setup');
  assert.equal(fresh.statusCode, 200);
  const secret2 = fresh.json().secret as string;
  const code = await vaultCode(app, sb);
  assert.ok(matchesRealStep(secret2, code), 'vault-code after reset must use real time');
  assert.equal((await enable(app, sb, code)).statusCode, 200);
});

test('reset clears a lock and the used-step memory', async (t) => {
  const { app, sb, secret } = await begin(t);
  const bad = badCode(secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(app, sb, bad));
  await hook(app, sb, 'reset', {});
  await api(app, sb, 'POST', '/vault/setup');
  const code = await vaultCode(app, sb);
  assert.equal((await enable(app, sb, code)).statusCode, 200);
  await hook(app, sb, 'reset', {});
  await api(app, sb, 'POST', '/vault/setup');
  const again = await vaultCode(app, sb);
  const res = await enable(app, sb, again);
  assert.equal(res.statusCode, 200, res.body);
});

test('each sandbox has its own vault, clock, and lock', async (t) => {
  const a = await begin(t);
  const sbB = await newSandbox(a.app);
  assert.equal(await enabled(a.app, sbB), false);
  const un = await unlock(a.app, sbB, '123456');
  assert.equal(un.statusCode, 409);
  assert.deepEqual(un.json(), { error: 'two-step verification is off' });
  const setupB = await api(a.app, sbB, 'POST', '/vault/setup');
  const secretB = setupB.json().secret as string;
  assert.notEqual(secretB, a.secret);
  assert.ok(matchesRealStep(secretB, await vaultCode(a.app, sbB)), 'sandbox B must not see the clock pinned on A');
  const bad = badCode(a.secret);
  for (let i = 0; i < 5; i++) await expectWrong(await enable(a.app, a.sb, bad));
  assert.equal((await enable(a.app, a.sb, totp(a.secret, S))).statusCode, 429);
  const okB = await enable(a.app, sbB, await vaultCode(a.app, sbB));
  assert.equal(okB.statusCode, 200, okB.body);
  assert.equal(await enabled(a.app, a.sb), false);
});

test('a code used in one sandbox is not marked used in another', async (t) => {
  const a = await begin(t);
  const sbB = await newSandbox(a.app);
  await pin(a.app, sbB, NOW);
  const setupB = await api(a.app, sbB, 'POST', '/vault/setup');
  const secretB = setupB.json().secret as string;
  await enableOk(a.app, a.sb, a.secret, S);
  await enableOk(a.app, sbB, secretB, S);
  assert.equal((await unlock(a.app, a.sb, totp(a.secret, S))).statusCode, 409);
  assert.equal((await unlock(a.app, sbB, totp(secretB, S + 1))).statusCode, 200);
});
