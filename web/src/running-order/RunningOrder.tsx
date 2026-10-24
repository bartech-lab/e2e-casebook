import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { json } from '../http.ts';

const ROW = 40;
const EDGE = 40;
const SPEED = 8;

type Drag = { act: string; from: number; y: number; target: number; frame: number };

export function RunningOrder({ sandbox }: { sandbox: string }) {
  const [acts, setActs] = useState<string[] | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const list = useRef<HTMLOListElement>(null);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/running-order`)
      .then((r) => json<{ acts: string[] }>(r))
      .then((r) => setActs(r.acts));
  }, [sandbox]);

  const slotAt = (y: number) => {
    const box = list.current!;
    const top = box.getBoundingClientRect().top;
    const index = Math.round((y - top + box.scrollTop) / ROW);
    return Math.max(0, Math.min(acts!.length, index));
  };

  function frame() {
    const d = drag.current;
    const box = list.current;
    if (!d || !box) return;
    const r = box.getBoundingClientRect();
    if (d.y < r.top + EDGE) box.scrollTop -= SPEED;
    else if (d.y > r.bottom - EDGE) box.scrollTop += SPEED;
    d.target = slotAt(d.y);
    setTarget(d.target);
    d.frame = requestAnimationFrame(frame);
  }

  function down(act: string, index: number, e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { act, from: index, y: e.clientY, target: index, frame: requestAnimationFrame(frame) };
    setDragging(act);
    setMessage('');
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    if (drag.current) drag.current.y = e.clientY;
  }

  function stop(drop: boolean) {
    const d = drag.current;
    if (!d) return;
    cancelAnimationFrame(d.frame);
    drag.current = null;
    setDragging(null);
    setTarget(null);
    if (!drop || !acts) return;
    const next = acts.filter((a) => a !== d.act);
    const at = d.target > d.from ? d.target - 1 : d.target;
    next.splice(at, 0, d.act);
    setActs(next);
    setMessage(`${d.act} is now number ${at + 1} of ${next.length}.`);
    void fetch(`/api/s/${sandbox}/running-order`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acts: next }),
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stop(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section>
      <h1>Running order</h1>
      <p>Drag an act by its handle to change when it is on. Hold it near the top or bottom of the list to scroll.</p>
      {acts === null ? (
        <p>Loading…</p>
      ) : (
        <ol ref={list} className="running-order" aria-label="Acts">
          {acts.map((act, i) => (
            <li key={act} className={dragging === act ? 'act dragging' : 'act'} data-drop-before={target === i ? '' : undefined}>
              <button
                type="button"
                className="act-handle"
                aria-label={`Move ${act}`}
                onPointerDown={(e) => down(act, i, e)}
                onPointerMove={move}
                onPointerUp={() => stop(true)}
                onPointerCancel={() => stop(false)}
              >
                ⠿
              </button>{' '}
              {act}
            </li>
          ))}
          {target === acts.length && <li className="act-end" aria-hidden="true" />}
        </ol>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
