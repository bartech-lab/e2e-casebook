import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json, sendJson } from '../http.ts';
import { Link } from '../router.tsx';

type Ticket = { id: number; text: string };

const draftKey = (sandbox: string) => `support-draft:${sandbox}`;

export function Support({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const api = `/api/s/${sandbox}`;
  const me = useQuery({ queryKey: ['me', sandbox], queryFn: async () => (await fetch(`${api}/auth/me`)).ok });
  const tickets = useQuery({ queryKey: ['support', sandbox], enabled: me.data === true, queryFn: async () => json<{ tickets: Ticket[] }>(await fetch(`${api}/support`)) });
  const [text, setText] = useState(() => localStorage.getItem(draftKey(sandbox)) ?? '');
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);

  function edit(value: string) {
    setText(value);
    localStorage.setItem(draftKey(sandbox), value);
  }

  async function send() {
    setMessage('');
    try {
      await json<Ticket>(await fetch(`${api}/support`, sendJson('POST', { text })));
      edit('');
      localStorage.removeItem(draftKey(sandbox));
      setMessage('Sent. We will answer by email.');
      await client.invalidateQueries({ queryKey: ['support', sandbox] });
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setExpired(true);
        setMessage('Your session has expired. Sign in again; your message is kept.');
      } else {
        setMessage('Something went wrong. Your message is kept.');
      }
    }
  }

  if (me.data === false && !expired) {
    return (
      <section>
        <h1>Support</h1>
        <p>
          <Link href={`/s/${sandbox}/account`}>Sign in</Link> to write to support.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Support</h1>
      <label>
        Message
        <textarea rows={6} cols={60} maxLength={2000} value={text} onChange={(e) => edit(e.target.value)} />
      </label>
      <p>
        <button type="button" disabled={!text.trim()} onClick={() => void send()}>
          Send
        </button>
      </p>
      <p role="status">{message}</p>
      {expired && (
        <p>
          <Link href={`/s/${sandbox}/account`}>Sign in again</Link>
        </p>
      )}
      <h2>Your messages</h2>
      <ul aria-label="Your messages">
        {tickets.data?.tickets.map((t) => (
          <li key={t.id}>{t.text}</li>
        ))}
      </ul>
    </section>
  );
}
