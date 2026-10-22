import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';
import { parseCsv } from './contacts.ts';

async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const upload = (csv: string) => app.inject({ method: 'POST', url: `/api/s/${sb}/contacts/import`, headers: { 'content-type': 'text/csv' }, payload: csv });
  return { app, sb, upload };
}

test('parseCsv: quotes, doubled quotes, line breaks inside quotes, CRLF, BOM', () => {
  assert.deepEqual(parseCsv('﻿name,email\r\n"Smith, Ann",a@b.c\r\n"Dee ""DJ""",d@e.f\r\n'), [
    ['name', 'email'],
    ['Smith, Ann', 'a@b.c'],
    ['Dee "DJ"', 'd@e.f'],
  ]);
  assert.deepEqual(parseCsv('a,b\nc,d'), [['a', 'b'], ['c', 'd']]);
  assert.deepEqual(parseCsv('"two\nlines",x\n'), [['two\nlines', 'x']]);
});

test('contacts import: valid rows added, bad rows reported by row number, duplicates in file and book, header required', async (t) => {
  const { app, sb, upload } = await setup(t);
  const first = await upload('name,email\nAnn,ann@x.test\nBob,bob@x\n,cy@x.test\nAnn Two,ANN@x.test\nDee,dee@x.test,extra\n\n');
  assert.deepEqual(first.json(), {
    imported: 1,
    errors: [
      { row: 3, message: 'Email is invalid' },
      { row: 4, message: 'Name is missing or too long' },
      { row: 5, message: 'Duplicate email' },
      { row: 6, message: 'Wrong number of fields' },
    ],
  });
  assert.deepEqual((await upload('Name , Email\nZed,ann@x.test\n')).json(), { imported: 0, errors: [{ row: 2, message: 'Duplicate email' }] });
  assert.equal((await upload('email,name\n')).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/contacts/import`, payload: { csv: 'x' } })).statusCode, 415);
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/contacts` })).json(), { contacts: [{ name: 'Ann', email: 'ann@x.test' }] });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/contacts` })).json(), { contacts: [] });
});
