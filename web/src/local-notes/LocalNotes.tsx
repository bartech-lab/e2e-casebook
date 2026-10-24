import { useEffect, useRef, useState, type FormEvent } from 'react';
import { json } from '../http.ts';

type Note = { id: number; text: string; pinned?: boolean };
type State = 'loading' | 'ready' | 'blocked' | 'stale' | 'error';

const done = <T,>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export function LocalNotes({ sandbox }: { sandbox: string }) {
  const [state, setState] = useState<State>('loading');
  const [version, setVersion] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const db = useRef<IDBDatabase | null>(null);

  const reload = async () => {
    const store = db.current!.transaction('notes').objectStore('notes');
    setNotes(await done(store.getAll() as IDBRequest<Note[]>));
  };

  useEffect(() => {
    let live = true;
    void (async () => {
      const { version: wanted } = await json<{ version: number }>(await fetch(`/api/s/${sandbox}/notes-schema`));
      if (!live) return;
      setVersion(wanted);
      const req = indexedDB.open(`notes-${sandbox}`, wanted);
      req.onupgradeneeded = (e) => {
        const tx = req.transaction!;
        if (e.oldVersion < 1) req.result.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        if (e.oldVersion < 2 && wanted >= 2) {
          const cursor = tx.objectStore('notes').openCursor();
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (!c) return;
            c.update({ ...c.value, pinned: false });
            c.continue();
          };
        }
      };
      req.onblocked = () => {
        if (live) setState('blocked');
      };
      req.onerror = () => {
        if (live) setState('error');
      };
      req.onsuccess = () => {
        const opened = req.result;
        if (!live) return opened.close();
        db.current = opened;
        opened.onversionchange = () => {
          opened.close();
          db.current = null;
          setState('stale');
        };
        void reload().then(() => setState('ready'));
      };
    })().catch(() => live && setState('error'));
    return () => {
      live = false;
      db.current?.close();
      db.current = null;
    };
  }, [sandbox]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!db.current || !text.trim()) return;
    const note: Omit<Note, 'id'> = version >= 2 ? { text: text.trim(), pinned: false } : { text: text.trim() };
    await done(db.current.transaction('notes', 'readwrite').objectStore('notes').add(note));
    setText('');
    await reload();
  }

  async function pin(note: Note, pinned: boolean) {
    if (!db.current) return;
    setNotes((cur) => cur.map((n) => (n.id === note.id ? { ...n, pinned } : n)));
    await done(db.current.transaction('notes', 'readwrite').objectStore('notes').put({ ...note, pinned }));
    await reload();
  }

  const editable = state === 'ready';
  return (
    <section>
      <h1>Local notes</h1>
      {state === 'loading' && <p>Loading…</p>}
      {state === 'blocked' && <p role="alert">Close other tabs of this app to finish updating your notes.</p>}
      {state === 'stale' && <p role="alert">A newer version is open in another tab. Reload this tab to keep editing.</p>}
      {state === 'error' && <p role="alert">Your notes could not be opened.</p>}
      <form onSubmit={(e) => void add(e)}>
        <label>
          New note <input value={text} onChange={(e) => setText(e.target.value)} disabled={!editable} />
        </label>{' '}
        <button type="submit" disabled={!editable}>
          Add
        </button>
      </form>
      <ul aria-label="Notes">
        {notes.map((n) => (
          <li key={n.id}>
            {n.text}
            {version >= 2 && (
              <label>
                {' '}
                <input type="checkbox" checked={!!n.pinned} disabled={!editable} onChange={(e) => void pin(n, e.target.checked)} /> Pin
              </label>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
