import { useEffect, useRef, useState, type MouseEvent } from 'react';

const SECTIONS = [
  ['welcome', 'Welcome', 'Your first week starts with a tour of the office and a coffee with your team.'],
  ['hours', 'Working hours', 'Core hours are 10:00 to 15:00. Outside them, plan your day as you like.'],
  ['leave', 'Leave', 'You have 26 days of paid leave a year. Ask your lead at least two weeks ahead.'],
  ['equipment', 'Equipment', 'Pick a laptop on your first day. Return it when you leave the company.'],
  ['expenses', 'Expenses', 'Keep every receipt. Claims are paid with the next salary.'],
  ['security', 'Security', 'Lock your screen when you step away. Report a lost badge the same day.'],
] as const;

export function StaffGuide() {
  const [current, setCurrent] = useState<string>(SECTIONS[0][0]);
  const contents = useRef<HTMLElement>(null);
  const jumping = useRef(false);

  useEffect(() => {
    const spy = () => {
      if (jumping.current) return;
      const line = (contents.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let found: string = SECTIONS[0][0];
      for (const [id] of SECTIONS) if (document.getElementById(id)!.getBoundingClientRect().top <= line) found = id;
      setCurrent(found);
    };
    const id = location.hash.slice(1);
    if (SECTIONS.some(([s]) => s === id)) document.getElementById(id)!.scrollIntoView();
    spy();
    addEventListener('scroll', spy, { passive: true });
    return () => removeEventListener('scroll', spy);
  }, []);

  function jump(e: MouseEvent, id: string) {
    e.preventDefault();
    const section = document.getElementById(id)!;
    const finish = () => {
      jumping.current = false;
      section.querySelector('h2')!.focus({ preventScroll: true });
    };
    setCurrent(id);
    history.replaceState(history.state, '', `#${id}`);
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const target = Math.min(max, Math.max(0, scrollY + section.getBoundingClientRect().top - margin));
    if (Math.abs(target - scrollY) < 1) return finish();
    jumping.current = true;
    addEventListener('scrollend', finish, { once: true });
    section.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="staff-guide">
      <h1>Staff guide</h1>
      <nav aria-label="Contents" ref={contents}>
        {SECTIONS.map(([id, title]) => (
          <a key={id} href={`#${id}`} aria-current={current === id ? 'location' : undefined} onClick={(e) => jump(e, id)}>
            {title}
          </a>
        ))}
      </nav>
      {SECTIONS.map(([id, title, text]) => (
        <section key={id} id={id} className="guide-section" aria-labelledby={`${id}-title`}>
          <h2 id={`${id}-title`} tabIndex={-1}>
            {title}
          </h2>
          <p>{text}</p>
        </section>
      ))}
    </section>
  );
}
