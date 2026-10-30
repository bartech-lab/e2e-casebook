import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

const PAUSE_MS = 300;

function waitMs(header: string | null) {
  if (!header) return 1000;
  if (/^\d+$/.test(header.trim())) return Number(header) * 1000;
  const at = Date.parse(header);
  return Number.isNaN(at) ? 1000 : Math.max(0, at - Date.now());
}

export function PartsSearch({ sandbox }: { sandbox: string }) {
  const [text, setText] = useState('');
  const [parts, setParts] = useState<string[] | null>(null);
  const [searched, setSearched] = useState('');
  const [waitUntil, setWaitUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const latest = useRef('');
  const seq = useRef(0);

  async function search(q: string) {
    const id = ++seq.current;
    const res = await fetch(`/api/s/${sandbox}/parts?q=${encodeURIComponent(q)}`);
    if (id !== seq.current) return;
    if (res.status === 429) {
      setWaitUntil(Date.now() + waitMs(res.headers.get('retry-after')));
      setNow(Date.now());
      return;
    }
    const body = await json<{ parts: string[] }>(res);
    if (id !== seq.current) return;
    setParts(body.parts);
    setSearched(q);
  }

  useEffect(() => {
    latest.current = text.trim();
    if (!latest.current) {
      seq.current++;
      setParts(null);
      return;
    }
    if (waitUntil !== null) return;
    const timer = setTimeout(() => void search(latest.current), PAUSE_MS);
    return () => clearTimeout(timer);
  }, [text, waitUntil]);

  useEffect(() => {
    if (waitUntil === null) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    const done = setTimeout(() => setWaitUntil(null), Math.max(0, waitUntil - Date.now()));
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [waitUntil]);

  const left = waitUntil === null ? 0 : Math.max(1, Math.ceil((waitUntil - now) / 1000));
  return (
    <section>
      <h1>Parts search</h1>
      <label>
        Search parts <input type="search" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <p role="status">{waitUntil !== null ? `Too many searches. Searching again in ${left} s.` : ''}</p>
      {parts !== null && parts.length === 0 && <p>No parts match "{searched}".</p>}
      {parts !== null && parts.length > 0 && (
        <ul aria-label="Parts">
          {parts.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
