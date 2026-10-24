import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Tx = { at: string; description: string; amount: number };

export const MONTHS = ['2026-09', '2026-10', '2026-11'];
const TRANSACTIONS: Tx[] = [
  { at: '2026-09-30T21:30:00Z', description: 'Rent, September', amount: -250000 },
  { at: '2026-09-30T23:00:00Z', description: 'Café Bliss', amount: -1890 },
  { at: '2026-10-03T10:15:00Z', description: 'Salary', amount: 845010 },
  { at: '2026-10-07T12:00:00Z', description: '=HYPERLINK("http://example.test","Refund")', amount: 1020 },
  { at: '2026-10-12T08:40:00Z', description: 'Żabka, "Nowy Świat"', amount: -1230 },
  { at: '2026-10-15T17:05:00Z', description: '+48 600 100 200 top-up', amount: -5000 },
  { at: '2026-10-20T09:00:00Z', description: 'Transfer to Ola\nfor the tickets', amount: -12010 },
  { at: '2026-10-28T19:30:00Z', description: '-10% coupon', amount: 70 },
  { at: '2026-10-31T23:30:00Z', description: 'Night bus', amount: -460 },
  { at: '2026-11-02T08:00:00Z', description: 'Gym', amount: -9900 },
];

const local = (iso: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Warsaw', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
};
const monthOf = (iso: string) => local(iso).slice(0, 7);
const money = (grosze: number) => `${grosze < 0 ? '-' : ''}${Math.floor(Math.abs(grosze) / 100)}.${String(Math.abs(grosze) % 100).padStart(2, '0')}`;

export function statement(month: string) {
  const txs = TRANSACTIONS.filter((t) => monthOf(t.at) === month);
  const sum = txs.reduce((s, t) => s + t.amount, 0);
  return { month, rows: txs.map((t) => ({ date: local(t.at), description: t.description, amount: money(t.amount) })), total: money(sum) };
}

const inert = (text: string) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
const cell = (text: string) => (/[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);

export function csv(month: string) {
  const s = statement(month);
  const lines = [['Date', 'Description', 'Amount'], ...s.rows.map((r) => [r.date, inert(r.description), r.amount]), ['Total', '', s.total]];
  return '\ufeff' + lines.map((l) => l.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function registerStatements(scope: FastifyInstance) {
  const month = (q: unknown) => {
    const m = (q as { month?: string }).month ?? '';
    return MONTHS.includes(m) ? m : null;
  };
  scope.get<{ Params: Params }>('/statement', async (req, reply) => {
    const m = month(req.query);
    if (!m) return reply.code(400).send({ error: `month must be one of ${MONTHS.join(', ')}` });
    return statement(m);
  });
  scope.get<{ Params: Params }>('/statement.csv', async (req, reply) => {
    const m = month(req.query);
    if (!m) return reply.code(400).send({ error: `month must be one of ${MONTHS.join(', ')}` });
    const name = `Wyciąg ${m}.csv`;
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="Wyciag ${m}.csv"; filename*=UTF-8''${encodeURIComponent(name)}`)
      .send(csv(m));
  });
}
