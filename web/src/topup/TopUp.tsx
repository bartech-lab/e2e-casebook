import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json, sendJson } from '../http.ts';

type Wallet = { balance: number; topups: { amount: number; last4: string }[] };

const AMOUNTS = [1000, 2000, 5000];
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function TopUp({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['wallet', sandbox];
  const url = `/api/s/${sandbox}/topups`;
  const wallet = useQuery({ queryKey: key, queryFn: async () => json<Wallet>(await fetch(url)) });
  const [amount, setAmount] = useState(2000);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);

  const pay = useMutation({
    mutationFn: async ({ token }: { token: string; last4: string }) => json<Wallet>(await fetch(url, sendJson('POST', { amount, token }))),
    onSuccess: (_data, { last4 }) => {
      setMessage(`Paid ${pln(amount)} with the card ending ${last4}.`);
      void client.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      setMessage(error instanceof HttpError && error.status === 402 ? 'Card declined. You were not charged.' : 'The payment failed. You were not charged.');
    },
    onSettled: () => setPaying(false),
  });

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; token?: string; last4?: string };
      if (data.type === 'ready') setReady(true);
      else if (data.type === 'invalid') setPaying(false);
      else if (data.type === 'token' && data.token && data.last4) pay.mutate({ token: data.token, last4: data.last4 });
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pay]);

  return (
    <section>
      <h1>Top up</h1>
      <p>Balance: {wallet.data ? pln(wallet.data.balance) : '…'}</p>
      <fieldset>
        <legend>Amount</legend>
        {AMOUNTS.map((a) => (
          <label key={a}>
            <input type="radio" name="amount" checked={amount === a} onChange={() => setAmount(a)} /> {pln(a)}
          </label>
        ))}
      </fieldset>
      <iframe ref={frame} title="Card details" src={`/widget/card.html?sandbox=${sandbox}`} sandbox="allow-scripts allow-forms" className="card-frame" />
      <p>
        <button
          type="button"
          disabled={!ready || paying}
          onClick={() => {
            setMessage('');
            setPaying(true);
            frame.current?.contentWindow?.postMessage({ type: 'tokenize' }, '*');
          }}
        >
          Pay {pln(amount)}
        </button>
      </p>
      <p role="status">{message}</p>
      <h2>Top-ups</h2>
      <ul aria-label="Top-ups">
        {wallet.data?.topups.map((t, i) => (
          <li key={i}>
            {pln(t.amount)}, card ending {t.last4}
          </li>
        ))}
      </ul>
    </section>
  );
}
