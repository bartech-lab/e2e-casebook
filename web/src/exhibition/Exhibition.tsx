import { useEffect, useRef, useState } from 'react';

const PAINTINGS = ['Harbour at dawn', 'Rye field', 'Old mill', 'Winter market', 'Blue door', 'Night train'];

function fromUrl(): number | null {
  const n = Number(new URLSearchParams(location.search).get('painting'));
  return Number.isInteger(n) && n >= 1 && n <= PAINTINGS.length ? n : null;
}

function urlWith(n: number | null) {
  const url = new URL(location.href);
  if (n === null) url.searchParams.delete('painting');
  else url.searchParams.set('painting', String(n));
  return url;
}

export function Exhibition() {
  const [open, setOpen] = useState<number | null>(fromUrl);
  const pushed = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const last = useRef<number | null>(open);

  useEffect(() => {
    const onPop = () => {
      const n = fromUrl();
      if (n === null) pushed.current = false;
      setOpen(n);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) {
      d.close();
      if (last.current !== null) document.querySelectorAll<HTMLButtonElement>('.exhibition-grid button')[last.current - 1]?.focus();
    }
    if (open !== null) last.current = open;
  }, [open]);

  function show(n: number) {
    history.pushState(history.state, '', urlWith(n));
    pushed.current = true;
    setOpen(n);
  }

  function close() {
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(history.state, '', urlWith(null));
      setOpen(null);
    }
  }

  return (
    <section className="exhibition">
      <h1>Exhibition</h1>
      <ul className="exhibition-grid">
        {PAINTINGS.map((title, i) => (
          <li key={title}>
            <button type="button" onClick={() => show(i + 1)}>
              {title}
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        aria-labelledby="painting-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <h2 id="painting-title">{open ? PAINTINGS[open - 1] : ''}</h2>
        <p>Oil on canvas. Room {open ?? ''}.</p>
        <button type="button" onClick={close}>
          Close
        </button>
      </dialog>
    </section>
  );
}
