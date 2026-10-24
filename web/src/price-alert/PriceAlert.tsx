import { useEffect, useRef, useState } from 'react';
import { json, sendJson } from '../http.ts';

type Alert = { price: number; on: boolean };
const POLL_MS = 2000;
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function PriceAlert({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}/price-alert`;
  const [alert, setAlert] = useState<Alert | null>(null);
  const [status, setStatus] = useState('');
  const seen = useRef<number | null>(null);
  const notified = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const next = await json<Alert>(await fetch(base));
      if (!live) return;
      setAlert(next);
      if (seen.current === null) seen.current = next.price;
      const lower = next.price < seen.current && next.price !== notified.current;
      if (next.on && lower && 'Notification' in window && Notification.permission === 'granted') {
        notified.current = next.price;
        new Notification('Price drop', { body: `Studio headphones now ${pln(next.price)}`, tag: 'price-drop' });
      }
    };
    void load().catch(() => {});
    const timer = setInterval(() => void load().catch(() => {}), POLL_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [base]);

  async function turnOn() {
    if (!('Notification' in window)) return setStatus('This browser cannot show notifications.');
    const permission = await Notification.requestPermission();
    if (permission === 'denied') return setStatus('Notifications are blocked. You can allow them in your browser settings.');
    if (permission !== 'granted') return setStatus('Alerts stay off until you allow notifications.');
    setAlert(await json<Alert>(await fetch(base, sendJson('PUT', { on: true }))));
    setStatus('Alerts are on.');
  }

  async function turnOff() {
    setAlert(await json<Alert>(await fetch(base, sendJson('PUT', { on: false }))));
    setStatus('Alerts are off.');
  }

  return (
    <section>
      <h1>Price alerts</h1>
      {alert && (
        <>
          <p>
            Studio headphones: <strong>{pln(alert.price)}</strong>
          </p>
          {alert.on ? (
            <button type="button" onClick={() => void turnOff()}>
              Turn off price alerts
            </button>
          ) : (
            <button type="button" onClick={() => void turnOn()}>
              Turn on price alerts
            </button>
          )}
        </>
      )}
      <p role="status">{status}</p>
    </section>
  );
}
