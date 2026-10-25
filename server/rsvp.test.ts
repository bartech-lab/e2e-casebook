import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createRsvps } from './rsvp.ts';

test('a reply redirects a form post, answers JSON to a script, and drops the guest unless ticked', async () => {
  const rsvps = createRsvps();
  const f = Fastify();
  await f.register(async (scope) => rsvps.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (payload: object, accept = 'text/html') => f.inject({ method: 'POST', url: '/api/s/a/rsvp', payload, headers: { accept } });
  assert.equal((await post({ name: ' ' })).statusCode, 400);
  const native = await post({ name: 'Ola', guestName: 'Marek', note: 'Cake' });
  assert.equal(native.statusCode, 303);
  assert.equal(native.headers.location, '/api/s/a/rsvp?thanks=Ola');
  assert.deepEqual((await post({ name: 'Piotr', plusOne: 'yes', guestName: 'Ania' }, 'application/json')).json(), { name: 'Piotr' });
  assert.deepEqual((await f.inject({ url: '/api/s/a/rsvps' })).json().replies, [
    { name: 'Ola', guest: null, note: 'Cake' },
    { name: 'Piotr', guest: 'Ania', note: '' },
  ]);
  assert.match((await f.inject({ url: '/api/s/a/rsvp?thanks=%3Cb%3E' })).body, /See you there, &lt;b&gt;!/);
});

test('the RSVP page escapes every HTML special character and is served as uncached HTML', async () => {
  const rsvps = createRsvps();
  const f = Fastify();
  await f.register(async (scope) => rsvps.register(scope), { prefix: '/api/s/:sandbox' });
  const thanks = await f.inject({ url: `/api/s/a/rsvp?thanks=${encodeURIComponent(`"Tom" & 'Jo'`)}` });
  assert.equal(thanks.headers['content-type'], 'text/html; charset=utf-8');
  assert.equal(thanks.headers['cache-control'], 'no-store');
  assert.match(thanks.body, /See you there, &quot;Tom&quot; &amp; &#39;Jo&#39;!/);
  const form = await f.inject({ url: `/api/s/${encodeURIComponent('a"><b')}/rsvp` });
  assert.match(form.body, /action="\/api\/s\/a&quot;&gt;&lt;b\/rsvp"/);
});

test('RSVP replies cap field lengths, keep a guest only when ticked and named, and encode the thanks redirect', async () => {
  const rsvps = createRsvps();
  const f = Fastify();
  await f.register(async (scope) => rsvps.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (payload: object) => f.inject({ method: 'POST', url: '/api/s/a/rsvp', payload, headers: { accept: 'application/json' } });
  await post({ name: 'n'.repeat(61), plusOne: true, guestName: 'g'.repeat(61), note: 'x'.repeat(201) });
  await post({ name: 'Ola', plusOne: 'yes', guestName: '  ' });
  await post({ name: 'Ben', plusOne: 'no', guestName: 'Ania' });
  assert.deepEqual((await f.inject({ url: '/api/s/a/rsvps' })).json().replies, [
    { name: 'n'.repeat(60), guest: 'g'.repeat(60), note: 'x'.repeat(200) },
    { name: 'Ola', guest: null, note: '' },
    { name: 'Ben', guest: null, note: '' },
  ]);
  const native = await f.inject({ method: 'POST', url: '/api/s/a/rsvp', payload: { name: 'Ola & Ben' }, headers: { accept: 'text/html' } });
  assert.equal(native.headers.location, '/api/s/a/rsvp?thanks=Ola%20%26%20Ben');
  rsvps.clear('a');
  assert.deepEqual((await f.inject({ url: '/api/s/a/rsvps' })).json().replies, []);
});
