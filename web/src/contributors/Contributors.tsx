import { useLayoutEffect, useRef, useState } from 'react';

const PEOPLE = [
  'Ola Nowak',
  'Bartholomew Wiśniewski-Zawadzki',
  'Tomasz Zieliński',
  'Maria Konopnicka-Lewandowska',
  'Ewa Lis',
  'Krzysztof Brzęczyszczykiewicz',
  'Iga Wójcik',
  'Aleksandra Szczepańska',
];

function Contributor({ name }: { name: string }) {
  const label = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  const [open, setOpen] = useState(false);
  const id = `full-${name.replace(/\W+/g, '-')}`;

  useLayoutEffect(() => {
    const el = label.current!;
    const measure = () => setCut(el.scrollWidth > el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li className="contributor">
      <a
        href={`#${id}`}
        aria-describedby={cut && open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <span ref={label} className="contributor-name">
          {name}
        </span>
      </a>
      {cut && open && (
        <span role="tooltip" id={id} className="contributor-tip">
          {name}
        </span>
      )}
    </li>
  );
}

export function Contributors() {
  return (
    <section>
      <h1>Contributors</h1>
      <ul className="contributors" aria-label="Contributors">
        {PEOPLE.map((p) => (
          <Contributor key={p} name={p} />
        ))}
      </ul>
    </section>
  );
}
