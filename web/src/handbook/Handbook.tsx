import { useState } from 'react';

const SECTIONS = [
  { id: 'start', title: 'Getting started', pages: ['Your first day', 'Who is who', 'Office map'] },
  { id: 'leave', title: 'Leave', pages: ['Holidays', 'Sick leave', 'Parental leave'] },
  { id: 'expenses', title: 'Expenses', pages: ['Travel', 'Equipment', 'Meals'] },
  { id: 'it', title: 'IT help', pages: ['Laptop setup', 'Passwords', 'Printers'] },
];

export function Handbook() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="handbook">
      <h1>Handbook</h1>
      <nav aria-label="Handbook sections">
        {SECTIONS.map((s) => {
          const expanded = open.has(s.id);
          return (
            <div key={s.id}>
              <button type="button" className="hb-toggle" aria-expanded={expanded} aria-controls={`hb-${s.id}`} onClick={() => toggle(s.id)}>
                {s.title}
              </button>
              <ul id={`hb-${s.id}`} hidden={!expanded}>
                {s.pages.map((p) => (
                  <li key={p}>
                    <a href={`#${s.id}-${p.toLowerCase().replace(/\s+/g, '-')}`}>{p}</a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </section>
  );
}
