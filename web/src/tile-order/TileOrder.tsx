import { useState } from 'react';

type Line = { tile: string; qty: number };
const TILES = [
  { id: 'white-matt', name: 'White matt 20×20', price: 89 },
  { id: 'terracotta', name: 'Terracotta hexagon', price: 129 },
  { id: 'blue-metro', name: 'Blue metro', price: 149 },
];
const nameOf = (id: string) => TILES.find((t) => t.id === id)!.name;
const priceOf = (id: string) => TILES.find((t) => t.id === id)!.price;
const pln = (n: number) => `${n} zł`;

export function TileOrder({ sandbox }: { sandbox: string }) {
  const key = `tile-order:${sandbox}`;
  const [lines, setLines] = useState<Line[]>(() => JSON.parse(sessionStorage.getItem(key) ?? '[]') as Line[]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  function update(next: Line[]) {
    setLines(next);
    sessionStorage.setItem(key, JSON.stringify(next));
  }

  function add(tile: string) {
    setMessage('');
    const line = lines.find((l) => l.tile === tile);
    update(line ? lines.map((l) => (l.tile === tile ? { ...l, qty: Math.min(99, l.qty + 1) } : l)) : [...lines, { tile, qty: 1 }]);
  }

  function setQty(tile: string, value: string) {
    const qty = Number(value);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return;
    update(lines.map((l) => (l.tile === tile ? { ...l, qty } : l)));
  }

  async function send() {
    if (sending || !lines.length) return;
    setSending(true);
    try {
      const res = await fetch(`/api/s/${sandbox}/tile-orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) throw new Error();
      const order = (await res.json()) as { id: number };
      update([]);
      setMessage(`Order ${order.id} sent.`);
    } catch {
      setMessage('Could not send the order. Try again.');
    } finally {
      setSending(false);
    }
  }

  const total = lines.reduce((s, l) => s + priceOf(l.tile) * l.qty, 0);
  return (
    <section>
      <h1>Tile order</h1>
      <ul aria-label="Tiles">
        {TILES.map((t) => (
          <li key={t.id}>
            {t.name}, {pln(t.price)} per m²{' '}
            <button type="button" onClick={() => add(t.id)}>
              Add {t.name}
            </button>
          </li>
        ))}
      </ul>
      <h2>Your order</h2>
      {lines.length ? (
        <ul aria-label="Your order">
          {lines.map((l) => (
            <li key={l.tile}>
              <label>
                {nameOf(l.tile)}, m²{' '}
                <input type="number" min={1} max={99} value={l.qty} onChange={(e) => setQty(l.tile, e.target.value)} />
              </label>{' '}
              <button type="button" onClick={() => update(lines.filter((x) => x.tile !== l.tile))}>
                Remove {nameOf(l.tile)}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing yet.</p>
      )}
      <p>Total: {pln(total)}</p>
      <button type="button" onClick={() => void send()} disabled={sending || !lines.length}>
        Send order
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
