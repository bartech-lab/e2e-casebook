import { useEffect, useRef, useState } from 'react';

type Tokens = { access: string; refresh: string };
const PANELS = [
  { id: 'rota', title: 'Rota' },
  { id: 'holidays', title: 'Holidays' },
  { id: 'announcements', title: 'Announcements' },
];
class SessionEnded extends Error {}

export function TeamOverview({ sandbox }: { sandbox: string }) {
  const api = `/api/s/${sandbox}`;
  const tokens = useRef<Tokens | null>(null);
  const renewing = useRef<Promise<void> | null>(null);
  const [items, setItems] = useState<Record<string, string[] | 'failed'>>({});
  const [ended, setEnded] = useState(false);

  async function renew() {
    const res = await fetch(`${api}/team-auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.current?.refresh }),
    });
    if (!res.ok) throw new SessionEnded();
    tokens.current = (await res.json()) as Tokens;
  }

  async function get(path: string) {
    const call = () => fetch(`${api}${path}`, { headers: { authorization: `Bearer ${tokens.current?.access}` } });
    let res = await call();
    if (res.status === 401) {
      renewing.current ??= renew().finally(() => (renewing.current = null));
      await renewing.current;
      res = await call();
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ items: string[] }>;
  }

  async function loadAll() {
    setItems({});
    await Promise.all(
      PANELS.map(async (p) => {
        try {
          const { items: list } = await get(`/team-panels/${p.id}`);
          setItems((cur) => ({ ...cur, [p.id]: list }));
        } catch (error) {
          if (error instanceof SessionEnded) setEnded(true);
          setItems((cur) => ({ ...cur, [p.id]: 'failed' }));
        }
      }),
    );
  }

  useEffect(() => {
    void (async () => {
      tokens.current = (await (await fetch(`${api}/team-auth/sign-in`, { method: 'POST' })).json()) as Tokens;
      await loadAll();
    })();
  }, [sandbox]);

  return (
    <section>
      <h1>Team overview</h1>
      {ended && <p role="alert">Your session has ended. Sign in again.</p>}
      <button type="button" onClick={() => void loadAll()}>
        Refresh panels
      </button>
      <div className="team-panels">
        {PANELS.map((p) => {
          const list = items[p.id];
          return (
            <section key={p.id} aria-label={p.title} className="team-panel">
              <h2>{p.title}</h2>
              {list === undefined ? (
                <p>Loading…</p>
              ) : list === 'failed' ? (
                <p>Could not load.</p>
              ) : (
                <ul>
                  {list.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
