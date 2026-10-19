import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';

type MailMessage = { id: number; to: string; subject: string; text: string; link: string; receivedAt: string };

export function Mail({ sandbox }: { sandbox: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const inbox = useQuery({
    queryKey: ['mail', sandbox],
    queryFn: async () => (await json<{ messages: MailMessage[] }>(await fetch(`/api/s/${sandbox}/mail`))).messages,
    refetchInterval: 2000,
  });
  const current = inbox.data?.find((m) => m.id === open);

  return (
    <section>
      <h1>Mail</h1>
      <p>A test inbox for this sandbox. Nothing here is really sent.</p>
      {inbox.isError && <p role="alert">Could not load mail: {inbox.error.message}</p>}
      {inbox.data?.length === 0 && <p>No messages.</p>}
      <ul aria-label="Inbox">
        {inbox.data?.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setOpen(m.id)}>
              {m.subject} — to {m.to}
            </button>{' '}
            <time dateTime={m.receivedAt}>{new Date(m.receivedAt).toLocaleTimeString()}</time>
          </li>
        ))}
      </ul>
      {current && (
        <article aria-label="Message">
          <h2>{current.subject}</h2>
          <p>To: {current.to}</p>
          <p>Use this link to sign in. It works once and expires in 10 minutes:</p>
          <p>
            <a href={current.link}>Sign in to e2e-proving-ground</a>
          </p>
        </article>
      )}
    </section>
  );
}
