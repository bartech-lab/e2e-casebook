import { useEffect, useState } from 'react';

type Search = { id: number; name: string };

export function SavedSearches({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/saved-searches`;
  const [searches, setSearches] = useState<Search[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void fetch(url)
      .then((r) => r.json() as Promise<{ searches: Search[] }>)
      .then((b) => live && setSearches(b.searches));
    return () => {
      live = false;
    };
  }, [url]);

  async function create(name?: string) {
    setBusy(true);
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(name ? { name } : {}) });
    const search = (await res.json()) as Search;
    setSearches((cur) => [...(cur ?? []), search]);
    setBusy(false);
  }

  return (
    <section>
      <h1>Saved searches</h1>
      {searches === null ? (
        <p role="status">Loading saved searches…</p>
      ) : searches.length === 0 ? (
        <div className="empty-state">
          <p>You have no saved searches.</p>
          <button type="button" disabled={busy} onClick={() => void create('My first search')}>
            Create your first search
          </button>
        </div>
      ) : (
        <>
          <button type="button" disabled={busy} onClick={() => void create()}>
            New search
          </button>
          <ul aria-label="Saved searches">
            {searches.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
