import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json } from '../http.ts';

type Pending = { name: string; timer: ReturnType<typeof setTimeout> };

const UNDO_MS = 5000;

export function Files({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['files', sandbox];
  const url = `/api/s/${sandbox}/files`;
  const files = useQuery({ queryKey: key, queryFn: async () => json<{ files: string[] }>(await fetch(url)) });
  const [hidden, setHidden] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const pending = useRef<Pending | null>(null);

  function commit(p: Pending) {
    void fetch(`${url}/${encodeURIComponent(p.name)}`, { method: 'DELETE', keepalive: true }).then(() => client.invalidateQueries({ queryKey: key }));
  }

  function flush() {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    commit(p);
  }

  useEffect(() => {
    addEventListener('pagehide', flush);
    return () => {
      removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  function remove(name: string) {
    flush();
    setHidden((h) => [...h, name]);
    setToast(name);
    const timer = setTimeout(() => {
      const p = pending.current;
      if (p?.name !== name) return;
      pending.current = null;
      commit(p);
      setToast(null);
    }, UNDO_MS);
    pending.current = { name, timer };
  }

  function undo() {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    setHidden((h) => h.filter((n) => n !== p.name));
    setToast(null);
  }

  const shown = (files.data?.files ?? []).filter((f) => !hidden.includes(f));

  return (
    <section>
      <h1>Files</h1>
      <ul aria-label="Files">
        {shown.map((f) => (
          <li key={f}>
            {f}{' '}
            <button type="button" aria-label={`Delete ${f}`} onClick={() => remove(f)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      {toast && (
        <div role="status" className="toast">
          Deleted {toast}.{' '}
          <button type="button" onClick={undo}>
            Undo
          </button>
        </div>
      )}
    </section>
  );
}
