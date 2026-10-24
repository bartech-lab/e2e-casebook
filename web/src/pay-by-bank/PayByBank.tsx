import { useEffect, useState } from 'react';
import { json } from '../http.ts';

type Order = { id: number; status: 'unpaid' | 'paid' | 'declined'; payments: number };
const STATUS = { unpaid: 'Not paid yet', paid: 'Paid', declined: 'Payment declined' };

export function PayByBank({ sandbox }: { sandbox: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const returned = Number(new URLSearchParams(location.search).get('order'));

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/pbb/orders`)
      .then((res) => json<{ orders: Order[] }>(res))
      .then(({ orders }) => setOrders(orders));
  }, [sandbox]);

  async function pay() {
    setError('');
    try {
      const { bank } = await json<{ bank: string }>(await fetch(`/api/s/${sandbox}/pbb/orders`, { method: 'POST' }));
      location.assign(bank);
    } catch {
      setError('Could not start the payment. Try again.');
    }
  }

  const back = orders?.find((o) => o.id === returned);
  return (
    <section>
      <h1>Pay by bank</h1>
      <p>Rowing club membership, 120.00 PLN. You pay on your bank's page and come back here.</p>
      {back && (
        <p role="status">{back.status === 'paid' ? `Payment received for order ${back.id}.` : back.status === 'declined' ? `Your bank declined order ${back.id}. You were not charged.` : `Order ${back.id} is not paid yet.`}</p>
      )}
      <button type="button" onClick={() => void pay()}>
        Pay by bank
      </button>
      {error && <p role="alert">{error}</p>}
      <h2>Your orders</h2>
      {orders === null ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul aria-label="Your orders">
          {orders.map((o) => (
            <li key={o.id}>
              Order {o.id}: {STATUS[o.status]}
              {o.payments > 1 ? ` (charged ${o.payments} times)` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
