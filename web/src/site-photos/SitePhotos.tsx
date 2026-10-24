import { useState, type FormEvent } from 'react';

type Item = { name: string; folder: boolean; size: number; modified: string };
type Key = 'name' | 'size' | 'modified';
type Sort = { key: Key; dir: 'ascending' | 'descending' };

const ITEMS: Item[] = [
  { name: 'Plans', folder: true, size: 0, modified: '2026-09-14' },
  { name: 'archive', folder: true, size: 0, modified: '2026-03-02' },
  { name: 'Photos 10', folder: true, size: 0, modified: '2026-10-02' },
  { name: 'Photos 2', folder: true, size: 0, modified: '2026-10-01' },
  { name: 'Room 1.jpg', folder: false, size: 950_000, modified: '2026-10-20' },
  { name: 'Room 2.jpg', folder: false, size: 2_000_000, modified: '2026-11-05' },
  { name: 'room 3.jpg', folder: false, size: 1_200_000, modified: '2026-10-03' },
  { name: 'Room 9.jpg', folder: false, size: 3_400_000, modified: '2026-09-28' },
  { name: 'Room 10.jpg', folder: false, size: 640_000, modified: '2026-11-12' },
  { name: 'Room 12.jpg', folder: false, size: 2_000_000, modified: '2026-10-20' },
  { name: 'Hall.jpg', folder: false, size: 2_000_000, modified: '2026-08-30' },
  { name: 'Ático.jpg', folder: false, size: 410_000, modified: '2026-07-15' },
  { name: 'garden.jpg', folder: false, size: 1_800_000, modified: '2026-10-11' },
  { name: 'IMG_7.jpg', folder: false, size: 5_100_000, modified: '2026-06-01' },
  { name: 'IMG_42.jpg', folder: false, size: 4_700_000, modified: '2026-06-02' },
];

const names = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const byName = (a: Item, b: Item) => names.compare(a.name, b.name);

const formatSize = (bytes: number) => (bytes < 1_000_000 ? `${Math.round(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`);
const formatDate = (iso: string) => iso.split('-').reverse().join('.');

function compare(a: Item, b: Item, key: Key) {
  if (key === 'size') return a.size - b.size;
  if (key === 'modified') return a.modified < b.modified ? -1 : a.modified > b.modified ? 1 : 0;
  return byName(a, b);
}

function sortItems(items: Item[], { key, dir }: Sort) {
  const sign = dir === 'ascending' ? 1 : -1;
  return [...items].sort((a, b) => {
    if (a.folder !== b.folder) return a.folder ? -1 : 1;
    if (a.folder && key === 'size') return byName(a, b);
    return sign * compare(a, b, key) || byName(a, b);
  });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const COLUMNS: { key: Key; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size' },
  { key: 'modified', label: 'Modified' },
];

export function SitePhotos() {
  const [sort, setSort] = useState<Sort>({ key: 'name', dir: 'ascending' });
  const [items, setItems] = useState(() => sortItems(ITEMS, sort));
  const [folder, setFolder] = useState('');
  const [error, setError] = useState('');

  function sortBy(key: Key) {
    const next: Sort = { key, dir: sort.key === key && sort.dir === 'ascending' ? 'descending' : 'ascending' };
    setSort(next);
    setItems(sortItems(items, next));
  }

  function create(e: FormEvent) {
    e.preventDefault();
    const name = folder.trim();
    if (!name) return;
    if (items.some((i) => names.compare(i.name, name) === 0)) {
      setError(`Something called ${name} already exists.`);
      return;
    }
    setError('');
    setFolder('');
    setItems(sortItems([...items, { name, folder: true, size: 0, modified: today() }], sort));
  }

  return (
    <section>
      <h1>Site photos</h1>
      <form onSubmit={create}>
        <label>
          New folder <input value={folder} onChange={(e) => setFolder(e.target.value)} />
        </label>{' '}
        <button type="submit">Create</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <table aria-label="Files">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col" aria-sort={sort.key === c.key ? sort.dir : 'none'}>
                <button type="button" onClick={() => sortBy(c.key)}>
                  {c.label}
                  {sort.key === c.key ? (sort.dir === 'ascending' ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.name}>
              <td>{i.name}</td>
              <td>{i.folder ? 'Folder' : formatSize(i.size)}</td>
              <td>{formatDate(i.modified)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
