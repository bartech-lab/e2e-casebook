import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { answerFor, createAssistant } from './assistant.ts';

async function app() {
  const assistant = createAssistant();
  const f = Fastify({ forceCloseConnections: true });
  await f.register(async (scope) => assistant.register(scope), { prefix: '/api/s/:sandbox' });
  await f.listen({ port: 0, host: '127.0.0.1' });
  const port = (f.server.address() as { port: number }).port;
  return { f, assistant, url: `http://127.0.0.1:${port}/api/s/a/assistant/ask` };
}

test('the answer streams in several chunks at the sandbox pace', async () => {
  const { f, assistant, url } = await app();
  assistant.setPace('a', 5);
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'Opening hours?' }) });
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let text = '';
  let chunks = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks++;
    text += dec.decode(value, { stream: true });
  }
  assert.equal(text, answerFor('Opening hours?'));
  assert.ok(chunks > 5, `only ${chunks} chunks`);
  await f.close();
});

test('an empty or long question is a 400', async () => {
  const { f, url } = await app();
  for (const question of ['  ', 'x'.repeat(201), 42]) {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) });
    assert.equal(res.status, 400);
  }
  await f.close();
});
