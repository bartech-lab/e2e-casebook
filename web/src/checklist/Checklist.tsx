import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';
import { uid } from '../uid.ts';

type Item = { clientId: string; text: string };

const RETRY_MS = 2000;
const queueKey = (sandbox: string) => `checklist-queue:${sandbox}`;

function readQueue(sandbox: string): Item[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey(sandbox)) ?? '[]') as Item[];
  } catch {
    return [];
  }
}

export function Checklist({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['checklist', sandbox];
  const url = `/api/s/${sandbox}/checklist`;
  const saved = useQuery({ queryKey: key, queryFn: async () => json<{ items: Item[] }>(await fetch(url)) });
  const [queue, setQueue] = useState(() => readQueue(sandbox));
  const [online, setOnline] = useState(navigator.onLine);
  const syncing = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout>>(undefined);

  function store(next: Item[]) {
    localStorage.setItem(queueKey(sandbox), JSON.stringify(next));
    setQueue(next);
  }

  async function sync() {
    if (syncing.current || !navigator.onLine) return;
    syncing.current = true;
    clearTimeout(retry.current);
    try {
      for (let pending = readQueue(sandbox); pending.length; pending = readQueue(sandbox)) {
        await json<Item>(await fetch(url, sendJson('POST', pending[0])));
        store(readQueue(sandbox).slice(1));
        await client.invalidateQueries({ queryKey: key });
      }
    } catch {
      retry.current = setTimeout(() => void sync(), RETRY_MS);
    } finally {
      syncing.current = false;
    }
  }

  useEffect(() => {
    const up = () => {
      setOnline(true);
      void sync();
    };
    const down = () => setOnline(false);
    addEventListener('online', up);
    addEventListener('offline', down);
    void sync();
    return () => {
      removeEventListener('online', up);
      removeEventListener('offline', down);
      clearTimeout(retry.current);
    };
  }, [sandbox]);

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const text = String(new FormData(form).get('item') ?? '').trim();
    if (!text) return;
    store([...readQueue(sandbox), { clientId: uid(), text }]);
    form.reset();
    void sync();
  }

  const items = saved.data?.items ?? [];
  const pending = queue.filter((q) => !items.some((i) => i.clientId === q.clientId));

  return (
    <section>
      <h1>Checklist</h1>
      <p role="status">{online ? '' : 'Offline. Changes will sync when you are back online.'}</p>
      <form onSubmit={add}>
        <label>
          New item <input name="item" maxLength={100} autoComplete="off" />
        </label>{' '}
        <button type="submit">Add</button>
      </form>
      <ul aria-label="Checklist">
        {items.map((i) => (
          <li key={i.clientId}>{i.text}</li>
        ))}
        {pending.map((i) => (
          <li key={i.clientId}>
            {i.text} <em>(not synced)</em>
          </li>
        ))}
      </ul>
    </section>
  );
}
