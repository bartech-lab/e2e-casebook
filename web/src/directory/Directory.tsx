import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

const ROW = 32;
const VIEW = 320;
const OVERSCAN = 5;
const FIRST = ['Anna', 'Piotr', 'Maria', 'Jan', 'Ewa', 'Tomasz', 'Zofia', 'Adam', 'Ola', 'Marek', 'Ida', 'Kuba', 'Lena'];
const LAST = ['Nowak', 'Kowalski', 'Wiśniewska', 'Lewandowski', 'Zając', 'Wójcik', 'Kamińska', 'Dąbrowski', 'Mazur', 'Krawczyk', 'Piotrowska'];
const CITIES = ['Warsaw', 'Kraków', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź', 'Lublin'];
const ALL = Array.from({ length: 10_000 }, (_, i) => ({
  id: `C-${String(i + 1).padStart(5, '0')}`,
  name: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`,
  city: CITIES[(i * 3) % CITIES.length]!,
}));

export function Directory() {
  const [query, setQuery] = useState('');
  const [scroll, setScroll] = useState(0);
  const [focus, setFocus] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<number, HTMLLIElement>());
  const pendingFocus = useRef(false);
  const saved = useRef(0);

  const rows = useMemo(() => ALL.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const start = Math.max(0, Math.floor(scroll / ROW) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scroll + VIEW) / ROW) + OVERSCAN);

  useEffect(() => {
    if (!pendingFocus.current) return;
    const row = rowRefs.current.get(focus);
    if (!row) return;
    pendingFocus.current = false;
    row.focus({ preventScroll: true });
  }, [focus, start, end, open]);

  useLayoutEffect(() => {
    if (open !== null || !box.current) return;
    box.current.scrollTop = saved.current;
    setScroll(saved.current);
  }, [open]);

  function moveTo(i: number) {
    const next = Math.min(rows.length - 1, Math.max(0, i));
    const el = box.current!;
    if (next * ROW < el.scrollTop) el.scrollTop = next * ROW;
    else if ((next + 1) * ROW > el.scrollTop + VIEW) el.scrollTop = (next + 1) * ROW - VIEW;
    setScroll(el.scrollTop);
    pendingFocus.current = true;
    setFocus(next);
  }

  function onKey(e: KeyboardEvent, i: number) {
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, PageDown: i + 10, PageUp: i - 10, Home: 0, End: rows.length - 1 }[e.key];
    if (next !== undefined) {
      e.preventDefault();
      moveTo(next);
    } else if (e.key === 'Enter') openRow(i);
  }

  function openRow(i: number) {
    saved.current = box.current!.scrollTop;
    pendingFocus.current = true;
    setFocus(i);
    setOpen(i);
  }

  if (open !== null) {
    const c = rows[open]!;
    return (
      <section>
        <h1>Directory</h1>
        <h2>{c.name}</h2>
        <p>
          Customer {c.id}, {c.city}
        </p>
        <button type="button" onClick={() => setOpen(null)}>
          Back to the list
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Directory</h1>
      <label>
        Filter by name{' '}
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocus(0);
            setScroll(0);
            saved.current = 0;
            if (box.current) box.current.scrollTop = 0;
          }}
        />
      </label>
      <p role="status">
        Showing {rows.length.toLocaleString('en-GB')} of {ALL.length.toLocaleString('en-GB')}
      </p>
      <div ref={box} className="vlist" style={{ height: VIEW }} onScroll={(e) => setScroll(e.currentTarget.scrollTop)}>
        <ul aria-label="Customers" style={{ height: rows.length * ROW }}>
          {rows.slice(start, end).map((c, k) => {
            const i = start + k;
            return (
              <li
                key={c.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(i, el);
                  else rowRefs.current.delete(i);
                }}
                style={{ top: i * ROW, height: ROW }}
                tabIndex={i === focus ? 0 : -1}
                aria-setsize={rows.length}
                aria-posinset={i + 1}
                onKeyDown={(e) => onKey(e, i)}
                onClick={() => openRow(i)}
              >
                <span>{c.name}</span> <small>{c.id}</small>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
