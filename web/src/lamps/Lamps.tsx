import { useState } from 'react';

const LAMPS = [
  ['Arc floor lamp', '649 PLN'],
  ['Brass desk lamp', '219 PLN'],
  ['Paper pendant', '149 PLN'],
  ['Clip-on reading light', '79 PLN'],
  ['Mushroom table lamp', '329 PLN'],
  ['Wall sconce', '189 PLN'],
].map(([name, price]) => ({ name: name!, price: price! }));

export function Lamps() {
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const toggle = (list: string[], name: string) => (list.includes(name) ? list.filter((n) => n !== name) : [...list, name]);

  return (
    <section>
      <h1>Lamps</h1>
      <ul className="lamp-grid" aria-label="Lamps">
        {LAMPS.map((l) => (
          <li key={l.name} className="lamp-card">
            <div className="lamp-photo" aria-hidden="true" />
            <strong>{l.name}</strong>
            <span>{l.price}</span>
            <div className="lamp-actions">
              <button type="button" aria-pressed={saved.includes(l.name)} aria-label={`Save ${l.name}`} onClick={() => setSaved(toggle(saved, l.name))}>
                ♡
              </button>
              <button
                type="button"
                aria-pressed={compare.includes(l.name)}
                aria-label={`Compare ${l.name}`}
                onClick={() => setCompare(toggle(compare, l.name))}
              >
                ⇄
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p role="status">
        Saved: {saved.length}. Comparing: {compare.length}.
      </p>
    </section>
  );
}
