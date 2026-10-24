import { useEffect, useRef, useState, type FormEvent } from 'react';

type Claim = { id: number; amount: number; description: string; status: string };
type Draft = { amount: string; description: string };
type Session = { token: string; email: string };
const EMAIL_HINT = 'ewa@example.com';

class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ExpenseClaims({ sandbox }: { sandbox: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [reauth, setReauth] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [draft, setDraft] = useState<Draft>({ amount: '', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef<Draft | null>(null);
  const lastEmail = useRef('');

  async function api<T>(path: string, init: RequestInit = {}, token: string | null = session?.token ?? null): Promise<T> {
    const headers: Record<string, string> = init.body ? { 'content-type': 'application/json' } : {};
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`/api/s/${sandbox}${path}`, { ...init, headers });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (res.status === 401 && token) {
      setReauth(true);
      throw new ApiError(401, 'Your session has ended. Sign in again to continue.');
    }
    if (!res.ok) throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
    return body;
  }

  useEffect(() => {
    if (!session) return;
    void api<{ claims: Claim[] }>('/claims').then(
      (r) => setClaims(r.claims),
      () => {},
    );
  }, [session]);

  async function signIn(email: string, password: string) {
    const s = await api<Session>('/claims/login', { method: 'POST', body: JSON.stringify({ email, password }) }, null);
    lastEmail.current = s.email;
    setSession(s);
    setReauth(false);
    setError('');
    const queued = pending.current;
    pending.current = null;
    if (queued) await submit(queued, s.token);
  }

  async function submit(d: Draft, token: string | null = session?.token ?? null) {
    setMessage('');
    setError('');
    try {
      const claim = await api<Claim>('/claims', { method: 'POST', body: JSON.stringify({ amount: Number(d.amount.replace(',', '.')), description: d.description }) }, token);
      setDraft((cur) => (cur.amount === d.amount && cur.description === d.description ? { amount: '', description: '' } : cur));
      setClaims((await api<{ claims: Claim[] }>('/claims', {}, token)).claims);
      setMessage(`Claim ${claim.id} submitted.`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) pending.current = d;
      else setError((e as Error).message);
    }
  }

  async function approve(id: number) {
    setMessage('');
    setError('');
    try {
      await api(`/claims/${id}/approve`, { method: 'POST' });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setError((e as Error).message);
    }
  }

  async function signOut() {
    const token = session?.token;
    setSession(null);
    setClaims([]);
    setMessage('');
    setError('');
    if (token) await fetch(`/api/s/${sandbox}/claims/logout`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  }

  if (!session)
    return (
      <section>
        <h1>Expense claims</h1>
        <SignInForm initialEmail={lastEmail.current} onSignIn={signIn} />
      </section>
    );

  return (
    <section>
      <h1>Expense claims</h1>
      <p>
        Signed in as {session.email}.{' '}
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(draft);
        }}
        aria-label="New claim"
      >
        <label>
          Amount (PLN) <input inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        </label>{' '}
        <label>
          Description <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>{' '}
        <button type="submit">Submit claim</button>
      </form>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <table aria-label="Your claims">
        <thead>
          <tr>
            <th>Claim</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.description}</td>
              <td>{c.amount.toFixed(2)} PLN</td>
              <td>{c.status}</td>
              <td>
                <button type="button" onClick={() => void approve(c.id)}>
                  Approve claim {c.id}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reauth && (
        <div role="dialog" aria-modal="true" aria-labelledby="claims-reauth-title" className="claims-reauth">
          <h2 id="claims-reauth-title">Sign in again</h2>
          <p>Your session has ended. Sign in again to continue.</p>
          <SignInForm initialEmail={session.email} onSignIn={signIn} />
        </div>
      )}
    </section>
  );
}

function SignInForm({ initialEmail, onSignIn }: { initialEmail: string; onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordBox = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
      passwordBox.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} aria-label="Sign in">
      <label>
        Email <input type="email" autoComplete="username" placeholder={EMAIL_HINT} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>{' '}
      <label>
        Password <input ref={passwordBox} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>{' '}
      <button type="submit" disabled={busy}>
        Sign in
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
