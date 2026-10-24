import { useCallback, useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Slot = { id: string; label: string; state: 'free' | 'held' | 'mine' | 'booked' | 'mine-booked'; expiresAt?: number };
type Hold = { slot: string; expiresAt: number };

const POLL_MS = 2000;
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Barber({ sandbox, name }: { sandbox: string; name: string }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(0);
  const offset = useRef(0);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;

  const serverNow = () => Date.now() + offset.current;
  const expire = () => {
    setHold(null);
    setMessage('Your hold ran out. Choose a time again.');
  };

  const load = useCallback(async () => {
    const r = await json<{ serverNow: number; slots: Slot[] }>(await fetch(`/api/s/${sandbox}/barber/slots?name=${encodeURIComponent(name)}`));
    offset.current = r.serverNow - Date.now();
    setSlots(r.slots);
    const mine = holdRef.current;
    if (mine && !r.slots.some((s) => s.id === mine.slot && s.state === 'mine')) expire();
  }, [sandbox, name]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!hold) return;
    const tick = () => {
      setNow(serverNow());
      if (serverNow() >= hold.expiresAt) expire();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [hold]);

  async function choose(slot: Slot) {
    setMessage('');
    const res = await fetch(`/api/s/${sandbox}/barber/holds`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, slot: slot.id }),
    });
    if (res.status === 409) {
      setMessage('Someone just took that time.');
    } else {
      const r = await json<{ serverNow: number; expiresAt: number }>(res);
      offset.current = r.serverNow - Date.now();
      setHold({ slot: slot.id, expiresAt: r.expiresAt });
    }
    await load();
  }

  async function confirm() {
    if (!hold) return;
    const res = await fetch(`/api/s/${sandbox}/barber/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, slot: hold.slot }),
    });
    const label = slots?.find((s) => s.id === hold.slot)?.label;
    if (res.ok) {
      setHold(null);
      setMessage(`Booked: ${label} with Sam.`);
    } else expire();
    await load();
  }

  const held = hold && slots?.find((s) => s.id === hold.slot);
  return (
    <section>
      <h1>Barber</h1>
      <p>Book a haircut with Sam. A time you choose is held for you for 5 minutes.</p>
      {slots === null ? (
        <p>Loading…</p>
      ) : (
        <ul aria-label="Times">
          {slots.map((s) => (
            <li key={s.id}>
              <button type="button" disabled={s.state !== 'free'} onClick={() => void choose(s)}>
                {s.label}
              </button>{' '}
              <span>
                {s.state === 'free' ? 'Free' : s.state === 'mine' ? 'Held for you' : s.state === 'mine-booked' ? 'Your booking' : s.state === 'held' ? 'Being booked' : 'Booked'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {held && hold && (
        <p>
          {held.label} is held for you for <span data-testid="time-left">{mmss(hold.expiresAt - now)}</span>.{' '}
          <button type="button" onClick={() => void confirm()}>
            Confirm booking
          </button>
        </p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
