import type { FastifyInstance } from 'fastify';
import { deflateSync } from 'node:zlib';

type Line = { item: string; qty: number; price: number };
type Invoice = { number: string; date: string; customer: string; lines: Line[] };

const INVOICES: Invoice[] = [
  { number: 'INV-2026-0012', date: '2026-10-01', customer: 'Anna Nowak', lines: [{ item: 'Desk lamp', qty: 1, price: 12900 }, { item: 'Lamp shade', qty: 2, price: 3999 }] },
  { number: 'INV-2026-0013', date: '2026-10-02', customer: 'Piotr Kowal', lines: [{ item: 'Ladder', qty: 1, price: 34900 }] },
];

const VAT = 23;
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function totals(inv: Invoice) {
  const net = inv.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const vat = Math.round((net * VAT) / 100);
  return { net, vat, gross: net + vat };
}

export function invoiceText(inv: Invoice) {
  const { net, vat, gross } = totals(inv);
  return [
    `Invoice ${inv.number}`,
    `Date ${inv.date}`,
    `Bill to ${inv.customer}`,
    ...inv.lines.map((l) => `${l.item} ${l.qty} x ${pln(l.price)} = ${pln(l.qty * l.price)}`),
    `Net ${pln(net)}`,
    `VAT ${VAT}% ${pln(vat)}`,
    `Total ${pln(gross)}`,
  ];
}

const escapePdf = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);

export function pdf(lines: string[]) {
  const content = ['BT', '/F1 12 Tf', '16 TL', '56 780 Td', ...lines.map((l) => `(${escapePdf(l)}) Tj T*`), 'ET'].join('\n');
  const stream = deflateSync(Buffer.from(content, 'latin1'));
  const objects: Buffer[] = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} /Filter /FlateDecode >>\nstream\n`), stream, Buffer.from('\nendstream')]),
  ];
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
  const offsets: number[] = [];
  let length = parts[0]!.length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const obj = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from('\nendobj\n')]);
    parts.push(obj);
    length += obj.length;
  });
  const xref = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `), 'trailer', `<< /Size ${objects.length + 1} /Root 1 0 R >>`, 'startxref', String(length), '%%EOF', ''].join('\n');
  parts.push(Buffer.from(xref));
  return Buffer.concat(parts);
}

export function registerInvoices(scope: FastifyInstance) {
  scope.get('/invoices', async () => ({
    invoices: INVOICES.map((inv) => ({ number: inv.number, date: inv.date, customer: inv.customer, total: totals(inv).gross })),
  }));

  scope.get<{ Params: { number: string } }>('/invoices/:number.pdf', async (req, reply) => {
    const inv = INVOICES.find((i) => i.number === req.params.number);
    if (!inv) return reply.code(404).send({ error: 'no such invoice' });
    return reply
      .type('application/pdf')
      .header('content-disposition', `attachment; filename="${inv.number}.pdf"`)
      .send(pdf(invoiceText(inv)));
  });
}
