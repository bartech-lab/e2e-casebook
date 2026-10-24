import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

const SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
let booking: Promise<typeof import('./booking.ts')> | null = null;
const loadBooking = () =>
  (booking ??= import('./booking.ts').catch((error: unknown) => {
    booking = null;
    throw error;
  }));

export function Cinema({ sandbox }: { sandbox: string }) {
  const [taken, setTaken] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState<string | null>(null);
  const busy = useRef(new Set<string>());
  const [pending, setPending] = useState<string[]>([]);

  const refresh = () =>
    fetch(`/api/s/${sandbox}/cinema/seats`)
      .then((res) => json<{ taken: string[] }>(res))
      .then(({ taken }) => setTaken(taken));

  useEffect(() => {
    void refresh();
    void loadBooking().catch(() => {});
  }, [sandbox]);

  async function reserve(seat: string) {
    if (busy.current.has(seat)) return;
    busy.current.add(seat);
    setPending([...busy.current]);
    setFailed(null);
    try {
      const { reserveSeat } = await loadBooking();
      setMessage(await reserveSeat(sandbox, seat));
      await refresh();
    } catch {
      setFailed(seat);
    } finally {
      busy.current.delete(seat);
      setPending([...busy.current]);
    }
  }

  return (
    <section>
      <h1>Cinema</h1>
      <p>Friday 20:00, row A. Pick a seat.</p>
      <ul className="cinema-seats" aria-label="Seats">
        {SEATS.map((s) => (
          <li key={s}>
            {taken.includes(s) ? (
              <span>{s}: taken</span>
            ) : (
              <button type="button" onClick={() => void reserve(s)} aria-busy={pending.includes(s)}>
                Reserve {s}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
      {failed && (
        <p role="alert">
          Could not load the booking form.{' '}
          <button type="button" onClick={() => void reserve(failed)}>
            Try again
          </button>
        </p>
      )}
    </section>
  );
}
