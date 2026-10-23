import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('tickets: up to 3 PNG or JPEG images, measured in bytes', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const post = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/tickets`, payload });
  const png = `data:image/png;base64,${Buffer.from('abc').toString('base64')}`;
  assert.equal((await post({ text: 'x', images: [png, png, png, png] })).statusCode, 400);
  assert.equal((await post({ text: 'x', images: ['data:application/pdf;base64,AAAA'] })).statusCode, 400);
  assert.deepEqual((await post({ text: ' broken ', images: [png] })).json(), { text: 'broken', images: [{ type: 'image/png', bytes: 3 }] });
});
