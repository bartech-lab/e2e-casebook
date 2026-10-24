import { useEffect, useState, type FormEvent } from 'react';
import { json, sendJson } from '../http.ts';
import { Link } from '../router.tsx';

const PAGES: Record<string, { title: string; text: string }> = {
  '': { title: 'Members area', text: 'Welcome back to the rowing club.' },
  minutes: { title: 'Meeting minutes', text: 'Minutes of the October meeting: the boathouse roof is fixed.' },
  accounts: { title: 'Club accounts', text: 'Balance on 1 October: 12,400 PLN.' },
};

export function safeNext(next: string | null, sandbox: string) {
  const home = `/s/${sandbox}/members`;
  if (!next) return home;
  try {
    const url = new URL(next, location.origin);
    if (url.origin !== location.origin) return home;
    if (url.pathname !== home && !url.pathname.startsWith(`${home}/`)) return home;
    return url.pathname + url.search + url.hash;
  } catch {
    return home;
  }
}

export function Members({ sandbox, sub }: { sandbox: string; sub: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const base = `/s/${sandbox}/members`;

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/members/me`)
      .then((res) => json<{ signedIn: boolean }>(res))
      .then(({ signedIn }) => setSignedIn(signedIn));
  }, [sandbox, sub]);

  useEffect(() => {
    if (signedIn === null) return;
    if (sub === 'sign-in' && signedIn) location.replace(safeNext(new URLSearchParams(location.search).get('next'), sandbox));
    if (sub !== 'sign-in' && !signedIn) location.replace(`${base}/sign-in?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`);
  }, [signedIn, sub]);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/s/${sandbox}/members/sign-in`, sendJson('POST', { password }));
    if (!res.ok) return setError('Wrong password.');
    location.replace(safeNext(new URLSearchParams(location.search).get('next'), sandbox));
  }

  async function signOut() {
    await fetch(`/api/s/${sandbox}/members/sign-out`, { method: 'POST' });
    location.assign(`${base}/sign-in`);
  }

  if (signedIn === null) return <p>Loading…</p>;
  if (sub === 'sign-in') {
    if (signedIn) return <p>Loading…</p>;
    return (
      <section>
        <h1>Members sign-in</h1>
        <form onSubmit={(e) => void signIn(e)}>
          <label>
            Club password <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>{' '}
          <button type="submit">Sign in</button>
        </form>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  }
  const page = PAGES[sub];
  if (!signedIn || !page) return <p>{signedIn ? 'No such page.' : 'Loading…'}</p>;
  return (
    <section>
      <h1>{page.title}</h1>
      <p>{page.text}</p>
      <nav aria-label="Members pages">
        <Link href={base}>Members area</Link> · <Link href={`${base}/minutes`}>Meeting minutes</Link> · <Link href={`${base}/accounts`}>Club accounts</Link>
      </nav>
      <p>
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </p>
    </section>
  );
}
