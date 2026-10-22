import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('checklist: saved in order, a known clientId is not saved again, validated, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const post = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/checklist`, payload });
  assert.equal((await post({ clientId: 'aaaa-0001', text: ' Milk ' })).statusCode, 201);
  const again = await post({ clientId: 'aaaa-0001', text: 'Milk again' });
  assert.equal(again.statusCode, 200);
  assert.deepEqual(again.json(), { clientId: 'aaaa-0001', text: 'Milk' });
  assert.equal((await post({ clientId: 'aaaa-0002', text: 'Bread' })).statusCode, 201);
  for (const bad of [{ clientId: 'short', text: 'x' }, { clientId: 'aaaa-0003', text: ' ' }, { clientId: 'aaaa-0003', text: 'x'.repeat(101) }, { text: 'x' }]) {
    assert.equal((await post(bad)).statusCode, 400, JSON.stringify(bad).slice(0, 40));
  }
  const list = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/checklist` })).json().items.map((i: { text: string }) => i.text);
  assert.deepEqual(await list(), ['Milk', 'Bread']);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(await list(), []);
});
