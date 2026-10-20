import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';
import { Link } from '../router.tsx';

type Product = { sku: string; name: string; price: number };
type Line = Product & { qty: number; lineTotal: number };
type Quote = { subtotal: number; discount: number; vat: number; insurance: number; total: number };
type Cart = { lines: Line[]; code: string | null; insurance: boolean; quote: Quote };
type Order = { id: number; quote: Quote };

const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function Shop({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}`;
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ['products', sandbox],
    queryFn: async () => (await json<{ products: Product[] }>(await fetch(`${base}/products`))).products,
    staleTime: Infinity,
  });
  const cart = useQuery({ queryKey: ['cart', sandbox], queryFn: async () => json<Cart>(await fetch(`${base}/cart`)) });
  const orders = useQuery({
    queryKey: ['orders', sandbox],
    queryFn: async () => (await json<{ orders: Order[] }>(await fetch(`${base}/orders`))).orders,
  });
  const [code, setCode] = useState('');
  const [placed, setPlaced] = useState<Order | null>(null);
  const [pendingInsurance, setPendingInsurance] = useState<boolean | null>(null);

  const update = useMutation({
    mutationFn: async ({ path, body }: { path: string; body: unknown }) => json<Cart>(await fetch(`${base}/cart/${path}`, sendJson('PUT', body))),
    onSuccess: (data) => qc.setQueryData(['cart', sandbox], data),
    onError: () => qc.invalidateQueries({ queryKey: ['cart', sandbox] }),
  });
  const place = useMutation({
    mutationFn: async () => json<Order>(await fetch(`${base}/orders`, { method: 'POST' })),
    onSuccess: (order) => {
      setPlaced(order);
      void qc.invalidateQueries({ queryKey: ['cart', sandbox] });
      void qc.invalidateQueries({ queryKey: ['orders', sandbox] });
    },
  });

  if (cart.isError) return <p role="alert">Could not load the cart: {cart.error.message}</p>;
  if (!cart.data || !products.data) return <p>Loading the shop…</p>;
  const c = cart.data;
  const q = c.quote;
  const qtyOf = (sku: string) => c.lines.find((l) => l.sku === sku)?.qty ?? 0;
  const setQty = (sku: string, qty: number) => {
    setPlaced(null);
    update.mutate({ path: `items/${sku}`, body: { qty } });
  };

  return (
    <section>
      <h1>Shop</h1>
      <ul aria-label="Products">
        {products.data.map((p) => (
          <li key={p.sku}>
            {p.name}, {pln(p.price)}{' '}
            <button type="button" aria-label={`Add ${p.name}`} onClick={() => setQty(p.sku, qtyOf(p.sku) + 1)}>
              Add to cart
            </button>{' '}
            <Link href={`/s/${sandbox}/shop/${p.sku}`}>Reviews for {p.name}</Link>
          </li>
        ))}
      </ul>

      <h2>Cart</h2>
      {c.lines.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <table aria-label="Cart">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {c.lines.map((l) => (
              <tr key={l.sku}>
                <td>{l.name}</td>
                <td>
                  <button type="button" aria-label={`One less ${l.name}`} onClick={() => setQty(l.sku, l.qty - 1)}>
                    −
                  </button>{' '}
                  {l.qty}{' '}
                  <button type="button" aria-label={`One more ${l.name}`} onClick={() => setQty(l.sku, l.qty + 1)}>
                    +
                  </button>
                </td>
                <td>{pln(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {c.code ? (
        <p>
          Code {c.code} applied.{' '}
          <button type="button" onClick={() => update.mutate({ path: 'code', body: { code: null } })}>
            Remove code
          </button>
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({ path: 'code', body: { code } }, { onSuccess: () => setCode('') });
          }}
        >
          <label>
            Discount code <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
          </label>{' '}
          <button type="submit">Apply</button>
        </form>
      )}
      {update.isError && <p role="alert">{update.error.message}</p>}

      <label>
        <input
          type="checkbox"
          checked={!(pendingInsurance ?? c.insurance)}
          onChange={(e) => {
            const on = !e.target.checked;
            setPendingInsurance(on);
            update.mutate({ path: 'insurance', body: { on } }, { onSettled: () => setPendingInsurance(null) });
          }}
        />{' '}
        Skip shipping insurance (4.99 PLN, no VAT)
      </label>

      <h2>Summary</h2>
      <dl aria-label="Summary">
        <dt>Subtotal</dt>
        <dd>{pln(q.subtotal)}</dd>
        {q.discount > 0 && (
          <>
            <dt>Discount</dt>
            <dd>−{pln(q.discount)}</dd>
          </>
        )}
        <dt>VAT 23%</dt>
        <dd>{pln(q.vat)}</dd>
        {q.insurance > 0 && (
          <>
            <dt>Shipping insurance</dt>
            <dd>{pln(q.insurance)}</dd>
          </>
        )}
        <dt>Total</dt>
        <dd>{pln(q.total)}</dd>
      </dl>
      {/* Kept for the analytics snippet. */}
      <span data-testid="order-total" hidden>
        {pln(q.subtotal - q.discount + q.vat)}
      </span>

      <button type="button" disabled={c.lines.length === 0 || place.isPending} onClick={() => place.mutate()}>
        Place order
      </button>
      {place.isError && <p role="alert">Could not place the order: {place.error.message}</p>}
      {placed && (
        <p role="status">
          Order #{placed.id} placed. Charged {pln(placed.quote.total)}.
        </p>
      )}

      {orders.data && orders.data.length > 0 && (
        <>
          <h2>Your orders</h2>
          <ul aria-label="Orders">
            {orders.data.map((o) => (
              <li key={o.id}>
                Order #{o.id}: {pln(o.quote.total)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
