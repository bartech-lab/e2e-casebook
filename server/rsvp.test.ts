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
