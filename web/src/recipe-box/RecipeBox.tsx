import { useEffect, useState, type FormEvent } from 'react';

type Recipe = { id: string; title: string; minutes: number };

const cache = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();

function load<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    cache.set(url, p);
    p.catch(() => cache.delete(url));
  }
  return p as Promise<T>;
}

function invalidate(url: string) {
  cache.delete(url);
  listeners.forEach((l) => l());
}

function useQuery<T>(url: string): T | undefined {
  const [data, setData] = useState<T>();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const l = () => setVersion((v) => v + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  useEffect(() => {
    let live = true;
    load<T>(url).then(
      (d) => live && setData(d),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [url, version]);
  return data;
}

function Editor({ base, id, onDone, onStatus }: { base: string; id: string; onDone: () => void; onStatus: (s: string) => void }) {
  const recipe = useQuery<Recipe>(`${base}/recipes/${id}`);
  if (!recipe) return <p>Loading…</p>;
  return <EditorForm key={`${recipe.id}:${recipe.title}:${recipe.minutes}`} base={base} recipe={recipe} onDone={onDone} onStatus={onStatus} />;
}

function EditorForm({ base, recipe, onDone, onStatus }: { base: string; recipe: Recipe; onDone: () => void; onStatus: (s: string) => void }) {
  const [title, setTitle] = useState(recipe.title);
  const [minutes, setMinutes] = useState(String(recipe.minutes));
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`${base}/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, minutes: Number(minutes) }),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      onStatus('Could not save. Try again.');
      return;
    }
    invalidate(`${base}/recipes`);
    invalidate(`${base}/recipes/${recipe.id}`);
    onStatus('Saved.');
    onDone();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`${base}/recipes/${recipe.id}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      onStatus('Could not delete. Try again.');
      return;
    }
    invalidate(`${base}/recipes`);
    invalidate(`${base}/recipes-count`);
    invalidate(`${base}/recipes/${recipe.id}`);
    onStatus('Deleted.');
    onDone();
  }

  return (
    <form aria-label="Edit recipe" onSubmit={(e) => void save(e)}>
      <label>
        Title <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Minutes <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      </label>
      <button type="submit" disabled={busy}>
        Save
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
      <button type="button" disabled={busy} onClick={() => void remove()}>
        Delete recipe
      </button>
    </form>
  );
}

export function RecipeBox({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}`;
  const list = useQuery<{ recipes: Recipe[] }>(`${base}/recipes`);
  const count = useQuery<{ count: number }>(`${base}/recipes-count`);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  return (
    <section className="recipe-box">
      <h1>Recipe box</h1>
      <p className="recipe-count">{count ? `${count.count} recipes` : ' '}</p>
      <div className="recipe-layout">
        {list ? (
          <ul aria-label="Recipes">
            {list.recipes.map((r) => (
              <li key={r.id}>
                <span>
                  {r.title}, {r.minutes} min
                </span>{' '}
                <button type="button" aria-label={`Edit ${r.title}`} onClick={() => setEditing(r.id)}>
                  Edit
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading…</p>
        )}
        <div>{editing && <Editor base={base} id={editing} onDone={() => setEditing(null)} onStatus={setStatus} />}</div>
      </div>
      <p role="status">{status}</p>
    </section>
  );
}
