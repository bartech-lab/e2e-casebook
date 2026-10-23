import { useEffect, useRef, useState, type FormEvent } from 'react';

type Item = { id: number; name: string; qty: number; packed: boolean };
type Entry = { before: Item[]; key: string; at: number };

const START: Item[] = [
  { id: 1, name: 'Passport', qty: 1, packed: false },
  { id: 2, name: 'Socks', qty: 3, packed: false },
  { id: 3, name: 'Charger', qty: 1, packed: false },
];
const COALESCE_MS = 1000;
const LIMIT = 50;

const inField = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

export function Packing() {
  const [items, setItems] = useState(START);
  const [past, setPast] = useState<Entry[]>([]);
  const [future, setFuture] = useState<Item[][]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const nextId = useRef(4);

  function commit(next: Item[], key: string) {
    const now = Date.now();
    const last = past.at(-1);
    if (last && key !== '' && last.key === key && now - last.at < COALESCE_MS) setPast([...past.slice(0, -1), { ...last, at: now }]);
    else setPast([...past, { before: items, key, at: now }].slice(-LIMIT));
    setFuture([]);
    setItems(next);
  }

  function undo() {
    const last = past.at(-1);
    if (!last) return;
    setPast(past.slice(0, -1));
    setFuture([items, ...future]);
    setItems(last.before);
  }

  function redo() {
    const [next, ...rest] = future;
    if (!next) return;
    setPast([...past, { before: items, key: '', at: 0 }]);
    setFuture(rest);
    setItems(next);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inField(e.target) || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) undo();
      else if ((k === 'z' && e.shiftKey) || k === 'y') redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get('name') ?? '').trim();
    if (!name) return;
    commit([...items, { id: nextId.current++, name, qty: 1, packed: false }], '');
    e.currentTarget.reset();
  }

  const update = (id: number, change: Partial<Item>) => items.map((i) => (i.id === id ? { ...i, ...change } : i));

  return (
    <section>
      <h1>Packing list</h1>
      <p role="toolbar" aria-label="History">
        <button type="button" disabled={past.length === 0} onClick={undo}>
          Undo
        </button>{' '}
        <button type="button" disabled={future.length === 0} onClick={redo}>
          Redo
        </button>
      </p>
      <form onSubmit={add}>
        <label>
          New item <input name="name" />
        </label>{' '}
        <button type="submit">Add</button>
      </form>
      <ul aria-label="Packing list" className="packing">
        {items.map((item) => (
          <li key={item.id}>
            <input type="checkbox" aria-label={`Packed ${item.name}`} checked={item.packed} onChange={() => commit(update(item.id, { packed: !item.packed }), '')} />{' '}
            {editing === item.id ? (
              <input
                aria-label={`Rename ${item.name}`}
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    commit(update(item.id, { name: draft.trim() }), '');
                    setEditing(null);
                  } else if (e.key === 'Escape') setEditing(null);
                }}
              />
            ) : (
              <span className="name">{item.name}</span>
            )}{' '}
            <button type="button" aria-label={`Fewer ${item.name}`} onClick={() => commit(update(item.id, { qty: Math.max(1, item.qty - 1) }), `qty-${item.id}`)}>
              −
            </button>
            <output aria-label={`Quantity of ${item.name}`}>{item.qty}</output>
            <button type="button" aria-label={`More ${item.name}`} onClick={() => commit(update(item.id, { qty: item.qty + 1 }), `qty-${item.id}`)}>
              +
            </button>{' '}
            <button
              type="button"
              onClick={() => {
                setEditing(item.id);
                setDraft(item.name);
              }}
            >
              Rename
            </button>{' '}
            <button type="button" aria-label={`Delete ${item.name}`} onClick={() => commit(items.filter((i) => i.id !== item.id), '')}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
