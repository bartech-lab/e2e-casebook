import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Summary = { id: string; name: string; town: string };
type Home = Summary & { sleeps: number; price: number; about: string };

export function HolidayHomes({ sandbox }: { sandbox: string }) {
  const [homes, setHomes] = useState<Summary[]>([]);
  const [open, setOpen] = useState<Home | null>(null);
  const [loading, setLoading] = useState('');
  const [failed, setFailed] = useState('');
  const details = useRef(new Map<string, Promise<Home>>());

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/holiday-homes`)
      .then((res) => json<{ homes: Summary[] }>(res))
      .then(({ homes }) => setHomes(homes));
  }, [sandbox]);

  function load(id: string) {
    let p = details.current.get(id);
    if (!p) {
      p = fetch(`/api/s/${sandbox}/holiday-homes/${id}`).then((res) => json<Home>(res));
      p.catch(() => details.current.delete(id));
      details.current.set(id, p);
    }
    return p;
  }

  async function show(home: Summary) {
    setFailed('');
    setLoading(home.name);
    void fetch(`/api/s/${sandbox}/holiday-homes/${home.id}/views`, { method: 'POST' });
    try {
      const h = await load(home.id);
      setOpen(h);
    } catch {
      setFailed(`Could not open ${home.name}.`);
    } finally {
      setLoading('');
    }
  }

  return (
    <section>
      <h1>Holiday homes</h1>
      <ul className="homes" aria-label="Homes">
        {homes.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className="home-card"
              onPointerEnter={() => void load(h.id).catch(() => {})}
              onFocus={() => void load(h.id).catch(() => {})}
              onClick={() => void show(h)}
            >
              <strong>{h.name}</strong>
              <span>{h.town}</span>
            </button>
          </li>
        ))}
      </ul>
      {loading && <p>Opening {loading}…</p>}
      {failed && <p role="alert">{failed}</p>}
      {open && (
        <section aria-label="Home details" className="home-details">
          <h2>{open.name}</h2>
          <p>
            {open.town}. Sleeps {open.sleeps}. {open.price} PLN a night.
          </p>
          <p>{open.about}</p>
        </section>
      )}
    </section>
  );
}
