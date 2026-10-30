import { useState, type FormEvent } from 'react';

type Line = { key: number; item: string; quantity: string };
let nextKey = 3;

export function QuickInvoice({ sandbox }: { sandbox: string }) {
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { key: 1, item: '', quantity: '1' },
    { key: 2, item: '', quantity: '1' },
  ]);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const edit = (key: number, change: Partial<Line>) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, ...change } : l)));

  async function save(e: FormEvent) {
    e.preventDefault();
    const filled = lines.filter((l) => l.item.trim());
    if (!customer.trim() || filled.length === 0) {
      setMessage('Add a customer and at least one line.');
      return;
    }
    const res = await fetch(`/api/s/${sandbox}/quick-invoices`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customer: customer.trim(), lines: filled.map((l) => ({ item: l.item.trim(), quantity: Number(l.quantity) })), notes }),
    });
    setMessage(res.ok ? `Invoice ${((await res.json()) as { number: number }).number} saved.` : 'Could not save the invoice.');
  }

  return (
    <section>
      <h1>Quick invoice</h1>
      <form onSubmit={(e) => void save(e)} className="quick-invoice">
        <label>
          Customer <input value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </label>
        <fieldset>
          <legend>Lines</legend>
          {lines.map((l, i) => (
            <div key={l.key} className="invoice-line">
              <label>
                Item {i + 1} <input value={l.item} onChange={(e) => edit(l.key, { item: e.target.value })} />
              </label>
              <label>
                Quantity {i + 1} <input type="number" min={1} value={l.quantity} onChange={(e) => edit(l.key, { quantity: e.target.value })} />
              </label>
              <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => setLines((cur) => cur.filter((x) => x.key !== l.key))}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setLines((cur) => [...cur, { key: nextKey++, item: '', quantity: '1' }])}>
            Add line
          </button>
        </fieldset>
        <label>
          Notes <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit">Save invoice</button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
