import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { buildApp } from './app.ts';

test('invoices: list with totals, PDF with headers, valid xref and the invoice text', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const list = (await app.inject({ method: 'GET', url: `/api/s/${sb}/invoices` })).json().invoices;
  assert.deepEqual(list.map((i: { number: string; total: number }) => [i.number, i.total]), [['INV-2026-0012', 25705], ['INV-2026-0013', 42927]]);

  const res = await app.inject({ method: 'GET', url: `/api/s/${sb}/invoices/INV-2026-0012.pdf` });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.equal(res.headers['content-disposition'], 'attachment; filename="INV-2026-0012.pdf"');
  const body = res.rawPayload;
  assert.equal(body.subarray(0, 5).toString(), '%PDF-');
  const text = body.toString('latin1');
  const startxref = Number(/startxref\n(\d+)/.exec(text)![1]);
  assert.equal(text.slice(startxref, startxref + 4), 'xref');
  const offsets = [...text.slice(startxref).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
  assert.equal(offsets.length, 5);
  offsets.forEach((offset, i) => assert.equal(text.slice(offset, offset + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`));
  const start = body.indexOf('stream\n') + 7;
  const content = inflateSync(body.subarray(start, body.indexOf('\nendstream'))).toString('latin1');
  assert.match(content, /\(Lamp shade 2 x 39\.99 PLN = 79\.98 PLN\) Tj/);
  assert.match(content, /\(VAT 23% 48\.07 PLN\) Tj/);
  assert.match(content, /\(Total 257\.05 PLN\) Tj/);

  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/invoices/INV-0000.pdf` })).statusCode, 404);
});
