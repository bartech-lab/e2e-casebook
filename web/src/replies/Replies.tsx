import { useEffect, useRef, useState } from 'react';

type Thread = { id: string; from: string; text: string };
const THREADS: Thread[] = [
  { id: 't1', from: 'Anna Kowalska', text: 'Where is my order? It was due on Monday.' },
  { id: 't2', from: 'Marek Nowak', text: 'Can I change the delivery address?' },
  { id: 't3', from: 'Ewa Wiśniewska', text: 'The lamp arrived broken.' },
  { id: 't4', from: 'Piotr Zieliński', text: 'Do you ship to Norway?' },
  { id: 't5', from: 'Kasia Lewandowska', text: 'I was charged twice.' },
];
const SAVE_MS = 500;

export function Replies({ sandbox }: { sandbox: string }) {
  const prefix = `replies-${sandbox}-`;
  const draftKey = (id: string) => `${prefix}draft-${id}`;
  const read = <T,>(key: string, fallback: T): T => JSON.parse(localStorage.getItem(prefix + key) ?? 'null') ?? fallback;
  const write = (key: string, value: unknown) => localStorage.setItem(prefix + key, JSON.stringify(value));

  const [archived, setArchived] = useState<string[]>(() => read('archived', []));
  const [sent, setSent] = useState<Record<string, string[]>>(() => read('sent', {}));
  const threads = THREADS.filter((t) => !archived.includes(t.id));
  const [open, setOpen] = useState(threads[0]?.id ?? null);
  const [text, setText] = useState(() => (open ? (localStorage.getItem(draftKey(open)) ?? '') : ''));
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const pending = useRef<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refreshDrafts = () => setDrafts(Object.fromEntries(THREADS.map((t) => [t.id, (localStorage.getItem(draftKey(t.id)) ?? '').trim() !== ''])));

  function store(id: string, value: string) {
    if (value === '') localStorage.removeItem(draftKey(id));
    else localStorage.setItem(draftKey(id), value);
    refreshDrafts();
  }

  function flush() {
    clearTimeout(timer.current);
    if (pending.current) store(pending.current.id, pending.current.text);
    pending.current = null;
  }

  useEffect(() => {
    for (const id of read<string[]>('archived', [])) localStorage.removeItem(draftKey(id));
    refreshDrafts();
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(prefix)) refreshDrafts();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('storage', onStorage);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function edit(value: string) {
    setText(value);
    if (!open) return;
    pending.current = { id: open, text: value };
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_MS);
  }

  function show(id: string) {
    flush();
    setOpen(id);
    setText(localStorage.getItem(draftKey(id)) ?? '');
  }

  function send() {
    if (!open || !text.trim()) return;
    clearTimeout(timer.current);
    pending.current = null;
    const next = { ...sent, [open]: [...(sent[open] ?? []), text.trim()] };
    setSent(next);
    write('sent', next);
    store(open, '');
    setText('');
  }

  function archive() {
    if (!open) return;
    clearTimeout(timer.current);
    pending.current = null;
    const next = [...archived, open];
    setArchived(next);
    write('archived', next);
    localStorage.removeItem(draftKey(open));
    refreshDrafts();
    const rest = THREADS.filter((t) => !next.includes(t.id));
    setOpen(rest[0]?.id ?? null);
    setText(rest[0] ? (localStorage.getItem(draftKey(rest[0].id)) ?? '') : '');
  }

  const thread = THREADS.find((t) => t.id === open);
  return (
    <section>
      <h1>Replies</h1>
      <div className="replies">
        <ul aria-label="Conversations">
          {threads.map((t) => (
            <li key={t.id}>
              <button type="button" aria-current={t.id === open ? 'true' : undefined} onClick={() => show(t.id)}>
                {t.from}
              </button>
              {drafts[t.id] && <span className="draft-mark"> Draft</span>}
            </li>
          ))}
        </ul>
        {thread ? (
          <article aria-label={`Conversation with ${thread.from}`}>
            <h2>{thread.from}</h2>
            <p>{thread.text}</p>
            <ul aria-label="Sent replies">
              {(sent[thread.id] ?? []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <label>
              Reply
              <textarea rows={4} cols={50} value={text} onChange={(e) => edit(e.target.value)} />
            </label>
            <div>
              <button type="button" onClick={send} disabled={!text.trim()}>
                Send
              </button>{' '}
              <button type="button" onClick={archive}>
                Archive
              </button>
            </div>
          </article>
        ) : (
          <p>No conversations left.</p>
        )}
      </div>
    </section>
  );
}
