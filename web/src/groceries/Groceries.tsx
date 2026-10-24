import { useState } from 'react';

const PRODUCTS = [
  { id: 'milk', name: 'Milk', stock: 9 },
  { id: 'bread', name: 'Rye bread', stock: 9 },
  { id: 'eggs', name: 'Eggs', stock: 0 },
  { id: 'apples', name: 'Apples', stock: 2 },
];
const items = (n: number) => (n === 1 ? '1 item' : `${n} items`);

export function Groceries() {
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');
  const count = (b: Record<string, number>) => Object.values(b).reduce((s, n) => s + n, 0);

  function add(id: string) {
    const p = PRODUCTS.find((x) => x.id === id)!;
    const have = basket[id] ?? 0;
    if (have >= p.stock) {
      setAlert(p.stock === 0 ? `${p.name} are out of stock.` : `Only ${p.stock} ${p.name.toLowerCase()} left.`);
      return;
    }
    const next = { ...basket, [id]: have + 1 };
    setBasket(next);
    setAlert('');
    setStatus(`Added ${p.name.toLowerCase()}. ${items(count(next))} in the basket.`);
  }

  function remove(id: string) {
    const p = PRODUCTS.find((x) => x.id === id)!;
    const next = { ...basket, [id]: (basket[id] ?? 0) - 1 };
    if (next[id] === 0) delete next[id];
    setBasket(next);
    setAlert('');
    setStatus(`Removed ${p.name.toLowerCase()}. ${items(count(next))} in the basket.`);
  }

  return (
    <section>
      <h1>Groceries</h1>
      <ul className="grocery-list" aria-label="Products">
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <span>{basket[p.id] ?? 0} in basket</span>
            <button type="button" aria-label={`Add ${p.name.toLowerCase()}`} onClick={() => add(p.id)}>
              +
            </button>
            <button type="button" aria-label={`Remove ${p.name.toLowerCase()}`} disabled={!basket[p.id]} onClick={() => remove(p.id)}>
              −
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="grocery-status">
        {status}
      </p>
      <p role="alert" className="grocery-alert">
        {alert}
      </p>
    </section>
  );
}
