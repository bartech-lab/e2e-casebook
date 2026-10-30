import { useState } from 'react';

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

type Ymd = { y: number; m: number; d: number };

function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parse(value: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

function addMonths(start: Ymd, months: number): Ymd {
  const total = start.m + months;
  const y = start.y + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return { y, m, d: Math.min(start.d, daysIn(y, m)) };
}

function renewals(start: Ymd, step: number): Ymd[] {
  const out: Ymd[] = [];
  for (let i = 1; i <= 4; i++) out.push(addMonths(start, step * i));
  return out;
}

const utc = (x: Ymd) => Date.UTC(x.y, x.m, x.d);
const daysBetween = (a: Ymd, b: Ymd) => (utc(b) - utc(a)) / 86_400_000;

export function GymMembership() {
  const [start, setStart] = useState(todayLocal);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const from = parse(start);
  const dates = from ? renewals(from, plan === 'monthly' ? 1 : 12) : [];
  const first = dates[0];

  return (
    <section className="gym-membership">
      <h1>Gym membership</h1>
      <p>You pay on the day you start, then on the same day of each month or year. In a shorter month, you pay on its last day.</p>
      <label>
        Start date <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>{' '}
      <label>
        Plan{' '}
        <select value={plan} onChange={(e) => setPlan(e.target.value as 'monthly' | 'yearly')}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      {from && first ? (
        <>
          <h2>Next renewals</h2>
          <ol aria-label="Next renewals">
            {dates.map((r) => (
              <li key={utc(r)}>{fmt.format(new Date(utc(r)))}</li>
            ))}
          </ol>
          <p className="gym-days">Days until the first renewal: {daysBetween(from, first)}</p>
        </>
      ) : (
        <p>Choose a start date.</p>
      )}
    </section>
  );
}
