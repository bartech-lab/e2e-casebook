import { useEffect, useState } from 'react';
import { json } from '../http.ts';

type Partner = { token: string; partner: string };
const REWARDS = [
  { id: 'coffee', name: 'A coffee', cost: 100 },
  { id: 'cinema', name: 'A cinema ticket', cost: 300 },
];

export function LoyaltyPoints({ sandbox }: { sandbox: string }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function call(path: string, init: RequestInit = {}) {
    const p = partner ?? (await json<Partner>(await fetch(`/api/s/${sandbox}/loyalty-token`)));
    setPartner(p);
    let res: Response;
    try {
      res = await fetch(`${p.partner}${path}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${p.token}` } });
    } catch {
      setMessage('Could not reach the points service.');
      return;
    }
    const body = (await res.json()) as { points?: number; error?: string };
    if (!res.ok) {
      setMessage(body.error ?? 'The points service refused.');
      return;
    }
    setPoints(body.points!);
    setExpires(res.headers.get('x-points-expire'));
    return body;
  }

  useEffect(() => void call('/balance'), [sandbox]);

  async function redeem(reward: (typeof REWARDS)[number]) {
    setMessage('');
    const done = await call('/redeem', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reward: reward.id }) });
    if (done) setMessage(`Enjoy ${reward.name.toLowerCase()}!`);
  }

  return (
    <section>
      <h1>Loyalty points</h1>
      <p>Points are kept by our partner, Example Rewards.</p>
      <p role="status">
        {points === null ? 'Loading your points…' : `You have ${points} points.`}
        {points !== null && (expires ? ` They expire on ${expires}.` : ' Expiry date unknown.')}
      </p>
      <ul aria-label="Rewards">
        {REWARDS.map((r) => (
          <li key={r.id}>
            {r.name}, {r.cost} points{' '}
            <button type="button" onClick={() => void redeem(r)}>
              Redeem {r.name.toLowerCase()}
            </button>
          </li>
        ))}
      </ul>
      <p role="alert">{message}</p>
    </section>
  );
}
