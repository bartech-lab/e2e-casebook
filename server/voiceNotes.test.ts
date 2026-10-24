import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('voice notes: refuse empty audio and bad durations, store and serve the bytes, cleared by reset', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const post = (payload: Buffer, durationMs: string) =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/voice-notes?durationMs=${durationMs}`, headers: { 'content-type': 'audio/webm' }, payload });
  assert.equal((await post(Buffer.alloc(0), '1000')).statusCode, 400);
  assert.equal((await post(Buffer.from('abc'), '0')).statusCode, 400);
  assert.equal((await post(Buffer.from('abc'), '40000')).statusCode, 400);
  const ok = await post(Buffer.from('webm bytes'), '3200');
  assert.equal(ok.statusCode, 201);
  assert.deepEqual(ok.json(), { id: 1, bytes: 10, durationMs: 3200 });
  const audio = await app.inject({ method: 'GET', url: `/api/s/${sb}/voice-notes/1/audio` });
  assert.equal(audio.headers['content-type'], 'audio/webm');
  assert.equal(audio.body, 'webm bytes');
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/voice-notes` })).json(), { notes: [] });
});
