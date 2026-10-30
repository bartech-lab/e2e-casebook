import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

const HOST = 'localhost:3000';
const HEADERS = { host: HOST };

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
    headers: HEADERS,
  });
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest();

interface Authenticator {
  id: string;
  privateKey: KeyObject;
  publicKey: string;
}

function newAuthenticator(id: string): Authenticator {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { id, privateKey, publicKey: b64(publicKey.export({ type: 'spki', format: 'der' })) };
}

function clientData(type: string, challenge: string, origin = `http://${HOST}`): string {
  return b64(JSON.stringify({ type, challenge, origin }));
}

function authData(opts: { rp?: string; flags?: number; counter?: number; truncate?: number } = {}): Buffer {
  const rp = sha(opts.rp ?? 'localhost');
  const flags = Buffer.from([opts.flags ?? 0x05]);
  const counter = Buffer.alloc(4);
  counter.writeUInt32BE(opts.counter ?? 0);
  const full = Buffer.concat([rp, flags, counter]);
  return opts.truncate === undefined ? full : full.subarray(0, opts.truncate);
}

async function challenge(app: App, sb: string, kind: 'register' | 'login'): Promise<string> {
  const res = await api(app, sb, 'POST', `/passkeys/${kind}/options`);
  assert.equal(res.statusCode, 200, `${kind} options: ${res.body}`);
  return res.json().challenge;
}

function registerBody(auth: Authenticator, cd: string, extra: Record<string, unknown> = {}) {
  return { id: auth.id, clientDataJSON: cd, alg: -7, publicKey: auth.publicKey, ...extra };
}

async function register(app: App, sb: string, auth: Authenticator) {
  const ch = await challenge(app, sb, 'register');
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(auth, clientData('webauthn.create', ch)));
  assert.equal(res.statusCode, 200, `register: ${res.body}`);
  return res.json();
}

interface LoginOpts {
  type?: string;
  origin?: string;
  authData?: Buffer;
  signedData?: (ad: Buffer, cdBytes: Buffer) => Buffer;
  challenge?: string;
}

async function login(app: App, sb: string, auth: Authenticator, opts: LoginOpts = {}) {
  const ch = opts.challenge ?? (await challenge(app, sb, 'login'));
  const cdB64 = clientData(opts.type ?? 'webauthn.get', ch, opts.origin);
  const cdBytes = Buffer.from(cdB64, 'base64url');
  const ad = opts.authData ?? authData();
  const data = opts.signedData ? opts.signedData(ad, cdBytes) : Buffer.concat([ad, sha(cdBytes)]);
  const signature = sign('sha256', data, auth.privateKey);
  return api(app, sb, 'POST', '/passkeys/login', {
    id: auth.id,
    clientDataJSON: cdB64,
    authenticatorData: b64(ad),
    signature: b64(signature),
  });
}

async function expectError(res: Awaited<ReturnType<typeof login>>, message: string) {
  assert.equal(res.statusCode, 400, res.body);
  assert.equal(res.json().error, message);
}

async function list(app: App, sb: string) {
  const res = await api(app, sb, 'GET', '/passkeys');
  assert.equal(res.statusCode, 200, res.body);
  return res.json() as { id: string; name: string; uses: number }[];
}

test('register then login round trip returns the user and the passkey name', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('key-one');
  const reg = await register(app, sb, auth);
  assert.deepEqual(reg, { id: 'key-one', name: 'Passkey 1' });
  const res = await login(app, sb, auth);
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(res.json(), { user: 'ann', passkey: 'Passkey 1' });
});

test('register challenge cannot be reused', async (t) => {
  const { app, sb } = await setup(t);
  const ch = await challenge(app, sb, 'register');
  const first = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('a'), clientData('webauthn.create', ch)));
  assert.equal(first.statusCode, 200, first.body);
  const second = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('b'), clientData('webauthn.create', ch)));
  await expectError(second, 'Unknown or used challenge.');
  assert.equal((await list(app, sb)).length, 1);
});

test('login challenge cannot be reused', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const ch = await challenge(app, sb, 'login');
  const first = await login(app, sb, auth, { challenge: ch });
  assert.equal(first.statusCode, 200, first.body);
  await expectError(await login(app, sb, auth, { challenge: ch }), 'Unknown or used challenge.');
});

test('a challenge is consumed across ceremonies', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const ch = await challenge(app, sb, 'login');
  const ok = await login(app, sb, auth, { challenge: ch });
  assert.equal(ok.statusCode, 200, ok.body);
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('x'), clientData('webauthn.create', ch)));
  await expectError(res, 'Unknown or used challenge.');
});

