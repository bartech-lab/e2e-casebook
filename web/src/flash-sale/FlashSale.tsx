import { useEffect, useState } from 'react';
import { HttpError, json } from '../http.ts';

type Sale = { price: number; endsAt: string; now: string };
const TICK_MS = 250;
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;
const two = (n: number) => String(n).padStart(2, '0');

function clock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

export function FlashSale({ sandbox }: { sandbox: string }) {
  const [sale, setSale] = useState<{ price: number; endsAt: number; offset: number } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let live = true;
    void (async () => {
      const body = await json<Sale>(await fetch(`/api/s/${sandbox}/sale`));
      if (!live) return;
      setSale({ price: body.price, endsAt: Date.parse(body.endsAt), offset: Date.parse(body.now) - Date.now() });
    })().catch(() => setStatus('Could not load the sale.'));
    return () => {
      live = false;
    };
  }, [sandbox]);

  useEffect(() => {
    if (!sale) return;
    const tick = () => setLeft(Math.max(0, sale.endsAt - (Date.now() + sale.offset)));
    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [sale]);

  async function buy() {
    try {
      const body = await json<{ price: number }>(await fetch(`/api/s/${sandbox}/sale/buy`, { method: 'POST' }));
      setStatus(`Bought for ${pln(body.price)}.`);
    } catch (err) {
      setStatus(err instanceof HttpError ? err.message : 'Could not buy. Try again.');
    }
  }

  const ended = left !== null && left <= 0;
  return (
    <section>
      <h1>Flash sale</h1>
      {sale && left !== null && (
        <>
          <p>
            Espresso grinder: <strong>{pln(sale.price)}</strong>
          </p>
          {ended ? (
            <p>The sale has ended.</p>
          ) : (
            <p>
              Ends in <time data-testid="countdown">{clock(left)}</time>
            </p>
          )}
          <button type="button" disabled={ended} onClick={() => void buy()}>
            Buy now
          </button>
        </>
      )}
      <p role="status">{status}</p>
    </section>
  );
}
