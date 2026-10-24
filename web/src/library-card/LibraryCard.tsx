import { useState, type FormEvent } from 'react';

type Day = { y: number; m: number; d: number };
const ADULT = 16;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (day: Day) => `${day.y}-${pad(day.m)}-${pad(day.d)}`;

export function parseDate(text: string): Day | null {
  const t = text.trim();
  let m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t);
  const parts = m ? { d: Number(m[1]), m: Number(m[2]), y: Number(m[3]) } : null;
  m = parts ? null : /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const day = parts ?? (m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null);
  if (!day || day.m < 1 || day.m > 12 || day.d < 1 || day.d > daysIn(day.y, day.m)) return null;
  return day;
}

export function today(): Day {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

export function ageOn(birth: Day, on: Day) {
  const before = on.m < birth.m || (on.m === birth.m && on.d < birth.d);
  return on.y - birth.y - (before ? 1 : 0);
}

const later = (a: Day, b: Day) => iso(a) > iso(b);

export function LibraryCard({ sandbox }: { sandbox: string }) {
  const [text, setText] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [errors, setErrors] = useState<{ date?: string; parent?: string }>({});
  const [status, setStatus] = useState('');

  const birth = parseDate(text);
  const now = today();
  const known = birth && !later(birth, now) ? birth : null;
  const age = known ? ageOn(known, now) : null;
  const child = age !== null && age < ADULT;

  async function apply(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    const found: { date?: string; parent?: string } = {};
    if (!birth) found.date = 'Enter a real date, like 7.3.2010.';
    else if (!known) found.date = 'Your date of birth cannot be in the future.';
    else if (child && !EMAIL.test(parentEmail.trim())) found.parent = "Enter a parent's email address.";
    setErrors(found);
    if (found.date || found.parent) return;
    const body: { birthDate: string; parentEmail?: string } = { birthDate: iso(known!) };
    if (child) body.parentEmail = parentEmail.trim();
    const res = await fetch(`/api/s/${sandbox}/library-cards`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? 'Application sent.' : 'Could not send. Try again.');
  }

  return (
    <section>
      <h1>Library card</h1>
      <form noValidate onSubmit={(e) => void apply(e)}>
        <p>
          <label>
            Date of birth{' '}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={errors.date ? 'dob-error' : 'dob-hint'}
            />
          </label>{' '}
          <span id="dob-hint">Day, month, year, for example 7.3.2010.</span>
          {errors.date && (
            <span id="dob-error" className="field-error">
              {errors.date}
            </span>
          )}
        </p>
        <p data-testid="age">{age !== null ? `You are ${age}.` : ''}</p>
        {child && (
          <p>
            <label>
              Parent's email{' '}
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                aria-invalid={errors.parent ? true : undefined}
                aria-describedby={errors.parent ? 'parent-error' : undefined}
              />
            </label>
            {errors.parent && (
              <span id="parent-error" className="field-error">
                {errors.parent}
              </span>
            )}
          </p>
        )}
        <button type="submit">Apply for a card</button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
