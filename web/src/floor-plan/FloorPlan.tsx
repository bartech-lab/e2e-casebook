import { useEffect, useRef, useState, type PointerEvent } from 'react';

const MIN = 1;
const MAX = 4;
const ROOMS = [
  ['Kitchen', 1, 1, 2, 1],
  ['Living room', 3, 1, 3, 2],
  ['Hall', 1, 2, 2, 1],
  ['Bedroom', 1, 3, 3, 2],
  ['Bathroom', 4, 3, 2, 1],
  ['Balcony', 4, 4, 2, 1],
] as const;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

export function FloorPlan() {
  const [zoom, setZoom] = useState(1);
  const area = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = area.current!;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clamp(z * Math.exp(-e.deltaY / 200)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a!.x - b!.x, a!.y - b!.y);
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) pinch.current = { dist: distance(), zoom: zoomRef.current };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) setZoom(clamp((pinch.current.zoom * distance()) / pinch.current.dist));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const percent = Math.round(zoom * 100);
  return (
    <section>
      <h1>Floor plan</h1>
      <p>Flat for rent, Mokotów, 58 m². Pinch, use Ctrl and the mouse wheel, or the buttons to zoom.</p>
      <div className="plan-tools">
        <button type="button" onClick={() => setZoom((z) => clamp(z - 0.5))} disabled={zoom <= MIN}>
          Zoom out
        </button>
        <button type="button" onClick={() => setZoom((z) => clamp(z + 0.5))} disabled={zoom >= MAX}>
          Zoom in
        </button>
        <button type="button" onClick={() => setZoom(1)}>
          Reset
        </button>
        <span role="status">Zoom: {percent}%</span>
      </div>
      <div
        ref={area}
        className="plan-area"
        aria-label="Floor plan"
        role="img"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div className="plan-grid" style={{ transform: `scale(${zoom})` }}>
          {ROOMS.map(([name, x, y, w, h]) => (
            <div key={name} className="plan-room" style={{ gridColumn: `${x} / span ${w}`, gridRow: `${y} / span ${h}` }}>
              {name}
            </div>
          ))}
        </div>
      </div>
      <p className="plan-notes">The flat is on the third floor, with a lift. The rent includes heating and water.</p>
    </section>
  );
}
