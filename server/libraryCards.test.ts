import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createLibraryCards } from './libraryCards.ts';

test('applications are kept per sandbox as sent', async () => {
  const cards = createLibraryCards();
  const f = Fastify();
  await f.register(async (scope) => cards.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (payload: object) => f.inject({ method: 'POST', url: '/api/s/a/library-cards', payload });
  assert.equal((await post({})).statusCode, 400);
  assert.equal((await post({ birthDate: '2012-02-29', parentEmail: 3 })).statusCode, 400);
  assert.equal((await post({ birthDate: '2012-02-29', parentEmail: 'mum@example.com' })).statusCode, 200);
  assert.deepEqual((await f.inject({ url: '/api/s/a/library-cards' })).json(), { applications: [{ birthDate: '2012-02-29', parentEmail: 'mum@example.com' }] });
  assert.deepEqual((await f.inject({ url: '/api/s/b/library-cards' })).json(), { applications: [] });
});
