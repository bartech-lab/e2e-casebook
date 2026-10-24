import { useEffect, useRef, useState } from 'react';

type Banner = { id: string; text: string };

const BANNERS: Banner[] = [
  { id: 'maintenance', text: 'Planned maintenance on Sunday from 02:00 to 04:00.' },
  { id: 'prices', text: 'New prices apply from 1 December.' },
  { id: 'app', text: 'Our mobile app is now available.' },
];

export function Announcements({ sandbox }: { sandbox: string }) {
  const key = `dismissed:${sandbox}`;
  const [dismissed, setDismissed] = useState<string[]>(() => JSON.parse(localStorage.getItem(key) ?? '[]') as string[]);
  const [leaving, setLeaving] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<string | null | undefined>(undefined);

  const shown = BANNERS.filter((b) => !dismissed.includes(b.id));

  useEffect(() => {
    if (focusNext.current === undefined) return;
    const next = focusNext.current;
    focusNext.current = undefined;
    if (next) document.querySelector<HTMLButtonElement>(`[data-dismiss="${next}"]`)?.focus();
    else heading.current?.focus();
  }, [dismissed]);

  function remove(id: string) {
    const i = shown.findIndex((b) => b.id === id);
    focusNext.current = shown[i + 1]?.id ?? shown[i - 1]?.id ?? null;
    const next = [...dismissed, id];
    localStorage.setItem(key, JSON.stringify(next));
    setLeaving(null);
    setDismissed(next);
  }

  function dismiss(id: string) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return remove(id);
    setLeaving(id);
  }

  return (
    <section>
      <h1 ref={heading} tabIndex={-1}>
        Announcements
      </h1>
      <p>{shown.length === 1 ? '1 announcement' : `${shown.length} announcements`}</p>
      {shown.map((b) => (
        <div
          key={b.id}
          role="region"
          aria-label={b.text}
          className={`banner${leaving === b.id ? ' leaving' : ''}`}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === 'opacity' && leaving === b.id) remove(b.id);
          }}
        >
          <p>{b.text}</p>
          <button type="button" data-dismiss={b.id} aria-label={`Dismiss: ${b.text}`} onClick={() => dismiss(b.id)} disabled={leaving === b.id}>
            Dismiss
          </button>
        </div>
      ))}
    </section>
  );
}
