import { useEffect, useRef, useState, type CSSProperties } from 'react';

const SETTINGS = [
  ['history', 'Keep search history', 'We use your last 50 searches to suggest results. Nothing older is kept.'],
  ['location', 'Use my location', 'Only your city is stored, never the exact position.'],
  ['ads', 'Personalised ads', 'Ads are chosen from the categories you browse. Turning this off shows the same number of ads.'],
  ['mail', 'Product emails', 'At most one email a month about new features.'],
] as const;
const TOAST_MS = 5000;

export function PrivacySettings() {
  const [on, setOn] = useState<Record<string, boolean>>({ history: true, location: false, ads: true, mail: false });
  const [openHint, setOpenHint] = useState<string | null>(null);
  const toast = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const list = useRef<HTMLUListElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) document.getElementById(e.target.getAttribute('popovertarget')!)?.classList.toggle('privacy-hint-away', !e.isIntersecting);
      },
      { root: list.current },
    );
    list.current?.querySelectorAll('.privacy-hint-button').forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, []);

  function save() {
    clearTimeout(timer.current);
    if (!toast.current?.matches(':popover-open')) toast.current?.showPopover();
    timer.current = setTimeout(() => toast.current?.hidePopover(), TOAST_MS);
  }

  return (
    <section>
      <h1>Privacy settings</h1>
      <ul ref={list} className="privacy-list" aria-label="Settings">
        {SETTINGS.map(([id, label, hint]) => (
          <li key={id} className="privacy-card">
            <label>
              <input type="checkbox" checked={on[id]} onChange={(e) => setOn({ ...on, [id]: e.target.checked })} /> {label}
            </label>
            <button
              type="button"
              className="privacy-hint-button"
              popoverTarget={`hint-${id}`}
              aria-label={`About ${label}`}
              aria-expanded={openHint === id}
              style={{ anchorName: `--hint-${id}` } as CSSProperties}
            >
              ?
            </button>
            <div
              id={`hint-${id}`}
              popover="auto"
              className="privacy-hint"
              style={{ positionAnchor: `--hint-${id}` } as CSSProperties}
              onToggle={(e) => {
                const open = (e.nativeEvent as ToggleEvent).newState === 'open';
                setOpenHint((cur) => (open ? id : cur === id ? null : cur));
              }}
            >
              {hint}
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={save}>
        Save settings
      </button>
      <div ref={toast} popover="manual" role="status" className="privacy-toast">
        Settings saved.
      </div>
    </section>
  );
}
