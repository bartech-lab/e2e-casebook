import { useEffect, useRef, useState, type DragEvent } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];
type Attached = { name: string; size: number };

const sizeText = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function Receipts() {
  const [attached, setAttached] = useState<Attached[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const stop = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    addEventListener('dragover', stop);
    addEventListener('drop', stop);
    return () => {
      removeEventListener('dragover', stop);
      removeEventListener('drop', stop);
    };
  }, []);

  function add(files: File[]) {
    const problems: string[] = [];
    const ok: Attached[] = [];
    for (const f of files) {
      const lower = f.name.toLowerCase();
      if (!TYPES.some((t) => lower.endsWith(t))) problems.push(`${f.name} is not a PDF, JPG or PNG.`);
      else if (f.size > MAX_BYTES) problems.push(`${f.name} is larger than 5 MB.`);
      else ok.push({ name: f.name, size: f.size });
    }
    setRejected(problems);
    setAttached((cur) => [...cur, ...ok.filter((o) => !cur.some((c) => c.name === o.name && c.size === o.size))]);
  }

  const onDragEnter = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    depth.current++;
    setOver(true);
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    add([...e.dataTransfer.files]);
  };

  return (
    <section>
      <h1>Receipts</h1>
      <p>Attach the receipts for your expense claim: PDF, JPG or PNG, up to 5 MB each.</p>
      <div
        className={over ? 'drop-zone drop-zone-over' : 'drop-zone'}
        data-over={over ? 'true' : 'false'}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="drop-zone-text">{over ? 'Drop the files to attach them' : 'Drag receipts here'}</p>
        <p>
          <label>
            Or choose files <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { add([...(e.target.files ?? [])]); e.target.value = ''; }} />
          </label>
        </p>
      </div>
      <div role="alert">
        {rejected.length > 0 && (
          <ul aria-label="Not attached">
            {rejected.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <ul aria-label="Attached receipts">
        {attached.map((a) => (
          <li key={`${a.name}-${a.size}`}>
            {a.name} ({sizeText(a.size)})
          </li>
        ))}
      </ul>
    </section>
  );
}
