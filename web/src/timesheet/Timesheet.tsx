import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLS = ['Project A', 'Project B', 'Total'];
const START = [
  [8, 0],
  [6, 2],
  [4, 4],
  [8, 0],
  [5, 1],
];

type Pos = { r: number; c: number };

export function Timesheet() {
  const [hours, setHours] = useState(START);
  const [active, setActive] = useState<Pos>({ r: 0, c: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const cells = useRef(new Map<string, HTMLTableCellElement>());
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    cells.current.get(`${active.r}-${active.c}`)?.focus();
  }, [active, editing]);

  const total = (r: number) => hours[r]![0]! + hours[r]![1]!;
  const value = (r: number, c: number) => (c === 2 ? total(r) : hours[r]![c]!);

  function go(r: number, c: number) {
    moved.current = true;
    setActive({ r: Math.max(0, Math.min(DAYS.length - 1, r)), c: Math.max(0, Math.min(COLS.length - 1, c)) });
  }

  function commit(move: boolean) {
    const n = Number(editing);
    if (editing === null) return;
    if (editing.trim() === '' || !Number.isInteger(n) || n < 0 || n > 24) return setError('Enter whole hours from 0 to 24.');
    setHours(hours.map((row, r) => (r === active.r ? row.map((h, c) => (c === active.c ? n : h)) : row)));
    setEditing(null);
    setError('');
    moved.current = true;
    if (move) go(active.r + 1, active.c);
  }

  function onKey(e: KeyboardEvent) {
    const { r, c } = active;
    if (editing !== null) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditing(null);
        setError('');
        moved.current = true;
      }
      return;
    }
    const editable = c < 2;
    const moves: Record<string, Pos> = {
      ArrowUp: { r: r - 1, c },
      ArrowDown: { r: r + 1, c },
      ArrowLeft: { r, c: c - 1 },
      ArrowRight: { r, c: c + 1 },
      Home: e.ctrlKey ? { r: 0, c: 0 } : { r, c: 0 },
      End: e.ctrlKey ? { r: DAYS.length - 1, c: COLS.length - 1 } : { r, c: COLS.length - 1 },
    };
    if (moves[e.key]) {
      e.preventDefault();
      go(moves[e.key]!.r, moves[e.key]!.c);
    } else if (editable && (e.key === 'Enter' || e.key === 'F2')) {
      e.preventDefault();
      setEditing(String(value(r, c)));
    } else if (editable && /^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setEditing(e.key);
    }
  }

  return (
    <section>
      <h1>Timesheet</h1>
      <p>Move with the arrow keys. Press Enter or start typing to change hours; Enter saves, Escape cancels.</p>
      <table role="grid" aria-label="Hours this week" className="timesheet" onKeyDown={onKey}>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {COLS.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, r) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              {COLS.map((name, c) => {
                const isActive = active.r === r && active.c === c;
                return (
                  <td
                    key={name}
                    ref={(el) => {
                      if (el) cells.current.set(`${r}-${c}`, el);
                    }}
                    tabIndex={isActive && editing === null ? 0 : -1}
                    aria-readonly={c === 2 ? true : undefined}
                    onClick={() => setActive({ r, c })}
                    onDoubleClick={() => {
                      if (c < 2) {
                        setActive({ r, c });
                        setEditing(String(value(r, c)));
                      }
                    }}
                  >
                    {isActive && editing !== null ? (
                      <input
                        aria-label={`${name}, ${day}`}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? 'timesheet-error' : undefined}
                        value={editing}
                        autoFocus
                        onChange={(e) => setEditing(e.target.value)}
                      />
                    ) : (
                      value(r, c)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Week</th>
            <td>{hours.reduce((s, row) => s + row[0]!, 0)}</td>
            <td>{hours.reduce((s, row) => s + row[1]!, 0)}</td>
            <td>{hours.reduce((s, _, r) => s + total(r), 0)}</td>
          </tr>
        </tfoot>
      </table>
      {error && (
        <p role="alert" id="timesheet-error">
          {error}
        </p>
      )}
    </section>
  );
}
