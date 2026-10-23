import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const HOLIDAYS = ['2026-04-06', '2026-05-01'];
const MAX_DAYS = 14;
const DAY_MS = 86_400_000;

const toMs = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => fromMs(toMs(d) + n * DAY_MS);
const weekday = (d: string) => new Date(toMs(d)).getUTCDay();
const label = (d: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(toMs(d)));

function addMonths(d: string, n: number) {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7)) - 1 + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return fromMs(Date.UTC(y, m, Math.min(Number(d.slice(8, 10)), last)));
}

export function workingDays(start: string, end: string) {
  let count = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) if (weekday(d) !== 0 && weekday(d) !== 6 && !HOLIDAYS.includes(d)) count++;
  return count;
}

function weeks(month: string) {
  const first = `${month.slice(0, 7)}-01`;
  const start = addDays(first, -((weekday(first) + 6) % 7));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
}

export function Holiday() {
  const today = fromMs(Date.now()).slice(0, 10);
  const [focus, setFocus] = useState(today);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    document.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus]);

  function pick(d: string) {
    if (d < today) return setMessage('Pick today or a later day.');
    setMessage('');
    if (!start || end || d < start) {
      setStart(d);
      setEnd(null);
      return;
    }
    if (toMs(d) - toMs(start) >= MAX_DAYS * DAY_MS) return setMessage(`Up to ${MAX_DAYS} days at a time.`);
    setEnd(d);
  }

  function move(next: string) {
    moved.current = true;
    setFocus(next);
  }

  function onKey(e: KeyboardEvent) {
    const next = { ArrowLeft: addDays(focus, -1), ArrowRight: addDays(focus, 1), ArrowUp: addDays(focus, -7), ArrowDown: addDays(focus, 7), PageUp: addMonths(focus, -1), PageDown: addMonths(focus, 1) }[e.key];
    if (!next) return;
    e.preventDefault();
    move(next);
  }

  function typed(which: 'start' | 'end', value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    if (which === 'start') {
      if (value < today) return setMessage('Pick today or a later day.');
      setMessage('');
      setStart(value);
      if (end && (end < value || toMs(end) - toMs(value) >= MAX_DAYS * DAY_MS)) setEnd(null);
      return move(value);
    }
    if (!start || value < start) return setMessage('Pick the first day first.');
    if (toMs(value) - toMs(start) >= MAX_DAYS * DAY_MS) return setMessage(`Up to ${MAX_DAYS} days at a time.`);
    setMessage('');
    setEnd(value);
  }

  const inRange = (d: string) => !!start && d >= start && d <= (end ?? start);

  return (
    <section>
      <h1>Holiday request</h1>
      <p>
        <label htmlFor="holiday-from">From</label> <input id="holiday-from" type="date" value={start ?? ''} min={today} onChange={(e) => typed('start', e.target.value)} />{' '}
        <label htmlFor="holiday-to">To</label> <input id="holiday-to" type="date" value={end ?? ''} min={start ?? today} onChange={(e) => typed('end', e.target.value)} />
      </p>
      <h2 id="holiday-month">{label(focus, { month: 'long', year: 'numeric' })}</h2>
      <table role="grid" aria-labelledby="holiday-month" onKeyDown={onKey} className="calendar">
        <thead>
          <tr>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks(focus).map((week) => (
            <tr key={week[0]}>
              {week.map((d) => (
                <td key={d} role="gridcell" aria-selected={inRange(d)}>
                  <button
                    type="button"
                    data-date={d}
                    tabIndex={d === focus ? 0 : -1}
                    disabled={d < today}
                    className={d.slice(0, 7) === focus.slice(0, 7) ? undefined : 'other-month'}
                    aria-label={label(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    onClick={() => {
                      setFocus(d);
                      pick(d);
                    }}
                  >
                    {Number(d.slice(8, 10))}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status">
        {message || (start && end ? `${label(start, { day: 'numeric', month: 'long' })} to ${label(end, { day: 'numeric', month: 'long' })}: ${workingDays(start, end)} working days` : start ? 'Now pick the last day.' : 'Pick the first day.')}
      </p>
    </section>
  );
}
