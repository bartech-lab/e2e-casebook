import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Item = { sku: string; name: string; price: number };
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;
const hhmm = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function PriceList({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/price-list`;
  const [items, setItems] = useState<Item[] | null>(null);
  const [status, setStatus] = useState('');
  const [checking, setChecking] = useState(false);
  const etag = useRef<string | null>(null);

  async function load(first: boolean) {
    const res = await fetch(url);
    const tag = res.headers.get('etag');
    const body = await json<{ items: Item[] }>(res);
    if (!first && tag !== null && tag === etag.current) {
      setStatus(`Prices unchanged, checked at ${hhmm()}.`);
      return;
    }
    etag.current = tag;
    setItems(body.items);
    if (!first) setStatus(`Prices updated at ${hhmm()}.`);
  }

  useEffect(() => {
    void load(true).catch(() => setStatus('Could not load the prices.'));
  }, [url]);

  async function check() {
    setChecking(true);
    try {
      await load(false);
    } catch {
      setStatus('Could not check the prices. Try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <section>
      <h1>Price list</h1>
      {items && (
        <table>
          <caption>Prices</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.sku}>
                <td>{i.name}</td>
                <td>{pln(i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" disabled={checking || !items} onClick={() => void check()}>
        Check for new prices
      </button>
      <p role="status">{status}</p>
    </section>
  );
}
