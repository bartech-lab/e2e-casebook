import { useEffect, useState } from 'react';
import { json } from '../http.ts';

type Shown = { q: string; results: string[] };

export function Search({ sandbox }: { sandbox: string }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [shown, setShown] = useState<Shown>({ q: '', results: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setShown({ q: '', results: [] });
      return;
    }
    let current = true;
    const controller = new AbortController();
    fetch(`/api/s/${sandbox}/search?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then((res) => json<{ results: string[] }>(res))
      .then(({ results }) => {
        if (!current) return;
        setShown({ q: debounced, results });
        setError('');
      })
      .catch(() => {
        if (current) setError('Search failed. Try again.');
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [debounced, sandbox]);

  const busy = debounced !== shown.q;

  return (
    <section>
      <h1>Search</h1>
      <p>
        <label>
          Search products{' '}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </p>
      <p role="status">
        {error || (shown.q ? (shown.results.length ? `${shown.results.length} ${shown.results.length === 1 ? 'result' : 'results'} for “${shown.q}”` : `No results for “${shown.q}”`) : '')}
      </p>
      <ul aria-label="Results" aria-busy={busy}>
        {shown.results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}
