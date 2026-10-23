import { useEffect, useState } from 'react';
import { json } from '../http.ts';

export function Verify({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/sms`;
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetch(url)
      .then((res) => json<{ retryAfter: number }>(res))
      .then(({ retryAfter }) => {
        if (retryAfter > 0) {
          setSent(true);
          setUntil(Date.now() + retryAfter * 1000);
        }
      });
  }, [url]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, Math.ceil((until - now) / 1000));

  async function send() {
    const res = await fetch(url, { method: 'POST' });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after'));
      setUntil(Date.now() + wait * 1000);
      setNow(Date.now());
      setMessage('Too many codes. Wait before asking again.');
      return;
    }
    if (!res.ok) return setMessage('Could not send a code. Try again.');
    const { retryAfter } = (await res.json()) as { retryAfter: number };
    setSent(true);
    setUntil(Date.now() + retryAfter * 1000);
    setNow(Date.now());
    setMessage('We sent a code to +48 600 100 200.');
  }

  return (
    <section>
      <h1>Verify your phone</h1>
      <p>We will text a six-digit code to +48 600 100 200.</p>
      <p>
        <button type="button" disabled={left > 0} onClick={send}>
          {left > 0 ? `Resend in ${left} s` : sent ? 'Resend code' : 'Send code'}
        </button>
      </p>
      <p role="status">{message}</p>
    </section>
  );
}
