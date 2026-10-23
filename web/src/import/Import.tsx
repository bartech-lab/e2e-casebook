import { useEffect, useRef, useState } from 'react';

type Progress = { done: number; total: number };
type RowError = { row: number; message: string };
type Complete = { imported: number; failed: number };

export function Import({ sandbox }: { sandbox: string }) {
  const [job, setJob] = useState<number | null>(null);
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 });
  const [errors, setErrors] = useState<RowError[]>([]);
  const [complete, setComplete] = useState<Complete | null>(null);
  const [connection, setConnection] = useState('');
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (job === null) return;
    const es = new EventSource(`/api/s/${sandbox}/imports/${job}/events`);
    const fresh = (e: MessageEvent) => {
      if (seen.current.has(e.lastEventId)) return false;
      seen.current.add(e.lastEventId);
      return true;
    };
    es.onopen = () => setConnection('Connected.');
    es.onerror = () => setConnection(es.readyState === EventSource.CLOSED ? 'Connection lost.' : 'Reconnecting…');
    es.addEventListener('progress', (e) => {
      if (fresh(e)) setProgress(JSON.parse(e.data) as Progress);
    });
    es.addEventListener('row-error', (e) => {
      if (fresh(e)) setErrors((list) => [...list, JSON.parse(e.data) as RowError]);
    });
    es.addEventListener('complete', (e) => {
      if (!fresh(e)) return;
      setComplete(JSON.parse(e.data) as Complete);
      setConnection('');
      es.close();
    });
    return () => es.close();
  }, [job, sandbox]);

  async function start() {
    const res = await fetch(`/api/s/${sandbox}/imports`, { method: 'POST' });
    const { id, total } = (await res.json()) as { id: number; total: number };
    seen.current = new Set();
    setErrors([]);
    setComplete(null);
    setProgress({ done: 0, total });
    setJob(id);
  }

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section>
      <h1>Import</h1>
      <p>Import 100 customers from the uploaded file.</p>
      <button type="button" onClick={() => void start()} disabled={job !== null && !complete}>
        Start import
      </button>
      {job !== null && (
        <>
          <p>
            <progress aria-label="Import progress" max={100} value={percent} /> {percent}%
          </p>
          <p role="status">{complete ? `Imported ${complete.imported} of ${complete.imported + complete.failed} rows. ${complete.failed} rows had errors.` : connection}</p>
          {errors.length > 0 && (
            <ul aria-label="Rows with errors">
              {errors.map((e) => (
                <li key={e.row}>{e.message}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
