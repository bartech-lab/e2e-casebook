import { useEffect, useRef, useState, type PointerEvent } from 'react';

const PLANS = [
  { id: 'basic', name: 'Basic', price: '0 PLN', tip: 'One project and 100 MB of storage. No card needed.' },
  { id: 'team', name: 'Team', price: '49 PLN a month', tip: 'Up to 10 people, shared projects, and 50 GB of storage.' },
  { id: 'business', name: 'Business', price: '199 PLN a month', tip: 'Unlimited people, single sign-on, and a 99.9% uptime promise.' },
];
const SHOW_MS = 300;
const GRACE_MS = 100;

export function Plans() {
  const [open, setOpen] = useState<string | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = () => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
  };
  const show = (id: string, delay: number) => {
    clear();
    if (delay === 0) setOpen(id);
    else showTimer.current = setTimeout(() => setOpen(id), delay);
  };
  const hide = () => {
    clear();
    hideTimer.current = setTimeout(() => setOpen(null), GRACE_MS);
  };
  const stay = () => clearTimeout(hideTimer.current);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clear();
        setOpen(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clear();
    };
  }, []);

  const mouse = (e: PointerEvent) => e.pointerType === 'mouse';

  return (
    <section>
      <h1>Plans</h1>
      <ul className="plans">
        {PLANS.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> {p.price}{' '}
            <span className="tip-wrap">
              <button
                type="button"
                className="tip-button"
                aria-label={`About ${p.name}`}
                aria-describedby={`tip-${p.id}`}
                onPointerEnter={(e) => mouse(e) && show(p.id, SHOW_MS)}
                onPointerLeave={(e) => mouse(e) && hide()}
                onFocus={() => show(p.id, 0)}
                onBlur={() => hide()}
                onPointerUp={(e) => e.pointerType === 'touch' && setOpen((cur) => (cur === p.id ? null : p.id))}
              >
                i
              </button>
              <span role="tooltip" id={`tip-${p.id}`} className="tip" hidden={open !== p.id} onPointerEnter={stay} onPointerLeave={(e) => mouse(e) && hide()}>
                {p.tip}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
