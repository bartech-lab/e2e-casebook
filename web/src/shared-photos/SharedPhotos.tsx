import { useRef, useState, type PointerEvent } from 'react';

const PHOTOS = ['Beach at dawn', 'Old town square', 'Mountain hut', 'Night market', 'Lake pier', 'Castle gate', 'Tram stop', 'Harbour cranes', 'Pine forest'];
const HOLD_MS = 500;
const MOVE_PX = 10;

export function SharedPhotos() {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const press = useRef<{ name: string; x: number; y: number; timer: ReturnType<typeof setTimeout>; fired: boolean } | null>(null);
  const swallowClick = useRef(false);

  const toggle = (name: string) => setSelected((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));

  function cancelPress() {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }

  function onPointerDown(e: PointerEvent, name: string) {
    if (e.pointerType === 'mouse') return;
    cancelPress();
    const p = { name, x: e.clientX, y: e.clientY, fired: false, timer: setTimeout(() => {
      p.fired = true;
      setSelecting(true);
      setSelected((cur) => (cur.includes(name) ? cur : [...cur, name]));
    }, HOLD_MS) };
    press.current = p;
  }

  function onPointerMove(e: PointerEvent) {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_PX) cancelPress();
  }

  function onPointerUp() {
    if (press.current?.fired) swallowClick.current = true;
    cancelPress();
  }

  function onClick(name: string) {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    if (selecting) toggle(name);
    else setOpened(name);
  }

  function done() {
    setSelecting(false);
    setSelected([]);
  }

  if (opened)
    return (
      <section>
        <h1>{opened}</h1>
        <div className="photo-big" role="img" aria-label={opened} />
        <button type="button" onClick={() => setOpened(null)}>
          Back to photos
        </button>
      </section>
    );

  return (
    <section>
      <h1>Shared photos</h1>
      <div className="photo-bar">
        {selecting ? (
          <>
            <p role="status">{selected.length === 1 ? '1 photo selected' : `${selected.length} photos selected`}</p>
            <button type="button" onClick={done}>
              Done
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setSelecting(true)}>
            Select
          </button>
        )}
      </div>
      <ul className="photo-grid" aria-label="Photos">
        {PHOTOS.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="photo-tile"
              aria-pressed={selecting ? selected.includes(name) : undefined}
              onPointerDown={(e) => onPointerDown(e, name)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => onClick(name)}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
