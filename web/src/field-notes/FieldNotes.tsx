import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'saving' | 'saved' | 'full' | 'unavailable';
const DELAY_MS = 400;

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    s.getItem('field-notes-probe');
    return s;
  } catch {
    return null;
  }
}

export function FieldNotes({ sandbox }: { sandbox: string }) {
  const key = `field-notes-${sandbox}`;
  const store = useRef(storage());
  const [text, setText] = useState(() => store.current?.getItem(key) ?? '');
  const [status, setStatus] = useState<Status>(store.current ? 'idle' : 'unavailable');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function save(value: string) {
    const s = store.current;
    if (!s) return setStatus('unavailable');
    try {
      s.setItem(key, value);
      setStatus('saved');
    } catch {
      setStatus('full');
    }
  }

  function onChange(value: string) {
    setText(value);
    if (!store.current) return;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), DELAY_MS);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const message: Record<Status, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved in this browser.',
    full: "This browser's storage is full, so your latest changes are not saved here. Copy them somewhere safe or free some space, then press Save again.",
    unavailable: 'Notes cannot be kept in this browser, so they will be lost when you leave the page.',
  };

  return (
    <section>
      <h1>Field notes</h1>
      <label htmlFor="field-notes-text">Notes</label>
      <textarea id="field-notes-text" rows={10} value={text} onChange={(e) => onChange(e.target.value)} />
      <p role="status" className={status === 'full' || status === 'unavailable' ? 'notes-warning' : undefined}>
        {message[status]}
      </p>
      {status === 'full' && (
        <button type="button" onClick={() => save(text)}>
          Save again
        </button>
      )}
    </section>
  );
}
