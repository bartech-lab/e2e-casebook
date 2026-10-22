import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const MAX = 500;
const STEP = 10;
const PRODUCTS: [string, number][] = [
  ['Pencil', 5],
  ['Notebook', 40],
  ['Desk lamp', 100],
  ['Backpack', 180],
  ['Headphones', 240],
  ['Office chair', 300],
  ['Monitor', 450],
  ['Standing desk', 500],
];

type Thumb = 'min' | 'max';

function fromUrl(): Record<Thumb, number> {
  const params = new URLSearchParams(location.search);
  const read = (key: Thumb, fallback: number) => {
    const n = Number(params.get(key));
    return params.has(key) && Number.isFinite(n) ? Math.min(MAX, Math.max(0, Math.round(n / STEP) * STEP)) : fallback;
  };
  const min = read('min', 0);
  return { min, max: Math.max(min, read('max', MAX)) };
}

export function PriceFilter() {
  const [range, setRange] = useState(fromUrl);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef<Thumb | null>(null);

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('min', String(range.min));
    url.searchParams.set('max', String(range.max));
    history.replaceState(history.state, '', url);
  }, [range]);

  function set(thumb: Thumb, value: number) {
    setRange((r) => {
      const clamped = Math.min(MAX, Math.max(0, value));
      return thumb === 'min' ? { ...r, min: Math.min(clamped, r.max) } : { ...r, max: Math.max(clamped, r.min) };
    });
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging.current) return;
    const box = track.current!.getBoundingClientRect();
    set(dragging.current, Math.round((((e.clientX - box.left) / box.width) * MAX) / STEP) * STEP);
  }

  function onKeyDown(thumb: Thumb, e: KeyboardEvent) {
    const value = range[thumb];
    const next = { ArrowLeft: value - STEP, ArrowDown: value - STEP, ArrowRight: value + STEP, ArrowUp: value + STEP, PageDown: value - 10 * STEP, PageUp: value + 10 * STEP, Home: 0, End: MAX }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    set(thumb, next);
  }

  const thumb = (t: Thumb, label: string) => (
    <div
      className="thumb"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={t === 'min' ? 0 : range.min}
      aria-valuemax={t === 'min' ? range.max : MAX}
      aria-valuenow={range[t]}
      aria-valuetext={`${range[t]} PLN`}
      style={{ left: `${(range[t] / MAX) * 100}%` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = t;
      }}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        dragging.current = null;
      }}
      onKeyDown={(e) => onKeyDown(t, e)}
    />
  );

  const shown = PRODUCTS.filter(([, price]) => price >= range.min && price <= range.max);

  return (
    <section>
      <h1>Price filter</h1>
      <div className="range" ref={track}>
        <div className="range-fill" style={{ left: `${(range.min / MAX) * 100}%`, right: `${100 - (range.max / MAX) * 100}%` }} />
        {thumb('min', 'Lowest price')}
        {thumb('max', 'Highest price')}
      </div>
      <p role="status">
        {range.min} to {range.max} PLN: {shown.length} {shown.length === 1 ? 'product' : 'products'}
      </p>
      <ul aria-label="Products">
        {shown.map(([name, price]) => (
          <li key={name}>
            {name}, {price} PLN
          </li>
        ))}
      </ul>
    </section>
  );
}
