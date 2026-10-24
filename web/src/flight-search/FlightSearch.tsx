import { useEffect, useRef, useState, type FormEvent } from 'react';
import { json } from '../http.ts';

type Flight = { code: string; departs: string; price: number };
type Phase = 'idle' | 'searching' | 'slow' | 'done' | 'cancelled' | 'timeout' | 'error';
type Search = { controller: AbortController; timers: ReturnType<typeof setTimeout>[] };

const SLOW_MS = 5000;
const GIVE_UP_MS = 20000;
const MESSAGES: Partial<Record<Phase, string>> = {
  searching: 'Searching…',
  slow: 'Still searching. This can take up to 20 seconds.',
  cancelled: 'Search cancelled.',
  timeout: 'The search took too long. Try again.',
  error: 'Could not search. Try again.',
};

export function FlightSearch({ sandbox }: { sandbox: string }) {
  const [from, setFrom] = useState('WAW');
  const [to, setTo] = useState('LHR');
  const [phase, setPhase] = useState<Phase>('idle');
  const [flights, setFlights] = useState<Flight[] | null>(null);
  const current = useRef<Search | null>(null);

  function finish() {
    const c = current.current;
    if (!c) return;
    for (const t of c.timers) clearTimeout(t);
    current.current = null;
  }

  function stop(next: Phase) {
    const c = current.current;
    finish();
    c?.controller.abort();
    setPhase(next);
  }

  useEffect(() => () => stop('idle'), []);

  async function search(e: FormEvent) {
    e.preventDefault();
    stop('searching');
    const me: Search = { controller: new AbortController(), timers: [] };
    me.timers.push(setTimeout(() => current.current === me && setPhase('slow'), SLOW_MS));
    me.timers.push(setTimeout(() => current.current === me && stop('timeout'), GIVE_UP_MS));
    current.current = me;
    setFlights(null);
    try {
      const r = await fetch(`/api/s/${sandbox}/flights?from=${from}&to=${to}`, { signal: me.controller.signal });
      const data = await json<{ flights: Flight[] }>(r);
      if (current.current !== me) return;
      finish();
      setFlights(data.flights);
      setPhase('done');
    } catch {
      if (current.current !== me) return;
      finish();
      setPhase('error');
    }
  }

  const busy = phase === 'searching' || phase === 'slow';
  return (
    <section>
      <h1>Flight search</h1>
      <form onSubmit={(e) => void search(e)}>
        <label>
          From{' '}
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="WAW">Warsaw (WAW)</option>
            <option value="KRK">Kraków (KRK)</option>
          </select>
        </label>{' '}
        <label>
          To{' '}
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="LHR">London (LHR)</option>
            <option value="CDG">Paris (CDG)</option>
          </select>
        </label>{' '}
        <button type="submit">Search flights</button>
      </form>
      <p role="status">{MESSAGES[phase] ?? ''}</p>
      {busy && (
        <button type="button" onClick={() => stop('cancelled')}>
          Cancel
        </button>
      )}
      {flights &&
        (flights.length === 0 ? (
          <p>No flights.</p>
        ) : (
          <ul aria-label="Flights">
            {flights.map((f) => (
              <li key={f.code}>
                {f.code} at {f.departs}, {f.price} PLN
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
