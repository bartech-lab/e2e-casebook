import { useState } from 'react';

type WeekInfo = { firstDay: number; weekend: number[] };

function weekInfo(locale: string): WeekInfo {
  const l = new Intl.Locale(locale) as unknown as { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo };
  return l.getWeekInfo?.() ?? l.weekInfo ?? { firstDay: 1, weekend: [6, 7] };
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

export function ClassTimetable() {
  const locale = navigator.language;
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const info = weekInfo(locale);
  const first = info.firstDay % 7;
  const startDay = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const offset = (startDay - first + 7) % 7;
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysIn(month.y, month.m) }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const columns = Array.from({ length: 7 }, (_, i) => (first + i) % 7);
  const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const isWeekend = (jsDay: number) => info.weekend.includes(jsDay === 0 ? 7 : jsDay);
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(month.y, month.m, 1));
  const isToday = (d: number) => d === now.getDate() && month.m === now.getMonth() && month.y === now.getFullYear();
  const move = (step: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + step) / 12), m: (((m + step) % 12) + 12) % 12 }));

  return (
    <section className="class-timetable">
      <h1>Class timetable</h1>
      <button type="button" onClick={() => move(-1)}>
        Previous month
      </button>{' '}
      <button type="button" onClick={() => move(1)}>
        Next month
      </button>
      <table className="timetable-grid">
        <caption>{title}</caption>
        <thead>
          <tr>
            {columns.map((d) => (
              <th key={d} scope="col" className={isWeekend(d) ? 'weekend' : undefined}>
                {dayName.format(Date.UTC(2026, 10, 1 + d))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((d, c) => (
                <td key={c} className={isWeekend(columns[c]!) ? 'weekend' : undefined} aria-current={d && isToday(d) ? 'date' : undefined}>
                  {d ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
