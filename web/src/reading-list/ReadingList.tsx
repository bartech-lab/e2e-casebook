import { useEffect, useState, type FormEvent } from 'react';

type Session = { token: string; email: string };
const BOOKS = ['Solaris, Stanisław Lem', 'Flights, Olga Tokarczuk', 'The Doll, Bolesław Prus'];

function openDb(name: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('session');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb<T>(name: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb(name);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('session', mode);
      const req = run(tx.objectStore('session'));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function ReadingList({ sandbox }: { sandbox: string }) {
  const api = `/api/s/${sandbox}/reader`;
  const dbName = `reader-${sandbox}`;
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const saved = await idb<Session | undefined>(dbName, 'readonly', (s) => s.get('current'));
      if (!saved) return setState('out');
      const res = await fetch(`${api}/me`, { headers: { authorization: `Bearer ${saved.token}` } });
      if (res.ok) {
        setSession(saved);
        setState('in');
        return;
      }
      await idb(dbName, 'readwrite', (s) => s.delete('current'));
      setNotice('Your session has ended. Sign in again.');
      setState('out');
    })();
  }, [api, dbName]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    if (!res.ok) return setError('Wrong email or password.');
    const next = (await res.json()) as Session;
    await idb(dbName, 'readwrite', (s) => s.put(next, 'current'));
    setSession(next);
    setError('');
    setNotice('');
    setState('in');
  }

  async function signOut() {
    if (!session) return;
    await fetch(`${api}/logout`, { method: 'POST', headers: { authorization: `Bearer ${session.token}` } });
    await idb(dbName, 'readwrite', (s) => s.delete('current'));
    setSession(null);
    setState('out');
  }

  return (
    <section>
      <h1>Reading list</h1>
      {state === 'checking' && <p>Checking your session…</p>}
      {state === 'out' && (
        <form onSubmit={(e) => void signIn(e)} className="reader-form" aria-label="Sign in">
          {notice && <p role="status">{notice}</p>}
          <label>
            Email <input name="email" type="email" autoComplete="username" />
          </label>
          <label>
            Password <input name="password" type="password" autoComplete="current-password" />
          </label>
          <p role="alert">{error}</p>
          <button type="submit">Sign in</button>
        </form>
      )}
      {state === 'in' && session && (
        <>
          <p>Signed in as {session.email}.</p>
          <ul aria-label="Your books">
            {BOOKS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </>
      )}
    </section>
  );
}
