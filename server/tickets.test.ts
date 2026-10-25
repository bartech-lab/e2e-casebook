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

async function sandboxApp(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  return { app, sb };
}

test('tickets: three PNG or JPEG images are allowed, other types and loose data URLs are not, the ticket is kept until reset', async (t) => {
  const { app, sb } = await sandboxApp(t);
  const png = 'data:image/png;base64,iVBORw==';
  const post = (body: Record<string, unknown>) => app.inject({ method: 'POST', url: `/api/s/${sb}/tickets`, payload: { text: 'Broken', images: [], ...body } });
  const latest = () => app.inject({ method: 'GET', url: `/api/s/${sb}/tickets/latest` });
  assert.equal((await post({ text: '   ' })).statusCode, 400);
  assert.equal((await post({ images: ['data:image/gif;base64,R0lG'] })).statusCode, 400);
  assert.equal((await post({ images: [`x${png}`] })).statusCode, 400);
  const ok = await post({ images: [png, png, png] });
  assert.equal(ok.statusCode, 201);
  assert.equal((await latest()).json().images.length, 3);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await latest()).statusCode, 404);
});
