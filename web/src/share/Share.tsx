import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json } from '../http.ts';

export function Share({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['invite', sandbox];
  const url = `/api/s/${sandbox}/invite`;
  const invite = useQuery({ queryKey: key, queryFn: async () => json<{ path: string }>(await fetch(url)) });
  const field = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const link = invite.data ? new URL(invite.data.path, location.origin).href : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied.');
    } catch {
      field.current?.select();
      setStatus('Could not copy. The link is selected: press Ctrl+C to copy it.');
    }
  }

  async function renew() {
    const next = await json<{ path: string }>(await fetch(url, { method: 'POST' }));
    client.setQueryData(key, next);
    setStatus('New link made. The old link no longer works.');
  }

  return (
    <section>
      <h1>Share</h1>
      <p className="field">
        <label htmlFor="invite-link">Invite link</label>
        <input id="invite-link" ref={field} readOnly value={link} size={60} />
      </p>
      <p>
        <button type="button" onClick={copy} disabled={!link}>
          Copy link
        </button>{' '}
        <button type="button" onClick={renew}>
          New link
        </button>
      </p>
      <p role="status">{status}</p>
    </section>
  );
}
