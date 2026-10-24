import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('statements: months follow Warsaw time, the CSV is safe for spreadsheets', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const oct = (await app.inject({ method: 'GET', url: `/api/s/${sb}/statement?month=2026-10` })).json();
  assert.equal(oct.rows[0].date, '2026-10-01 01:00');
  assert.equal(oct.rows.at(-1).description, '-10% coupon');
  assert.equal(oct.total, '8259.70');
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/statement?month=2026-12` })).statusCode, 400);
  const res = await app.inject({ method: 'GET', url: `/api/s/${sb}/statement.csv?month=2026-11` });
  assert.match(String(res.headers['content-disposition']), /^attachment; .*filename\*=UTF-8''Wyci%C4%85g%202026-11\.csv$/);
  assert.equal(res.body, '\ufeffDate,Description,Amount\r\n2026-11-01 00:30,Night bus,-4.60\r\n2026-11-02 09:00,Gym,-99.00\r\nTotal,,-103.60\r\n');
});
