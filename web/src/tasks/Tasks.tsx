import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

type Task = { id: number; title: string; done: boolean };
type Command = { label: string; run: () => void };

const START: Task[] = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Call the bank', done: true },
  { id: 3, title: 'Book the dentist', done: false },
];

function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function Tasks() {
  const [tasks, setTasks] = useState(START);
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const commands: Command[] = [
    { label: 'New task', run: () => input.current?.focus() },
    { label: 'Mark all done', run: () => setTasks((t) => t.map((x) => ({ ...x, done: true }))) },
    { label: 'Clear done tasks', run: () => setTasks((t) => t.filter((x) => !x.done)) },
  ];
  const matches = commands.filter((c) => c.label.toLowerCase().includes(filter.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        returnTo.current = document.activeElement as HTMLElement | null;
        setFilter('');
        setActive(0);
        setOpen(true);
        return;
      }
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    returnTo.current?.focus();
  }

  function run(c: Command | undefined) {
    if (!c) return;
    setOpen(false);
    setStatus(`Ran “${c.label}”.`);
    if (c.label === 'New task') c.run();
    else {
      c.run();
      returnTo.current?.focus();
    }
  }

  function onPaletteKey(e: KeyboardEvent) {
    if (e.key === 'Escape') return close();
    if (e.key === 'Enter') return run(matches[active]);
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!matches.length) return;
    setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length);
  }

  function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((t) => [...t, { id: Date.now(), title: title.trim(), done: false }]);
    setTitle('');
  }

  return (
    <section>
      <h1>Tasks</h1>
      <p>Press Ctrl+K (⌘K on a Mac) for commands, or N for a new task.</p>
      <form onSubmit={add}>
        <label htmlFor="task-title">New task</label> <input id="task-title" ref={input} value={title} onChange={(e) => setTitle(e.target.value)} />{' '}
        <button type="submit">Add</button>
      </form>
      <ul aria-label="Tasks">
        {tasks.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} /> {t.title}
            </label>
          </li>
        ))}
      </ul>
      <p role="status">{status}</p>
      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Commands" onClick={(e) => e.stopPropagation()} onKeyDown={onPaletteKey}>
            <input
              ref={search}
              role="combobox"
              aria-label="Search commands"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={matches[active] ? `command-${active}` : undefined}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setActive(0);
              }}
            />
            <ul id="command-list" role="listbox" aria-label="Commands">
              {matches.map((c, i) => (
                <li key={c.label} id={`command-${i}`} role="option" aria-selected={i === active} onClick={() => run(c)}>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
