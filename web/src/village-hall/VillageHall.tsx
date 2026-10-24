import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Item = { id: string; q: string; a: ReactNode };
const ITEMS: Item[] = [
  { id: 'faq-booking', q: 'How do I book the hall?', a: <>Write to the warden at least two weeks ahead. Bookings are confirmed by email within three days.</> },
  { id: 'faq-price', q: 'What does it cost?', a: <>The main room is 80 PLN an hour and the kitchen 30 PLN an hour. Charities pay half. See also <a href="#faq-deposit">the deposit</a>.</> },
  { id: 'faq-deposit', q: 'Is there a deposit?', a: <>Yes, 300 PLN, returned within a week if the hall is left as you found it.</> },
  { id: 'faq-dogs', q: 'Can I bring a dog?', a: <>Dogs on a lead are welcome in the garden, but not inside the hall.</> },
  { id: 'faq-parking', q: 'Where can guests park?', a: <>There are twelve spaces behind the hall. Overflow parking is at the church on Lipowa Street.</> },
  { id: 'faq-music', q: 'Until when can we play music?', a: <>Amplified music must stop at 22:00 on weekdays and at 23:00 on Fridays and Saturdays. See also <a href="#faq-parking">parking</a>.</> },
];

function Answer({ id, open, onFound, children }: { id: string; open: boolean; onFound: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current!;
    if (open) el.removeAttribute('hidden');
    else el.setAttribute('hidden', 'until-found');
  }, [open]);
  useEffect(() => {
    const el = box.current!;
    el.addEventListener('beforematch', onFound);
    return () => el.removeEventListener('beforematch', onFound);
  }, [onFound]);
  return (
    <div ref={box} id={id} className="faq-answer" role="region" aria-labelledby={`${id}-q`}>
      <p>{children}</p>
    </div>
  );
}

export function VillageHall() {
  const [open, setOpen] = useState<string[]>(() => ITEMS.filter((i) => `#${i.id}` === location.hash).map((i) => i.id));
  const toggle = (id: string) => setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const reveal = (id: string) => () => setOpen((cur) => (cur.includes(id) ? cur : [...cur, id]));
  const allOpen = open.length === ITEMS.length;

  return (
    <section>
      <h1>Village hall</h1>
      <p>Questions about booking the Zielona Wola village hall.</p>
      <button type="button" onClick={() => setOpen(allOpen ? [] : ITEMS.map((i) => i.id))}>
        {allOpen ? 'Collapse all' : 'Expand all'}
      </button>
      {ITEMS.map((i) => (
        <div key={i.id} className="faq-item">
          <h2>
            <button type="button" id={`${i.id}-q`} aria-expanded={open.includes(i.id)} aria-controls={i.id} onClick={() => toggle(i.id)}>
              {i.q}
            </button>
          </h2>
          <Answer id={i.id} open={open.includes(i.id)} onFound={reveal(i.id)}>
            {i.a}
          </Answer>
        </div>
      ))}
    </section>
  );
}
