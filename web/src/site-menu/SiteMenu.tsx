import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const QUERY = '(max-width: 639px)';
const SECTIONS: [string, string][] = [
  ['Home', 'Fresh bread every morning from 7:00.'],
  ['Hours', 'Monday to Saturday, 7:00 to 18:00.'],
  ['Order', 'Order a cake two days ahead.'],
  ['Contact', 'Call 22 555 01 23.'],
];

export function SiteMenu() {
  const [narrow, setNarrow] = useState(() => matchMedia(QUERY).matches);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('Home');
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = matchMedia(QUERY);
    const change = () => {
      setNarrow(mq.matches);
      setOpen(false);
    };
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !open) return;
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <section>
      <h1>Bakery</h1>
      <header className={narrow ? 'site-bar narrow' : 'site-bar'} onKeyDown={onKey}>
        <strong>Corner Bakery</strong>
        {narrow && (
          <button ref={toggle} type="button" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>
            Menu
          </button>
        )}
        <nav aria-label="Bakery">
          <ul id="site-links" className={narrow && !open ? 'site-links closed' : 'site-links'}>
            {SECTIONS.map(([name]) => (
              <li key={name}>
                <a
                  href={`#${name.toLowerCase()}`}
                  aria-current={name === current ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrent(name);
                    setOpen(false);
                  }}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <h2>{current}</h2>
      <p>{SECTIONS.find(([name]) => name === current)![1]}</p>
      <div className="site-filler" />
    </section>
  );
}
