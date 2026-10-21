import { useState } from 'react';

type Note = { id: number; title: string; starred: boolean; archived: boolean };

const INITIAL: Note[] = ['Shopping list', 'Trip ideas', 'Book notes', 'Meeting agenda', 'Gift ideas'].map((title, i) => ({
  id: i + 1,
  title,
  starred: false,
  archived: false,
}));

export function Notes() {
  const [notes, setNotes] = useState(INITIAL);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  function apply(change: (n: Note) => Note | null) {
    setNotes((ns) => ns.flatMap((n) => (selected.has(n.id) ? [change(n)].filter((c) => c !== null) : [n])));
    setSelected(new Set());
  }
  const star = () => apply((n) => ({ ...n, starred: !n.starred }));
  const archive = () => apply((n) => ({ ...n, archived: true }));
  const remove = () => apply(() => null);

  const toolbar = [
    { label: 'Star', run: star },
    { label: 'Archive', run: archive },
    { label: 'Delete', run: remove },
  ];
  const more = [
    { label: 'Archive', run: archive },
    { label: 'Delete', run: remove },
  ];

  function toggle(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const list = (archived: boolean) => notes.filter((n) => n.archived === archived);

  return (
    <section>
      <h1>Notes</h1>
      <div role="toolbar" aria-label="Actions">
        <span className="strip">
          {toolbar.map((a, i) => (
            <button key={a.label} type="button" tabIndex={i > 0 ? -1 : undefined} onClick={a.run}>
              {a.label}
            </button>
          ))}
        </span>
        <span className="more">
          <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            More
          </button>
          {menuOpen && (
            <ul role="menu" aria-label="More actions">
              {more.map((a) => (
                <li key={a.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      a.run();
                    }}
                  >
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>
      </div>
      <ul aria-label="Notes">
        {list(false).map((n) => (
          <li key={n.id}>
            <label>
              <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggle(n.id)} /> {n.title}
            </label>
            {n.starred && <span>Starred</span>}
          </li>
        ))}
      </ul>
      <h2>Archive</h2>
      <ul aria-label="Archive">
        {list(true).map((n) => (
          <li key={n.id}>{n.title}</li>
        ))}
      </ul>
    </section>
  );
}
