import { useEffect, useState } from 'react';

type Basket = Record<string, number>;

const PRODUCTS = ['Apples', 'Bread', 'Cheese'];
const basketKey = (sandbox: string) => `basket:${sandbox}`;

function read(sandbox: string): Basket {
  try {
    return JSON.parse(localStorage.getItem(basketKey(sandbox)) ?? '{}') as Basket;
  } catch {
    return {};
  }
}

export function BasketPage({ sandbox }: { sandbox: string }) {
  const [basket, setBasket] = useState(() => read(sandbox));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === basketKey(sandbox) || e.key === null) setBasket(read(sandbox));
    };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, [sandbox]);

  function save(next: Basket) {
    if (Object.keys(next).length) localStorage.setItem(basketKey(sandbox), JSON.stringify(next));
    else localStorage.removeItem(basketKey(sandbox));
    setBasket(next);
  }

  function change(product: string, by: number) {
    const next = { ...read(sandbox) };
    const qty = (next[product] ?? 0) + by;
    if (qty > 0) next[product] = qty;
    else delete next[product];
    save(next);
  }

  const count = Object.values(basket).reduce((a, b) => a + b, 0);

  return (
    <section>
      <h1>Basket</h1>
      <p role="status">
        Basket: {count} {count === 1 ? 'item' : 'items'}
      </p>
      <ul aria-label="Products">
        {PRODUCTS.map((p) => (
          <li key={p}>
            {p}: {basket[p] ?? 0}{' '}
            <button type="button" aria-label={`Add ${p}`} onClick={() => change(p, 1)}>
              +
            </button>{' '}
            <button type="button" aria-label={`Remove ${p}`} disabled={!basket[p]} onClick={() => change(p, -1)}>
              −
            </button>
          </li>
        ))}
      </ul>
      <button type="button" disabled={count === 0} onClick={() => save({})}>
        Empty basket
      </button>
    </section>
  );
}
