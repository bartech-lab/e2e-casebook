import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createTicketContacts } from './ticketContacts.ts';

test('postal codes give a city after a short wait, and contacts are kept per sandbox', async () => {
  const t = createTicketContacts();
  const f = Fastify();
  await f.register(async (scope) => t.register(scope), { prefix: '/api/s/:sandbox' });
  const started = Date.now();
  assert.deepEqual((await f.inject({ url: '/api/s/a/postcodes/30-001' })).json(), { city: 'Kraków' });
  assert.ok(Date.now() - started >= 140);
  assert.equal((await f.inject({ url: '/api/s/a/postcodes/99-999' })).statusCode, 404);
  const contact = { givenName: 'Ola', familyName: 'Nowak', email: 'ola@example.com', tel: '+48 600 100 200', postalCode: '30-001', city: 'Kraków', street: 'Floriańska 1' };
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/ticket-contacts', payload: { givenName: 'Ola' } })).statusCode, 400);
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/ticket-contacts', payload: contact })).statusCode, 200);
  assert.deepEqual((await f.inject({ url: '/api/s/a/ticket-contacts' })).json(), { contacts: [contact] });
  assert.deepEqual((await f.inject({ url: '/api/s/b/ticket-contacts' })).json(), { contacts: [] });
});