test('a challenge issued in another sandbox is rejected', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const ch = await challenge(app, a, 'register');
  const res = await api(app, b, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.create', ch)));
  await expectError(res, 'Unknown or used challenge.');
  assert.equal((await list(app, b)).length, 0);
  const own = await api(app, a, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.create', ch)));
  assert.equal(own.statusCode, 200, own.body);
});

test('clientDataJSON that is not JSON is rejected', async (t) => {
  const { app, sb } = await setup(t);
  await challenge(app, sb, 'register');
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), b64('not json at all')));
  await expectError(res, 'clientDataJSON is not JSON.');
});

test('register with the login ceremony type is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const ch = await challenge(app, sb, 'register');
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.get', ch)));
  await expectError(res, 'Wrong ceremony type.');
});

test('login with the register ceremony type is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { type: 'webauthn.create' }), 'Wrong ceremony type.');
});

test('register with a wrong origin is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const ch = await challenge(app, sb, 'register');
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.create', ch, 'http://evil.example')));
  await expectError(res, 'Wrong origin.');
});

test('origin must include the port from the Host header', async (t) => {
  const { app, sb } = await setup(t);
  const ch = await challenge(app, sb, 'register');
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.create', ch, 'http://localhost')));
  await expectError(res, 'Wrong origin.');
});

test('login with a wrong origin is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { origin: 'https://localhost:3000' }), 'Wrong origin.');
});

test('unsupported algorithm is rejected, -7 and -257 are accepted', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  const bad = await challenge(app, sb, 'register');
  await expectError(
    await api(app, sb, 'POST', '/passkeys/register', registerBody(auth, clientData('webauthn.create', bad), { alg: -8 })),
    'Unsupported key type.',
  );
  const rs = await challenge(app, sb, 'register');
  const ok256 = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('rs'), clientData('webauthn.create', rs), { alg: -257 }));
  assert.equal(ok256.statusCode, 200, ok256.body);
  const es = await challenge(app, sb, 'register');
  const ok7 = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('es'), clientData('webauthn.create', es), { alg: -7 }));
  assert.equal(ok7.statusCode, 200, ok7.body);
});

test('a public key that is not DER SPKI is rejected', async (t) => {
  const { app, sb } = await setup(t);
  for (const publicKey of [b64('garbage bytes'), '', b64(Buffer.alloc(64, 1))]) {
    const ch = await challenge(app, sb, 'register');
    const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('k'), clientData('webauthn.create', ch), { publicKey }));
    await expectError(res, 'Bad public key.');
  }
  assert.equal((await list(app, sb)).length, 0);
});

test('relying party hash that includes the port is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { authData: authData({ rp: HOST }) }), 'Wrong relying party.');
});

test('relying party hash of another host is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { authData: authData({ rp: 'example.com' }) }), 'Wrong relying party.');
});

test('authenticatorData shorter than 37 bytes is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { authData: authData({ truncate: 36 }) }), 'Wrong relying party.');
  await expectError(await login(app, sb, auth, { authData: authData({ truncate: 0 }) }), 'Wrong relying party.');
});

test('user present without user verified is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { authData: authData({ flags: 0x01 }) }), 'User not verified.');
  await expectError(await login(app, sb, auth, { authData: authData({ flags: 0x04 }) }), 'User not verified.');
  await expectError(await login(app, sb, auth, { authData: authData({ flags: 0x00 }) }), 'User not verified.');
  const ok = await login(app, sb, auth, { authData: authData({ flags: 0x45 }) });
  assert.equal(ok.statusCode, 200, ok.body);
});

test('signature over authenticatorData alone is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(await login(app, sb, auth, { signedData: (ad) => ad }), 'Bad signature.');
  const ok = await login(app, sb, auth);
  assert.equal(ok.statusCode, 200, ok.body);
});

test('signature from a different key is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const impostor = newAuthenticator('k');
  await expectError(await login(app, sb, impostor), 'Bad signature.');
});

test('signature over a different client data is rejected', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await expectError(
    await login(app, sb, auth, { signedData: (ad) => Buffer.concat([ad, sha('other client data')]) }),
    'Bad signature.',
  );
});

test('counter must strictly increase once non-zero', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const cloned = 'Signature counter went back. This passkey may be cloned.';
  const first = await login(app, sb, auth, { authData: authData({ counter: 5 }) });
  assert.equal(first.statusCode, 200, first.body);
  await expectError(await login(app, sb, auth, { authData: authData({ counter: 5 }) }), cloned);
  await expectError(await login(app, sb, auth, { authData: authData({ counter: 4 }) }), cloned);
  await expectError(await login(app, sb, auth, { authData: authData({ counter: 0 }) }), cloned);
  const up = await login(app, sb, auth, { authData: authData({ counter: 6 }) });
  assert.equal(up.statusCode, 200, up.body);
  await expectError(await login(app, sb, auth, { authData: authData({ counter: 6 }) }), cloned);
});

