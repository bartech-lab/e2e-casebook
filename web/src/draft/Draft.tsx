import { useEffect, useRef, useState } from 'react';
import { json, sendJson } from '../http.ts';

type Saved = { text: string; version: number };
type Status = 'idle' | 'unsaved' | 'saving' | 'saved' | 'retrying';

const IDLE_MS = 1000;
const RETRY_MS = 2000;
const LABELS: Record<Status, string> = {
  idle: '',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  retrying: 'Not saved. Retrying…',
};

export function Draft({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/draft`;
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const version = useRef(0);
  const latest = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    void (async () => {
      const saved = await json<Saved>(await fetch(url));
      version.current = saved.version;
      latest.current = saved.text;
      setText(saved.text);
    })();
    return () => clearTimeout(timer.current);
  }, [url]);

  async function save() {
    const sent = version.current;
    setStatus('saving');
    try {
      const saved = await json<Saved>(await fetch(url, { ...sendJson('PUT', { text: latest.current, version: sent }), cache: 'no-store' }));
      if (saved.version >= version.current) setStatus('saved');
    } catch {
      setStatus('retrying');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), RETRY_MS);
    }
  }

  function edit(next: string) {
    setText(next);
    latest.current = next;
    version.current += 1;
    setStatus('unsaved');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), IDLE_MS);
  }

  return (
    <section>
      <h1>Draft</h1>
      <label>
        Letter
        <textarea rows={8} cols={60} value={text ?? ''} disabled={text === null} onChange={(e) => edit(e.target.value)} />
      </label>
      <p role="status">{LABELS[status]}</p>
    </section>
  );
}
