import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { json } from '../http.ts';

const PART = 1024 * 1024;
const MB = (n: number) => (n / PART).toFixed(1);
type Done = { name: string; size: number };

export function VideoUpload({ sandbox }: { sandbox: string }) {
  const api = `/api/s/${sandbox}/video-uploads`;
  const saved = `video-uploads-${sandbox}`;
  const [done, setDone] = useState<Done[]>([]);
  const [progress, setProgress] = useState<{ sent: number; size: number } | null>(null);
  const [lost, setLost] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const resume = useRef<() => void>(() => {});

  const refresh = () =>
    fetch(api)
      .then((res) => json<{ files: Done[] }>(res))
      .then(({ files }) => setDone(files));
  useEffect(() => void refresh(), [sandbox]);

  const ids = (): Record<string, string> => JSON.parse(localStorage.getItem(saved) ?? '{}');
  const remember = (key: string, id: string | null) => {
    const all = ids();
    if (id) all[key] = id;
    else delete all[key];
    localStorage.setItem(saved, JSON.stringify(all));
  };

  async function serverOffset(id: string) {
    for (;;) {
      try {
        const res = await fetch(`${api}/${id}`);
        if (res.status === 404) return null;
        return (await json<{ offset: number }>(res)).offset;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  async function upload(file: File) {
    const key = `${file.name}:${file.size}`;
    let id = ids()[key];
    let offset = id ? await serverOffset(id) : null;
    if (offset === null) {
      ({ id, offset } = await json<{ id: string; offset: number }>(
        await fetch(api, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: file.name, size: file.size }) }),
      ));
      remember(key, id!);
    }
    setProgress({ sent: offset, size: file.size });
    while (offset < file.size) {
      if (pausedRef.current) await new Promise<void>((r) => (resume.current = r));
      try {
        const res = await fetch(`${api}/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/offset+octet-stream', 'upload-offset': String(offset) },
          body: file.slice(offset, offset + PART),
        });
        if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`);
        offset = (await res.json()).offset as number;
        setLost(false);
      } catch {
        setLost(true);
        await new Promise((r) => setTimeout(r, 1000));
        offset = (await serverOffset(id!)) ?? 0;
      }
      setProgress({ sent: offset, size: file.size });
    }
    remember(key, null);
    setProgress(null);
    setLost(false);
    await refresh();
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void upload(file);
  }

  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) resume.current();
  }

  return (
    <section>
      <h1>Video upload</h1>
      <label>
        Choose a video <input type="file" accept="video/*" onChange={pick} disabled={progress !== null} />
      </label>
      {progress && (
        <>
          <p>
            <progress aria-label="Upload progress" max={progress.size} value={progress.sent} /> Uploaded {MB(progress.sent)} of {MB(progress.size)} MB
          </p>
          <button type="button" onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>
        </>
      )}
      <p role="status">{lost ? 'Connection lost. Resuming…' : ''}</p>
      <ul aria-label="Uploaded videos">
        {done.map((f) => (
          <li key={f.name + f.size}>
            {f.name}, {MB(f.size)} MB
          </li>
        ))}
      </ul>
    </section>
  );
}
