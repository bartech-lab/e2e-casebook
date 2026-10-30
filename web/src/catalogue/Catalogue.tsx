import { useEffect, useState, type FormEvent } from 'react';
import { json } from '../http.ts';

type Book = { title: string; year: number; available: boolean };
type Search = { q: string; available: boolean; sort: string };
const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'title', label: 'Title' },
  { value: 'newest', label: 'Newest' },
];

function fromAddress(): Search {
  const p = new URLSearchParams(location.search);
  const sort = p.get('sort') ?? 'relevance';
  return { q: p.get('q') ?? '', available: p.get('available') === '1', sort: SORTS.some((s) => s.value === sort) ? sort : 'relevance' };
}

function toQuery(s: Search) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.available) p.set('available', '1');
  if (s.sort !== 'relevance') p.set('sort', s.sort);
  const text = p.toString();
  return text ? `?${text}` : '';
}

export function Catalogue({ sandbox }: { sandbox: string }) {
  const [form, setForm] = useState<Search>(fromAddress);
  const [shown, setShown] = useState<Search>(fromAddress);
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    const onPop = () => {
      const s = fromAddress();
      setForm(s);
      setShown(s);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let live = true;
    setBooks(null);
    void fetch(`/api/s/${sandbox}/catalogue${toQuery(shown)}`)
      .then((res) => json<{ books: Book[] }>(res))
      .then(({ books }) => live && setBooks(books));
    return () => {
      live = false;
    };
  }, [sandbox, shown]);

  function search(e: FormEvent) {
    e.preventDefault();
    const next = { ...form, q: form.q.trim() };
    if (toQuery(next) !== location.search) history.pushState(null, '', `${location.pathname}${toQuery(next)}`);
    setShown(next);
  }

  return (
    <section>
      <h1>Library catalogue</h1>
      <form onSubmit={search} className="catalogue-form">
        <label>
          Title <input type="search" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} />
        </label>
        <label>
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available now
        </label>
        <label>
          Sort by{' '}
          <select value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Search</button>
      </form>
      {books === null ? (
        <p>Searching…</p>
      ) : books.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <ul aria-label="Books">
          {books.map((b) => (
            <li key={b.title}>
              {b.title} ({b.year}){b.available ? '' : ', on loan'}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
