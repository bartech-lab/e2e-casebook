import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createGuestbook } from './guestbook.ts';

async function app() {
  const book = createGuestbook();
  const f = Fastify();
  await f.register(async (scope) => book.register(scope), { prefix: '/api/s/:sandbox' });
  return f;
}

test('signing redirects with 303, the flash shows once, and entries are escaped and newest first', async () => {
  const f = await app();
  const one = await f.inject({ method: 'POST', url: '/api/s/a/guestbook', headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'name=Ola&message=%3Cb%3EHi%3C%2Fb%3E' });
  assert.equal(one.statusCode, 303);
  assert.equal(one.headers.location, '/api/s/a/guestbook');
  const cookie = String(one.headers['set-cookie']).split(';')[0]!;
  const first = await f.inject({ url: '/api/s/a/guestbook', headers: { cookie } });
  assert.match(first.body, /Thank you for signing\./);
  assert.match(first.body, /&lt;b&gt;Hi&lt;\/b&gt;/);
  assert.match(String(first.headers['set-cookie']), /Max-Age=0/);
  const again = await f.inject({ url: '/api/s/a/guestbook' });
  assert.doesNotMatch(again.body, /Thank you/);
  await f.inject({ method: 'POST', url: '/api/s/a/guestbook', headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'name=Marek&message=Second' });
  const body = (await f.inject({ url: '/api/s/a/guestbook' })).body;
  assert.ok(body.indexOf('Marek') < body.indexOf('Ola'));
  assert.doesNotMatch((await f.inject({ url: '/api/s/b/guestbook' })).body, /Ola/);
});

test('a missing field is a 422 page with the error and what was typed', async () => {
  const f = await app();
  const res = await f.inject({ method: 'POST', url: '/api/s/a/guestbook', headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'name=Ola&message=' });
  assert.equal(res.statusCode, 422);
  assert.match(res.body, /Enter a message\./);
  assert.match(res.body, /value="Ola"/);
});
