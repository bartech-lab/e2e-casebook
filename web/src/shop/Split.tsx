import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';
import { Link } from '../router.tsx';
import { pln } from './Shop.tsx';

type SplitResult = { order: number; total: number; people: number; shares: number[] };

const PEOPLE = [2, 3, 4, 5, 6, 7, 8];

function PeoplePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setActive(value);
    list.current?.focus();
    const outside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open, value]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const choose = (n: number) => {
    close();
    onChange(n);
  };

  return (
    <div ref={root} className="picker">
      <span id="people-label">People</span>{' '}
      <button
        ref={button}
        id="people-value"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="people-label people-value"
        onMouseDown={() => setOpen(true)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {value}
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label="People"
          tabIndex={-1}
          aria-activedescendant={`people-${active}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, PEOPLE[PEOPLE.length - 1]!));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, PEOPLE[0]!));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              choose(active);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              close();
            }
          }}
        >
          {PEOPLE.map((n) => (
            <li key={n} id={`people-${n}`} role="option" aria-selected={n === value} className={n === active ? 'active' : undefined} onClick={() => choose(n)}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Split({ sandbox, order }: { sandbox: string; order: number }) {
  const [people, setPeople] = useState(2);
  const split = useQuery({
    queryKey: ['split', sandbox, order, people],
    queryFn: async () => json<SplitResult>(await fetch(`/api/s/${sandbox}/orders/${order}/split?people=${people}`)),
  });

  return (
    <section>
      <h1>Split order #{order}</h1>
      <PeoplePicker value={people} onChange={setPeople} />
      {split.isError ? (
        <p role="alert">Could not split the order: {split.error.message}</p>
      ) : !split.data ? (
        <p>Splitting…</p>
      ) : (
        <>
          <p>Order total: {pln(split.data.total)}</p>
          <ol aria-label="Shares">
            {split.data.shares.map((share, i) => (
              <li key={i}>
                Person {i + 1}: {pln(share)}
              </li>
            ))}
          </ol>
        </>
      )}
      <Link href={`/s/${sandbox}/shop`}>Back to the shop</Link>
    </section>
  );
}
