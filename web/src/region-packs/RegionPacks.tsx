import { useRef, useState } from 'react';

const REGIONS = [
  { slug: 'krakow', name: 'Kraków' },
  { slug: 'gdansk', name: 'Gdańsk' },
  { slug: 'tatry', name: 'Tatry' },
];

const mb = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

type Run = { name: string; received: number; total: number | null };
type Saved = { name: string; size: number };

export function RegionPacks({ sandbox }: { sandbox: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState<Saved[]>([]);
  const abort = useRef<AbortController | null>(null);

  async function download(slug: string, name: string) {
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus(`Downloading ${name}…`);
    setRun({ name, received: 0, total: null });
    try {
      const res = await fetch(`/api/s/${sandbox}/region-packs/${slug}`, { signal: ctrl.signal });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const length = res.headers.get('content-length');
      const total = length && !res.headers.get('content-encoding') ? Number(length) : null;
      const reader = res.body.getReader();
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        setRun({ name, received, total });
      }
      if (total !== null && received !== total) throw new Error('short');
      setSaved((list) => [...list.filter((p) => p.name !== name), { name, size: received }]);
      setStatus(`Saved ${name} (${mb(received)}).`);
    } catch {
      setStatus(ctrl.signal.aborted ? 'Download cancelled.' : `Download failed: ${name}. Try again.`);
    } finally {
      if (abort.current === ctrl) abort.current = null;
      setRun(null);
    }
  }

  const pct = run && run.total ? Math.floor((run.received * 100) / run.total) : null;

  return (
    <section className="region-packs">
      <h1>Region packs</h1>
      <p>Download a cycling map for riding without signal.</p>
      <ul className="region-list">
        {REGIONS.map((r) => (
          <li key={r.slug}>
            <button type="button" disabled={run !== null} onClick={() => void download(r.slug, r.name)}>
              Download {r.name}
            </button>
          </li>
        ))}
      </ul>
      {run && (
        <div className="region-progress">
          <div
            role="progressbar"
            aria-label={`Downloading ${run.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct ?? undefined}
          >
            <div className={pct === null ? 'region-bar busy' : 'region-bar'} style={pct === null ? undefined : { width: `${pct}%` }} />
          </div>
          <p className="region-amount">{pct === null ? `${mb(run.received)} received` : `${pct}% (${mb(run.received)} of ${mb(run.total!)})`}</p>
          <button type="button" onClick={() => abort.current?.abort()}>
            Cancel download
          </button>
        </div>
      )}
      <p role="status">{status}</p>
      <h2>On this device</h2>
      {saved.length === 0 ? (
        <p>No packs yet.</p>
      ) : (
        <ul aria-label="On this device">
          {saved.map((p) => (
            <li key={p.name}>
              {p.name}, {mb(p.size)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
