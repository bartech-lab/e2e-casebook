import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Colombia', "Côte d'Ivoire", 'Czechia',
  'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Iceland', 'Japan', 'Kenya', 'Mexico',
  'Norway', 'Oman', 'Pakistan', 'Panama', 'Peru', 'Poland', 'Portugal', 'Spain', 'Sweden', 'Zimbabwe',
];
const TYPEAHEAD_MS = 500;
const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function Country() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const typed = useRef({ text: '', at: 0 });
  const options = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    options.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function typeahead(key: string) {
    const now = Date.now();
    const text = now - typed.current.at < TYPEAHEAD_MS ? typed.current.text + key : key;
    typed.current = { text, at: now };
    const q = fold(text);
    const same = [...q].every((ch) => ch === q[0]);
    const needle = same ? q[0]! : q;
    const from = same ? active + 1 : active;
    for (let i = 0; i < COUNTRIES.length; i++) {
      const idx = (from + i) % COUNTRIES.length;
      if (fold(COUNTRIES[idx]!).startsWith(needle)) return setActive(idx);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const last = COUNTRIES.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]!);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(active);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      typeahead(e.key);
    }
  }

  return (
    <section>
      <h1>Country</h1>
      <p id="country-label">Where do you live? Type the first letters of a country to jump to it.</p>
      <ul role="listbox" tabIndex={0} aria-labelledby="country-label" aria-activedescendant={`country-${active}`} className="countries" onKeyDown={onKeyDown}>
        {COUNTRIES.map((name, i) => (
          <li
            key={name}
            id={`country-${i}`}
            ref={(el) => {
              options.current[i] = el;
            }}
            role="option"
            aria-selected={selected === i}
            className={i === active ? 'active' : undefined}
            onClick={() => {
              setActive(i);
              setSelected(i);
            }}
          >
            {name}
          </li>
        ))}
      </ul>
      <p role="status">{selected === null ? 'No country selected.' : `Selected: ${COUNTRIES[selected]}`}</p>
    </section>
  );
}
