import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { sendJson } from '../http.ts';

const W = 320;
const H = 120;
const MIN_POINTS = 10;
const MIN_SPAN = 60;
const fresh = () => ({ points: 0, minX: Infinity, maxX: -Infinity });

export function Delivery({ sandbox }: { sandbox: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(fresh);
  const [typed, setTyped] = useState(false);
  const [name, setName] = useState('');
  const [done, setDone] = useState<null | { png?: string; name?: string }>(null);
  const [error, setError] = useState('');

  function blank() {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    setInk(fresh());
  }

  useEffect(() => {
    if (typed || done) return;
    const c = canvas.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111';
    blank();
  }, [typed, done]);

  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function record(x: number) {
    setInk((s) => ({ points: s.points + 1, minX: Math.min(s.minX, x), maxX: Math.max(s.maxX, x) }));
  }

  function down(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    record(x);
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.lineTo(x, y);
    ctx.stroke();
    record(x);
  }

  const signed = typed ? name.trim().length >= 2 : ink.points >= MIN_POINTS && ink.maxX - ink.minX >= MIN_SPAN;

  async function submit() {
    const body = typed ? { kind: 'typed', name } : { kind: 'drawn', png: canvas.current!.toDataURL('image/png') };
    const res = await fetch(`/api/s/${sandbox}/delivery/sign`, sendJson('POST', body));
    if (!res.ok) return setError(((await res.json()) as { error: string }).error);
    setDone(typed ? { name: name.trim() } : { png: body.png as string });
  }

  if (done)
    return (
      <section>
        <h1>Delivery</h1>
        <p role="status">Parcel signed for.</p>
        {done.png ? <img src={done.png} alt="Your signature" width={W} height={H} /> : <p>Signed as {done.name}</p>}
      </section>
    );

  return (
    <section>
      <h1>Delivery</h1>
      <p>Sign below to confirm you received parcel PL-4471.</p>
      <label>
        <input type="checkbox" checked={typed} onChange={(e) => setTyped(e.target.checked)} /> Type my name instead
      </label>
      {typed ? (
        <p>
          <label>
            Full name <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        </p>
      ) : (
        <p>
          <canvas
            ref={canvas}
            className="signature"
            style={{ width: W, height: H }}
            aria-label="Signature pad. Draw your signature, or choose Type my name instead."
            role="img"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={() => (drawing.current = false)}
            onPointerCancel={() => (drawing.current = false)}
          />
          <br />
          <button type="button" onClick={blank}>
            Clear
          </button>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={!signed} onClick={() => void submit()}>
        Confirm delivery
      </button>
    </section>
  );
}
