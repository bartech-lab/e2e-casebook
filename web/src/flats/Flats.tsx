import { useEffect, useState, type MouseEvent } from 'react';
import { Link, navigate } from '../router.tsx';

type Flat = { id: string; title: string; district: string; rooms: number; rent: number };
const FLATS: Flat[] = [
  { id: 'kazimierz-2', title: 'Bright two rooms by the river', district: 'Kazimierz', rooms: 2, rent: 3400 },
  { id: 'podgorze-3', title: 'Family flat with a balcony', district: 'Podgórze', rooms: 3, rent: 4100 },
  { id: 'krowodrza-1', title: 'Studio near the park', district: 'Krowodrza', rooms: 1, rent: 2300 },
  { id: 'nowa-huta-2', title: 'Quiet flat with a garden view', district: 'Nowa Huta', rooms: 2, rent: 2700 },
];

const read = (key: string): string[] => {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export function Flats({ sandbox }: { sandbox: string }) {
  const base = `/s/${sandbox}/flats`;
  const href = (id: string) => `${base}?flat=${id}`;
  const compareKey = `flats-compare-${sandbox}`;
  const savedKey = `flats-saved-${sandbox}`;
  const [compare, setCompare] = useState<string[]>(() => read(compareKey));
  const [saved, setSaved] = useState<string[]>(() => read(savedKey));
  const [search, setSearch] = useState(location.search);
  const selected = new URLSearchParams(search).get('flat');
  const flat = FLATS.find((f) => f.id === selected);

  useEffect(() => {
    const onPop = () => setSearch(location.search);
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const toggle = (list: string[], id: string, key: string, set: (v: string[]) => void) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    sessionStorage.setItem(key, JSON.stringify(next));
    set(next);
  };

  function open(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href(id));
  }

  if (flat)
    return (
      <section>
        <h1>{flat.title}</h1>
        <p>
          {flat.district} · {flat.rooms} {flat.rooms === 1 ? 'room' : 'rooms'} · {flat.rent} PLN a month
        </p>
        <Link href={base}>Back to flats</Link>
      </section>
    );

  return (
    <section>
      <h1>Flats to rent</h1>
      <p role="status">{compare.length === 0 ? 'Tick Compare on two or more flats to compare them.' : `Comparing ${compare.length} of ${FLATS.length} flats.`}</p>
      <ul className="flat-list" aria-label="Flats">
        {FLATS.map((f) => (
          <li key={f.id}>
            <article className="flat-card" aria-labelledby={`flat-${f.id}`}>
              <h2 id={`flat-${f.id}`}>
                <a className="flat-link" href={href(f.id)} onClick={(e) => open(e, f.id)}>
                  {f.title}
                </a>
              </h2>
              <p>
                {f.district} · {f.rooms} {f.rooms === 1 ? 'room' : 'rooms'} · {f.rent} PLN a month
              </p>
              <div className="flat-actions">
                <button type="button" aria-pressed={saved.includes(f.id)} aria-label={`Save ${f.title}`} onClick={() => toggle(saved, f.id, savedKey, setSaved)}>
                  {saved.includes(f.id) ? 'Saved' : 'Save'}
                </button>{' '}
                <label>
                  <input type="checkbox" checked={compare.includes(f.id)} onChange={() => toggle(compare, f.id, compareKey, setCompare)} /> Compare
                </label>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
