import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

type Person = { id: number; name: string };
type Open = { start: number; query: string; active: number };

const PEOPLE: Person[] = [
  { id: 1, name: 'Ola Nowak' },
  { id: 2, name: 'Łukasz Wiśniewski' },
  { id: 3, name: 'Marek Olszewski' },
  { id: 4, name: 'Anna Łęcka' },
  { id: 5, name: 'Piotr Zieliński' },
];

export const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

const matches = (query: string) => PEOPLE.filter((p) => p.name.split(' ').some((part) => fold(part).startsWith(fold(query))));

export function Handover({ sandbox }: { sandbox: string }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState<Open | null>(null);
  const [chosen, setChosen] = useState<Person[]>([]);
  const [status, setStatus] = useState('');
  const box = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const dismissedAt = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caret.current === null || !box.current) return;
    box.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  function look(value: string, at: number) {
    const m = /(^|\s)@([\p{L}]*)$/u.exec(value.slice(0, at));
    if (!m) {
      dismissedAt.current = null;
      return setOpen(null);
    }
    const start = m.index + m[1]!.length;
    if (dismissedAt.current === start || matches(m[2]!).length === 0) return setOpen(null);
    setOpen((cur) => ({ start, query: m[2]!, active: cur && cur.start === start && cur.query === m[2] ? cur.active : 0 }));
  }

  function choose(person: Person) {
    if (!open || !box.current) return;
    const at = box.current.selectionStart;
    const insert = `@${person.name} `;
    setText(text.slice(0, open.start) + insert + text.slice(at));
    caret.current = open.start + insert.length;
    setChosen((cur) => (cur.some((p) => p.id === person.id) ? cur : [...cur, person]));
    setOpen(null);
  }

  const options = open ? matches(open.query) : [];

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setOpen({ ...open, active: (open.active + step + options.length) % options.length });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      choose(options[open.active]!);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dismissedAt.current = open.start;
      setOpen(null);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const mentions = chosen.filter((p) => text.includes(`@${p.name}`)).map((p) => p.id);
    const res = await fetch(`/api/s/${sandbox}/handover`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, mentions }),
    });
    if (!res.ok) return setStatus('Could not send. Try again.');
    setText('');
    setChosen([]);
    setStatus('Handover sent.');
  }

  return (
    <section>
      <h1>Shift handover</h1>
      <form onSubmit={(e) => void send(e)}>
        <label htmlFor="handover-text">Note for the next shift</label>
        <textarea
          id="handover-text"
          ref={box}
          rows={5}
          cols={60}
          value={text}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open !== null}
          aria-controls="handover-people"
          aria-activedescendant={open ? `person-${options[open.active]!.id}` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            look(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onSelect={(e) => look(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => setOpen(null)}
        />
        {open && (
          <ul id="handover-people" role="listbox" aria-label="People" className="mention-list">
            {options.map((p, i) => (
              <li
                key={p.id}
                id={`person-${p.id}`}
                role="option"
                aria-selected={i === open.active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(p);
                }}
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
        <p>
          <button type="submit">Send handover</button>
        </p>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
