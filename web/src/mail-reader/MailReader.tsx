import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const MIN = 20;
const MAX = 60;
const DEFAULT = 35;
const STEP = 5;
const MESSAGES = [
  { from: 'Ola', subject: 'Tickets for Saturday', body: 'I bought two tickets for the 19:00 show. Shall we meet at the fountain at 18:30?' },
  { from: 'Bank', subject: 'Your October statement', body: 'Your statement for October is ready. Sign in to read it.' },
  { from: 'Marek', subject: 'Lunch on Friday?', body: 'There is a new pierogi place near the office. Friday at 13:00?' },
  { from: 'Courier', subject: 'Parcel arrives tomorrow', body: 'Your parcel will arrive between 10:00 and 14:00.' },
];
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v)));

export function MailReader({ sandbox }: { sandbox: string }) {
  const key = `mail-split-${sandbox}`;
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(key));
    return saved >= MIN && saved <= MAX ? saved : DEFAULT;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    localStorage.setItem(key, String(width));
  }, [key, width]);

  const percentAt = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * 100;
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    setCollapsed(false);
    setWidth(clamp(percentAt(e.clientX)));
  }
  function onPointerUp() {
    dragging.current = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => setWidth((w) => clamp(w - STEP)),
      ArrowRight: () => setWidth((w) => clamp(w + STEP)),
      Home: () => setWidth(MIN),
      End: () => setWidth(MAX),
      Enter: () => setCollapsed((c) => !c),
    };
    const act = actions[e.key];
    if (!act) return;
    e.preventDefault();
    if (e.key !== 'Enter') setCollapsed(false);
    act();
  }

  const shown = collapsed ? 0 : width;
  const message = MESSAGES[open]!;
  return (
    <section>
      <h1>Mail reader</h1>
      <div className="split" ref={box}>
        <ul id="mail-list" className="split-list" aria-label="Messages" style={{ width: `${shown}%` }} hidden={collapsed}>
          {MESSAGES.map((m, i) => (
            <li key={m.subject}>
              <button type="button" aria-current={i === open ? 'true' : undefined} onClick={() => setOpen(i)}>
                <strong>{m.from}</strong> {m.subject}
              </button>
            </li>
          ))}
        </ul>
        <div
          className="split-divider"
          role="separator"
          tabIndex={0}
          aria-label="Resize the message list"
          aria-controls="mail-list"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={MAX}
          aria-valuenow={shown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => {
            setCollapsed(false);
            setWidth(DEFAULT);
          }}
          onKeyDown={onKeyDown}
        />
        <article className="split-message" aria-label="Message">
          <h2>{message.subject}</h2>
          <p>From {message.from}</p>
          <p>{message.body}</p>
        </article>
      </div>
    </section>
  );
}
