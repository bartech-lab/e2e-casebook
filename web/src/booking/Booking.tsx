import { useEffect, useState } from 'react';
import { json, sendJson } from '../http.ts';
import { navigate } from '../router.tsx';

type Draft = { checkIn: string; nights: string; adults: string; children: string };
export type BookingStep = 'dates' | 'guests' | 'review' | 'done';

const EMPTY: Draft = { checkIn: '', nights: '', adults: '2', children: '0' };
const draftKey = (sandbox: string) => `booking:${sandbox}`;
const whole = (v: string, min: number, max: number) => /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max;
const datesOk = (d: Draft) => /^\d{4}-\d{2}-\d{2}$/.test(d.checkIn) && whole(d.nights, 1, 14);
const guestsOk = (d: Draft) => whole(d.adults, 1, 4) && whole(d.children, 0, 3);
const total = (d: Draft) => Number(d.nights) * (150 * Number(d.adults) + 75 * Number(d.children));

function load(sandbox: string): Draft {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(draftKey(sandbox)) ?? '{}') };
  } catch {
    return EMPTY;
  }
}

function redirect(path: string) {
  history.replaceState(null, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
}

export function Booking({ sandbox, step }: { sandbox: string; step: BookingStep }) {
  const base = `/s/${sandbox}/booking`;
  const [draft, setDraft] = useState(() => load(sandbox));
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'done') return;
    const saved = load(sandbox);
    setDraft(saved);
    if (step !== 'dates' && !datesOk(saved)) redirect(`${base}/dates`);
    else if (step === 'review' && !guestsOk(saved)) redirect(`${base}/guests`);
  }, [sandbox, step, base]);

  function change(field: keyof Draft, value: string) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    sessionStorage.setItem(draftKey(sandbox), JSON.stringify(next));
  }

  async function book() {
    setError('');
    try {
      const { id } = await json<{ id: string }>(
        await fetch(`/api/s/${sandbox}/bookings`, sendJson('POST', { checkIn: draft.checkIn, nights: Number(draft.nights), adults: Number(draft.adults), children: Number(draft.children) })),
      );
      sessionStorage.removeItem(draftKey(sandbox));
      navigate(`${base}/done?id=${id}`);
    } catch {
      setError('The booking failed. Try again.');
    }
  }

  const field = (name: keyof Draft, label: string, type: string) => (
    <label>
      {label} <input type={type} value={draft[name]} onChange={(e) => change(name, e.target.value)} />
    </label>
  );

  return (
    <section>
      <h1>Book a room</h1>
      <ol aria-label="Steps" className="steps">
        {(['dates', 'guests', 'review'] as const).map((s, i) => (
          <li key={s} aria-current={s === step ? 'step' : undefined}>
            {i + 1}. {s[0]!.toUpperCase() + s.slice(1)}
          </li>
        ))}
      </ol>
      {step === 'dates' && (
        <>
          <h2>Dates</h2>
          <p>
            {field('checkIn', 'Check-in', 'date')} {field('nights', 'Nights (1 to 14)', 'number')}
          </p>
          <button type="button" disabled={!datesOk(draft)} onClick={() => navigate(`${base}/guests`)}>
            Next
          </button>
        </>
      )}
      {step === 'guests' && (
        <>
          <h2>Guests</h2>
          <p>
            {field('adults', 'Adults (1 to 4)', 'number')} {field('children', 'Children (0 to 3)', 'number')}
          </p>
          <button type="button" onClick={() => navigate(`${base}/dates`)}>
            Back
          </button>{' '}
          <button type="button" disabled={!guestsOk(draft)} onClick={() => navigate(`${base}/review`)}>
            Next
          </button>
        </>
      )}
      {step === 'review' && (
        <>
          <h2>Review</h2>
          <dl>
            <dt>Check-in</dt>
            <dd>{draft.checkIn}</dd>
            <dt>Nights</dt>
            <dd>{draft.nights}</dd>
            <dt>Guests</dt>
            <dd>
              {draft.adults} adults, {draft.children} children
            </dd>
            <dt>Total</dt>
            <dd>{total(draft).toFixed(2)} PLN</dd>
          </dl>
          <button type="button" onClick={() => navigate(`${base}/guests`)}>
            Back
          </button>{' '}
          <button type="button" onClick={() => void book()}>
            Book
          </button>
          {error && <p role="alert">{error}</p>}
        </>
      )}
      {step === 'done' && (
        <>
          <h2>Done</h2>
          <p role="status">Booking {new URLSearchParams(location.search).get('id')} confirmed.</p>
          <p>
            <a href={`${base}/dates`}>Book another room</a>
          </p>
        </>
      )}
    </section>
  );
}
