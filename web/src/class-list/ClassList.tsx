import { useMemo, useState } from 'react';

type Pupil = { surname: string; first: string; group: string };
type Key = 'surname' | 'group';

const PUPILS: Pupil[] = [
  { surname: 'Nowak', first: 'Anna', group: 'Group 2' },
  { surname: 'Łabęda', first: 'Piotr', group: 'Group 10' },
  { surname: 'Lewandowska', first: 'Ewa', group: 'Group 1' },
  { surname: 'Śliwa', first: 'Marek', group: 'Group 2' },
  { surname: 'Szulc', first: 'Ola', group: 'Group 10' },
  { surname: 'Żak', first: 'Łukasz', group: 'Group 1' },
  { surname: 'Zając', first: 'Jan', group: 'Group 2' },
  { surname: 'Ćwik', first: 'Adam', group: 'Group 3' },
  { surname: 'Cebula', first: 'Zofia', group: 'Group 3' },
  { surname: 'Nowak', first: 'Adam', group: 'Group 1' },
  { surname: 'Ostrowski', first: 'Tomasz', group: 'Group 10' },
  { surname: 'Ożóg', first: 'Ewa', group: 'Group 2' },
  { surname: 'Źródło', first: 'Kasia', group: 'Group 3' },
  { surname: 'Kowalska', first: 'Maja', group: 'Group 2' },
  { surname: 'Łuczak', first: 'Iga', group: 'Group 1' },
];

const collator = new Intl.Collator('pl', { numeric: true });
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase();

function byName(a: Pupil, b: Pupil) {
  return collator.compare(a.surname, b.surname) || collator.compare(a.first, b.first);
}

export function ClassList() {
  const [key, setKey] = useState<Key>('surname');
  const [down, setDown] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = fold(query.trim());
    const found = PUPILS.filter((p) => !q || fold(`${p.first} ${p.surname}`).includes(q) || fold(`${p.surname} ${p.first}`).includes(q));
    const sign = down ? -1 : 1;
    return [...found].sort((a, b) => sign * (key === 'group' ? collator.compare(a.group, b.group) : 0) || sign * byName(a, b));
  }, [key, down, query]);

  function sortBy(next: Key) {
    if (next === key) setDown((d) => !d);
    else {
      setKey(next);
      setDown(false);
    }
  }

  const ariaSort = (k: Key) => (k === key ? (down ? 'descending' : 'ascending') : 'none');

  return (
    <section>
      <h1>Class list</h1>
      <label>
        Find a pupil <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <table className="class-list">
        <caption>Pupils, {rows.length}</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('surname')}>
              <button type="button" onClick={() => sortBy('surname')}>
                Surname
              </button>
            </th>
            <th scope="col">First name</th>
            <th scope="col" aria-sort={ariaSort('group')}>
              <button type="button" onClick={() => sortBy('group')}>
                Group
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={`${p.surname} ${p.first}`}>
              <td>{p.surname}</td>
              <td>{p.first}</td>
              <td>{p.group}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p>No pupils match.</p>}
    </section>
  );
}
