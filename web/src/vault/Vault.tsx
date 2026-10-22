import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json, sendJson } from '../http.ts';

export function Vault({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['vault', sandbox];
  const url = `/api/s/${sandbox}/vault`;
  const state = useQuery({ queryKey: key, queryFn: async () => json<{ enabled: boolean }>(await fetch(url)) });
  const [secret, setSecret] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[] | null>(null);
  const [message, setMessage] = useState('');

  async function setup() {
    setMessage('');
    setSecret((await json<{ secret: string }>(await fetch(`${url}/setup`, { method: 'POST' }))).secret);
  }

  async function submit(e: FormEvent<HTMLFormElement>, action: 'enable' | 'unlock') {
    e.preventDefault();
    const form = e.currentTarget;
    const code = String(new FormData(form).get('code') ?? '');
    try {
      const result = await json<{ notes?: string[] }>(await fetch(`${url}/${action}`, sendJson('POST', { code })));
      form.reset();
      if (action === 'enable') {
        setSecret(null);
        setMessage('Two-step verification is on.');
        await client.invalidateQueries({ queryKey: key });
      } else {
        setMessage('');
        setNotes(result.notes ?? []);
      }
    } catch (error) {
      setMessage(error instanceof HttpError ? error.message : 'Something went wrong.');
    }
  }

  const codeField = (
    <label>
      6-digit code <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
    </label>
  );

  return (
    <section>
      <h1>Vault</h1>
      {state.data && !state.data.enabled && !secret && (
        <button type="button" onClick={() => void setup()}>
          Turn on two-step verification
        </button>
      )}
      {secret && (
        <form onSubmit={(e) => void submit(e, 'enable')}>
          <p>
            Add this key to your authenticator app: <code aria-label="Secret key">{secret}</code>
          </p>
          {codeField} <button type="submit">Confirm</button>
        </form>
      )}
      {state.data?.enabled && !notes && (
        <form onSubmit={(e) => void submit(e, 'unlock')}>
          <p>Enter the code from your authenticator app to unlock the vault.</p>
          {codeField} <button type="submit">Unlock</button>
        </form>
      )}
      <p role="status">{message}</p>
      {notes && (
        <ul aria-label="Vault notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
