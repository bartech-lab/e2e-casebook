import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('team: roles are enforced on the server and the last admin stays', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const as = (user: string) => ({
    edit: (body: string) => app.inject({ method: 'PUT', url: `/api/s/${sb}/team/doc`, headers: { 'x-user': user }, payload: { body } }),
    role: (member: string, role: string) => app.inject({ method: 'PUT', url: `/api/s/${sb}/team/members/${member}`, headers: { 'x-user': user }, payload: { role } }),
  });
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/team`, headers: { 'x-user': 'mallory' } })).statusCode, 401);
  assert.equal((await as('cy').edit('x')).statusCode, 403);
  assert.equal((await as('bob').role('cy', 'admin')).statusCode, 403);
  assert.equal((await as('ann').role('ann', 'viewer')).statusCode, 409);
  assert.equal((await as('bob').edit('y')).json().body, 'y');
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/team-role`, payload: { user: 'bob', role: 'viewer' } });
  assert.deepEqual((await as('bob').edit('z')).json(), { error: 'Only editors and admins can edit.', role: 'viewer' });
});
