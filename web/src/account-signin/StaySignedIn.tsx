import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sendJson } from '../http.ts';

export function StaySignedIn({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['account', sandbox];
  const base = `/api/s/${sandbox}/account`;
  const me = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(`${base}/me`);
      return res.ok ? ((await res.json()) as { email: string }) : null;
    },
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`${base}/login`, sendJson('POST', { email, password, remember }));
    if (!res.ok) return setError('Wrong email or password.');
    setError('');
    setPassword('');
    await client.invalidateQueries({ queryKey: key });
  }

  async function signOut() {
    await fetch(`${base}/logout`, { method: 'POST' });
    await client.invalidateQueries({ queryKey: key });
  }

  if (me.isPending) return <p>Loading…</p>;

  return (
    <section>
      <h1>Account</h1>
      {me.data ? (
        <>
          <p role="status">Signed in as {me.data.email}.</p>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </>
      ) : (
        <form onSubmit={signIn} aria-label="Sign in">
          <p className="field">
            <label htmlFor="account-email">Email</label>
            <input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </p>
          <p className="field">
            <label htmlFor="account-password">Password</label>
            <input id="account-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </p>
          <p>
            <label>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me for 30 days
            </label>
          </p>
          <p>
            <button type="submit">Sign in</button> {error && <span role="alert">{error}</span>}
          </p>
        </form>
      )}
    </section>
  );
}
