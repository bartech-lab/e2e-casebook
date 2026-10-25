import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';
import { csv } from './statements.ts';

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

test('statement CSV neutralises formula starts and quotes cells with commas, quotes or line breaks', () => {
  const lines = csv('2026-10').split('\r\n');
  assert.ok(lines.includes(`2026-10-07 14:00,"'=HYPERLINK(""http://example.test"",""Refund"")",10.20`), 'formula');
  assert.ok(lines.includes(`2026-10-15 19:05,'+48 600 100 200 top-up,-50.00`), 'leading plus');
  assert.ok(lines.includes(`2026-10-28 20:30,'-10% coupon,0.70`), 'leading minus');
  assert.ok(lines.includes('2026-10-12 10:40,"Żabka, ""Nowy Świat""",-12.30'), 'comma and quotes');
  assert.ok(csv('2026-10').includes('2026-10-20 11:00,"Transfer to Ola\nfor the tickets",-120.10\r\n'), 'line break');
});

test('statement CSV download is UTF-8 CSV with an ASCII filename fallback', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const res = await app.inject({ method: 'GET', url: `/api/s/${sb}/statement.csv?month=2026-11` });
  assert.equal(res.headers['content-type'], 'text/csv; charset=utf-8');
  assert.equal(res.headers['content-disposition'], `attachment; filename="Wyciag 2026-11.csv"; filename*=UTF-8''Wyci%C4%85g%202026-11.csv`);
});