test('a rejected counter does not advance the stored counter or uses', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const ok = await login(app, sb, auth, { authData: authData({ counter: 10 }) });
  assert.equal(ok.statusCode, 200, ok.body);
  await login(app, sb, auth, { authData: authData({ counter: 3 }) });
  assert.equal((await list(app, sb))[0]?.uses, 1);
  const next = await login(app, sb, auth, { authData: authData({ counter: 11 }) });
  assert.equal(next.statusCode, 200, next.body);
});

test('counters above 2^31 compare as unsigned', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  const low = await login(app, sb, auth, { authData: authData({ counter: 1 }) });
  assert.equal(low.statusCode, 200, low.body);
  const high = await login(app, sb, auth, { authData: authData({ counter: 0xfffffff0 }) });
  assert.equal(high.statusCode, 200, high.body);
});

test('uses increments only on successful logins', async (t) => {
  const { app, sb } = await setup(t);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  assert.equal((await list(app, sb))[0]?.uses, 0);
  await login(app, sb, auth);
  await login(app, sb, auth, { authData: authData({ flags: 0x01 }) });
  await login(app, sb, auth);
  assert.equal((await list(app, sb))[0]?.uses, 2);
});

test('second registration is named Passkey 2 and the first is excluded', async (t) => {
  const { app, sb } = await setup(t);
  const empty = await api(app, sb, 'POST', '/passkeys/register/options');
  assert.deepEqual(empty.json().exclude, []);
  await register(app, sb, newAuthenticator('first'));
  const opts = await api(app, sb, 'POST', '/passkeys/register/options');
  assert.deepEqual(opts.json().exclude, ['first']);
  const ch = opts.json().challenge;
  const second = await api(app, sb, 'POST', '/passkeys/register', registerBody(newAuthenticator('second'), clientData('webauthn.create', ch)));
  assert.deepEqual(second.json(), { id: 'second', name: 'Passkey 2' });
  const after = await api(app, sb, 'POST', '/passkeys/register/options');
  assert.deepEqual([...after.json().exclude].sort(), ['first', 'second']);
  assert.deepEqual(
    (await list(app, sb)).map((p) => [p.id, p.name]).sort(),
    [['first', 'Passkey 1'], ['second', 'Passkey 2']],
  );
});

test('delete removes the passkey and login with it fails', async (t) => {
  const { app, sb } = await setup(t);
  const keep = newAuthenticator('keep');
  const drop = newAuthenticator('drop');
  await register(app, sb, keep);
  await register(app, sb, drop);
  const del = await api(app, sb, 'DELETE', '/passkeys/drop');
  assert.equal(del.statusCode, 200, del.body);
  assert.deepEqual(del.json(), { ok: true });
  assert.deepEqual((await list(app, sb)).map((p) => p.id), ['keep']);
  await expectError(await login(app, sb, drop), 'Passkey not recognised.');
  const ok = await login(app, sb, keep);
  assert.equal(ok.statusCode, 200, ok.body);
  const opts = await api(app, sb, 'POST', '/passkeys/register/options');
  assert.deepEqual(opts.json().exclude, ['keep']);
});

test('passkeys are per sandbox for list, exclude, login and delete', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  const auth = newAuthenticator('shared-id');
  await register(app, a, auth);
  assert.deepEqual(await list(app, b), []);
  const opts = await api(app, b, 'POST', '/passkeys/register/options');
  assert.deepEqual(opts.json().exclude, []);
  await expectError(await login(app, b, auth), 'Passkey not recognised.');
  await api(app, b, 'DELETE', '/passkeys/shared-id');
  assert.equal((await list(app, a)).length, 1);
  const reg = await register(app, b, auth);
  assert.equal(reg.name, 'Passkey 1');
});

test('sandbox reset clears passkeys and outstanding challenges', async (t) => {
  const { app, sb } = await setup(t);
  const other = await newSandbox(app);
  const auth = newAuthenticator('k');
  await register(app, sb, auth);
  await register(app, other, newAuthenticator('o'));
  const pending = await challenge(app, sb, 'register');
  const rr = await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset`, payload: {} });
  assert.ok(rr.statusCode < 300, `reset -> ${rr.statusCode} ${rr.body}`);
  assert.deepEqual(await list(app, sb), []);
  const res = await api(app, sb, 'POST', '/passkeys/register', registerBody(auth, clientData('webauthn.create', pending)));
  await expectError(res, 'Unknown or used challenge.');
  assert.equal((await list(app, other)).length, 1);
});
