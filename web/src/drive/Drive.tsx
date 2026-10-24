import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';

type File = { id: number; name: string };
const START = ['Budget 2027.xlsx', 'Team photo.jpg', 'Minutes 14 October.docx', 'Floor plan.pdf', 'Holiday rota.xlsx', 'Logo final.png'];
const ACTIONS = ['Open', 'Duplicate', 'Delete'] as const;

export function Drive() {
  const [files, setFiles] = useState<File[]>(() => START.map((name, i) => ({ id: i + 1, name })));
  const [menu, setMenu] = useState<{ x: number; y: number; name: string } | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [status, setStatus] = useState('');
  const target = useRef<number | null>(null);
  const nextId = useRef(START.length + 1);
  const menuBox = useRef<HTMLDivElement>(null);
  const rowButtons = useRef(new Map<number, HTMLButtonElement>());
  const items = useRef<HTMLButtonElement[]>([]);

  function openMenu(e: MouseEvent<HTMLButtonElement>, f: File) {
    e.preventDefault();
    target.current = f.id;
    setPos(null);
    setMenu({ x: e.clientX, y: e.clientY, name: f.name });
  }

  function closeMenu(returnFocus: boolean) {
    const id = target.current;
    setMenu(null);
    if (returnFocus && id !== null) rowButtons.current.get(id)?.focus();
  }

  useLayoutEffect(() => {
    if (!menu || !menuBox.current) return;
    const { width, height } = menuBox.current.getBoundingClientRect();
    const left = menu.x + width > innerWidth ? Math.max(0, menu.x - width) : menu.x;
    const top = menu.y + height > innerHeight ? Math.max(0, menu.y - height) : menu.y;
    setPos({ left, top });
  }, [menu]);

  useEffect(() => {
    if (menu && pos) items.current[0]?.focus({ preventScroll: true });
  }, [menu, pos]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!menuBox.current?.contains(e.target as Node)) closeMenu(false);
    };
    const start = { x: scrollX, y: scrollY };
    const onScroll = (e: Event) => {
      if (e.target === document && scrollX === start.x && scrollY === start.y) return;
      closeMenu(false);
    };
    addEventListener('pointerdown', onDown, true);
    addEventListener('scroll', onScroll, true);
    return () => {
      removeEventListener('pointerdown', onDown, true);
      removeEventListener('scroll', onScroll, true);
    };
  }, [menu]);

  function onMenuKey(e: KeyboardEvent) {
    const i = items.current.indexOf(document.activeElement as HTMLButtonElement);
    const n = ACTIONS.length;
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (i + 1) % n;
    else if (e.key === 'ArrowUp') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') closeMenu(true);
    else if (e.key === 'Tab') closeMenu(false);
    else return;
    if (e.key !== 'Tab') e.preventDefault();
    if (next !== null) items.current[next]?.focus({ preventScroll: true });
  }

  function act(action: (typeof ACTIONS)[number]) {
    const id = target.current;
    const index = files.findIndex((f) => f.id === id);
    const file = files[index];
    if (!file) return;
    if (action === 'Open') {
      setStatus(`Opened ${file.name}.`);
      closeMenu(true);
    } else if (action === 'Duplicate') {
      const dot = file.name.lastIndexOf('.');
      const copy = { id: nextId.current++, name: `${file.name.slice(0, dot)} (copy)${file.name.slice(dot)}` };
      setFiles([...files.slice(0, index + 1), copy, ...files.slice(index + 1)]);
      setStatus(`Made ${copy.name}.`);
      closeMenu(true);
    } else {
      const rest = files.filter((f) => f.id !== id);
      setFiles(rest);
      setStatus(`Deleted ${file.name}.`);
      setMenu(null);
      const neighbour = rest[Math.min(index, rest.length - 1)];
      if (neighbour) requestAnimationFrame(() => rowButtons.current.get(neighbour.id)?.focus());
    }
  }

  return (
    <section>
      <h1>Shared drive</h1>
      <p>Right-click a file, or press Shift+F10 on it, for its actions.</p>
      <ul className="drive-list" aria-label="Files">
        {files.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="drive-file"
              ref={(el) => {
                if (el) rowButtons.current.set(f.id, el);
                else rowButtons.current.delete(f.id);
              }}
              aria-haspopup="menu"
              onContextMenu={(e) => openMenu(e, f)}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
      <p role="status">{status}</p>
      {menu && (
        <div
          ref={menuBox}
          role="menu"
          aria-label={`Actions for ${menu.name}`}
          className="drive-menu"
          style={pos ? { left: pos.left, top: pos.top } : { left: menu.x, top: menu.y, visibility: 'hidden' }}
          onKeyDown={onMenuKey}
        >
          {ACTIONS.map((a, i) => (
            <button
              key={a}
              type="button"
              role="menuitem"
              tabIndex={-1}
              ref={(el) => {
                if (el) items.current[i] = el;
              }}
              onClick={() => act(a)}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
