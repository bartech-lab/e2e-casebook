import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const SIZES = Array.from({ length: 11 }, (_, i) => 36 + i);
const DRAG_PX = 4;

export function ShoeSize() {
  const [size, setSize] = useState(42);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(42);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  function close(pick?: number, refocus = true) {
    setOpen(false);
    press.current = null;
    if (pick !== undefined) setSize(pick);
    if (refocus) button.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > DRAG_PX) p.moved = true;
    };
    const up = (e: PointerEvent) => {
      const p = press.current;
      if (!p || list.current?.contains(e.target as Node)) return;
      if (p.moved) close();
      else press.current = null;
    };
    const down = (e: PointerEvent) => {
      if (list.current?.contains(e.target as Node) || button.current?.contains(e.target as Node)) return;
      close(undefined, false);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointerdown', down);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointerdown', down);
    };
  }, [open]);

  function openList() {
    setActive(size);
    setOpen(true);
  }

  function pickUp(n: number) {
    const p = press.current;
    if (p && !p.moved) {
      press.current = null;
      return;
    }
    close(n);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const i = SIZES.indexOf(active);
    if (e.key === 'ArrowDown') setActive(SIZES[Math.min(i + 1, SIZES.length - 1)]!);
    else if (e.key === 'ArrowUp') setActive(SIZES[Math.max(i - 1, 0)]!);
    else if (e.key === 'Home') setActive(SIZES[0]!);
    else if (e.key === 'End') setActive(SIZES[SIZES.length - 1]!);
    else if (e.key === 'Enter' || e.key === ' ') close(active);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') {
      close(undefined, false);
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <section>
      <h1>Shoe size</h1>
      <p>Pick your EU shoe size for the fitting.</p>
      <span id="shoe-size-label">Shoe size</span>{' '}
      <div className="size-select">
        <button
          ref={button}
          type="button"
          role="combobox"
          aria-labelledby="shoe-size-label"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="shoe-size-list"
          aria-activedescendant={open ? `shoe-size-${active}` : undefined}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            button.current?.focus();
            if (open) return close();
            press.current = { x: e.clientX, y: e.clientY, moved: false };
            openList();
          }}
          onKeyDown={onKeyDown}
        >
          EU {size}
        </button>
        {open && (
          <ul ref={list} id="shoe-size-list" role="listbox" aria-labelledby="shoe-size-label" className="size-list">
            {SIZES.map((n) => (
              <li
                key={n}
                id={`shoe-size-${n}`}
                role="option"
                aria-selected={n === size}
                className={n === active ? 'active' : undefined}
                onPointerEnter={() => setActive(n)}
                onPointerUp={() => pickUp(n)}
              >
                EU {n}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p role="status">Fitting booked for size {size}.</p>
    </section>
  );
}
