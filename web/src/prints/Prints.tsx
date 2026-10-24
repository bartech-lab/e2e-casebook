import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Account = { account: string; photos: string[] };
type Status =
  | { kind: 'idle' }
  | { kind: 'waiting' }
  | { kind: 'connected'; account: Account }
  | { kind: 'error'; text: string };
type Reply = { type?: string; state?: string; code?: string; error?: string };

export function Prints({ sandbox }: { sandbox: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const popup = useRef<Window | null>(null);
  const state = useRef('');
  const watch = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const onMessage = (e: MessageEvent<Reply>) => {
      const from = popup.current;
      if (!from || e.source !== from || e.origin !== location.origin) return;
      if (e.data?.type !== 'cloudpix' || e.data.state !== state.current) return;
      clearInterval(watch.current);
      popup.current = null;
      from.close();
      if (e.data.error || !e.data.code) {
        setStatus({ kind: 'error', text: 'CloudPix was not connected.' });
        return;
      }
      setStatus({ kind: 'waiting' });
      void fetch(`/api/s/${sandbox}/cloudpix/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: e.data.code }),
      })
        .then((r) => json<Account>(r))
        .then((account) => setStatus({ kind: 'connected', account }))
        .catch(() => setStatus({ kind: 'error', text: 'Could not connect to CloudPix. Try again.' }));
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(watch.current);
    };
  }, [sandbox]);

  function connect() {
    if (popup.current && !popup.current.closed) {
      popup.current.focus();
      return;
    }
    state.current = crypto.randomUUID();
    const w = window.open(`/embed/cloudpix/?sandbox=${sandbox}&state=${state.current}`, 'cloudpix', 'popup,width=480,height=560');
    if (!w) {
      setStatus({ kind: 'error', text: 'Allow pop-ups for this site, then try again.' });
      return;
    }
    popup.current = w;
    setStatus({ kind: 'waiting' });
    clearInterval(watch.current);
    watch.current = setInterval(() => {
      if (!popup.current?.closed) return;
      clearInterval(watch.current);
      popup.current = null;
      setStatus({ kind: 'idle' });
    }, 500);
  }

  return (
    <section>
      <h1>Prints</h1>
      <p>Order prints of your photos. Bring them in from CloudPix.</p>
      {status.kind !== 'connected' && (
        <button type="button" onClick={connect}>
          Connect CloudPix
        </button>
      )}
      <p role="status">
        {status.kind === 'waiting' && 'Waiting for CloudPix…'}
        {status.kind === 'error' && status.text}
        {status.kind === 'connected' && `Connected as ${status.account.account}.`}
      </p>
      {status.kind === 'connected' && (
        <ul aria-label="CloudPix photos">
          {status.account.photos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
