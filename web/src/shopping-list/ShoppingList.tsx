import { useEffect, useRef, useState, type FormEvent } from 'react';

type Item = { key: string; id: string | null; name: string; done: boolean };
type Op = { kind: 'done'; done: boolean } | { kind: 'remove' };

let counter = 0;

export function ShoppingList({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}`;
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const ids = useRef(new Map<string, string>());
  const chains = useRef(new Map<string, Promise<string | null>>());

  useEffect(() => {
    void fetch(`${base}/shopping`)
      .then((r) => r.json())
      .then((d: { items: { id: string; name: string; done: boolean }[] }) => {
        for (const i of d.items) ids.current.set(i.id, i.id);
        setItems(d.items.map((i) => ({ ...i, key: i.id })));
      });
  }, [base]);

  async function send(id: string, op: Op) {
    if (op.kind === 'remove') await fetch(`${base}/shopping/${id}`, { method: 'DELETE' });
    else await fetch(`${base}/shopping/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: op.done }) });
  }

  function change(key: string, op: Op) {
    const prev = chains.current.get(key) ?? Promise.resolve(ids.current.get(key) ?? null);
    chains.current.set(
      key,
      prev.then(async (id) => {
        if (id) await send(id, op);
        return id;
      }),
    );
  }

  function add(e: FormEvent) {
    e.preventDefault();
    const text = name.trim();
    if (!text) return;
    setName('');
    const key = `new-${++counter}`;
    setItems((l) => [...l, { key, id: null, name: text, done: false }]);
    const created = fetch(`${base}/shopping`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: text }),
    })
      .then(async (res) => (res.ok ? ((await res.json()) as { id: string }).id : null))
      .catch(() => null)
      .then((id) => {
        if (!id) {
          setItems((l) => l.filter((i) => i.key !== key));
          setStatus(`Could not add ${text}.`);
          return null;
        }
        ids.current.set(key, id);
        setItems((l) => l.map((i) => (i.key === key ? { ...i, id } : i)));
        return id;
      });
    chains.current.set(key, created);
  }

  function toggle(item: Item) {
    setItems((l) => l.map((i) => (i.key === item.key ? { ...i, done: !item.done } : i)));
    change(item.key, { kind: 'done', done: !item.done });
  }

  function remove(item: Item) {
    setItems((l) => l.filter((i) => i.key !== item.key));
    change(item.key, { kind: 'remove' });
  }

  return (
    <section className="shopping-list">
      <h1>Shopping list</h1>
      <form onSubmit={add}>
        <label>
          New item <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>{' '}
        <button type="submit">Add</button>
      </form>
      <ul aria-label="Shopping list">
        {items.map((item) => (
          <li key={item.key}>
            <label>
              <input type="checkbox" checked={item.done} onChange={() => toggle(item)} /> {item.name}
            </label>{' '}
            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <p role="status">{status}</p>
    </section>
  );
}
