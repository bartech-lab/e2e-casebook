import { useCallback, useEffect, useState } from 'react';

type Order = { id: string; quantity: number };
type Gig = { left: number; orders: Order[] };
const PRICE = 120;

export function GigTickets({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/gig`;
  const [gig, setGig] = useState<Gig | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(url);
    setGig((await res.json()) as Gig);
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setPaying(false);
      setError('');
      void load();
    };
    addEventListener('pageshow', onShow);
    return () => removeEventListener('pageshow', onShow);
  }, [load]);

  async function pay() {
    setPaying(true);
    setError('');
    const res = await fetch(`${url}/buy`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quantity }) });
    const body = (await res.json()) as { order?: Order; left?: number; error?: string };
    if (!res.ok || !body.order) {
      setPaying(false);
      setError(body.error ?? 'Payment failed.');
      if (body.left !== undefined) setGig((g) => g && { ...g, left: body.left! });
      return;
    }
    location.assign(`/embed/gig-receipt.html?order=${body.order.id}&quantity=${body.order.quantity}`);
  }

  const soldOut = gig !== null && gig.left === 0;
  return (
    <section>
      <h1>Concert tickets</h1>
      <p>Night Trains, live at Stodoła, 14 November. {PRICE} PLN per ticket.</p>
      <p role="status">{gig === null ? 'Loading…' : soldOut ? 'Sold out' : `Tickets left: ${gig.left}`}</p>
      <label>
        Quantity{' '}
        <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>{' '}
      <button type="button" disabled={paying || soldOut || gig === null} onClick={() => void pay()}>
        {paying ? 'Paying…' : `Pay ${quantity * PRICE} PLN`}
      </button>
      <p role="alert">{error}</p>
      {gig !== null && gig.orders.length > 0 && (
        <>
          <h2>Your orders</h2>
          <ul aria-label="Your orders">
            {gig.orders.map((o) => (
              <li key={o.id}>
                {o.id}: {o.quantity === 1 ? '1 ticket' : `${o.quantity} tickets`}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
