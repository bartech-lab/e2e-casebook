import { useRef, useState, type PointerEvent } from 'react';

type Message = { id: string; from: string; subject: string };
const MESSAGES: Message[] = [
  ['Ola', 'Tickets for Saturday'],
  ['Bank', 'Your October statement'],
  ['Marek', 'Lunch on Friday?'],
  ['Courier', 'Parcel arrives tomorrow'],
  ['Ania', 'Photos from the trip'],
  ['Landlord', 'Water off on Monday'],
  ['Gym', 'New class times'],
  ['Kasia', 'Book club notes'],
  ['Airline', 'Check-in is open'],
  ['Piotr', 'Bike for sale'],
  ['School', 'Parents evening'],
  ['Library', 'Your book is due'],
].map(([from, subject], i) => ({ id: `m${i + 1}`, from: from!, subject: subject! }));
const THRESHOLD = 0.4;
const LOCK_PX = 10;
const UNDO_MS = 5000;

type Drag = { id: string; x: number; y: number; dx: number; axis: 'x' | 'y' | null; width: number };

export function MobileInbox() {
  const [items, setItems] = useState(MESSAGES);
  const [undo, setUndo] = useState<{ item: Message; index: number } | null>(null);
  const [offset, setOffset] = useState<{ id: string; dx: number } | null>(null);
  const drag = useRef<Drag | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function remove(id: string) {
    const index = items.findIndex((m) => m.id === id);
    if (index < 0) return;
    setUndo({ item: items[index]!, index });
    setItems(items.filter((m) => m.id !== id));
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
  }

  function restore() {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    setItems((cur) => [...cur.slice(0, undo.index), undo.item, ...cur.slice(undo.index)]);
    setUndo(null);
  }

  const down = (id: string) => (e: PointerEvent<HTMLLIElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { id, x: e.clientX, y: e.clientY, dx: 0, axis: null, width: e.currentTarget.offsetWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.axis === null && (Math.abs(dx) > LOCK_PX || Math.abs(dy) > LOCK_PX)) d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (d.axis !== 'x') return;
    d.dx = Math.min(0, dx);
    setOffset({ id: d.id, dx: d.dx });
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    setOffset(null);
    if (d && d.axis === 'x' && -d.dx > d.width * THRESHOLD) remove(d.id);
  };
  const cancel = () => {
    drag.current = null;
    setOffset(null);
  };

  return (
    <section>
      <h1>Mobile inbox</h1>
      <p>Swipe a message to the left to delete it.</p>
      <ul className="swipe-list" aria-label="Messages">
        {items.map((m) => (
          <li
            key={m.id}
            className="swipe-row"
            style={offset?.id === m.id ? { transform: `translateX(${offset.dx}px)` } : undefined}
            onPointerDown={down(m.id)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
          >
            <span>
              <strong>{m.from}</strong> {m.subject}
            </span>
            <button type="button" className="swipe-delete" aria-label={`Delete message from ${m.from}`} onClick={() => remove(m.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div role="status">
        {undo && (
          <>
            Message deleted.{' '}
            <button type="button" onClick={restore}>
              Undo
            </button>
          </>
        )}
      </div>
    </section>
  );
}
