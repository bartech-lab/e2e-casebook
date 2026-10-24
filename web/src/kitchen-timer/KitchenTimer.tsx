import { useEffect, useState } from 'react';
import { sendJson } from '../http.ts';

const MINUTES = [1, 3, 5, 10];

export function KitchenTimer({ sandbox }: { sandbox: string }) {
  const key = `kitchen-timer-${sandbox}`;
  const read = () => Number(localStorage.getItem(key) ?? 0) || null;
  const [endsAt, setEndsAt] = useState<number | null>(read);
  const [now, setNow] = useState(Date.now());
  const [rang, setRang] = useState(false);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setEndsAt(read());
        setRang(false);
      }
    };
    addEventListener('storage', onStorage);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      removeEventListener('storage', onStorage);
      clearInterval(tick);
    };
  }, [key]);

  const left = endsAt === null ? null : Math.max(0, endsAt - now);
  const done = left === 0;

  useEffect(() => {
    if (!done || endsAt === null) return;
    void navigator.locks.request(`${key}-ring`, async () => {
      if (localStorage.getItem(`${key}-rang`) === String(endsAt)) return;
      localStorage.setItem(`${key}-rang`, String(endsAt));
      setRang(true);
      await fetch(`/api/s/${sandbox}/timer-rings`, sendJson('POST', { endsAt }));
    });
  }, [done, endsAt]);

  function start(minutes: number) {
    const at = Date.now() + minutes * 60_000;
    localStorage.setItem(key, String(at));
    setEndsAt(at);
    setRang(false);
  }

  function stop() {
    localStorage.removeItem(key);
    setEndsAt(null);
    setRang(false);
  }

  const mm = left === null ? '' : `${Math.floor(Math.ceil(left / 1000) / 60)}:${String(Math.ceil(left / 1000) % 60).padStart(2, '0')}`;
  return (
    <section>
      <h1>Kitchen timer</h1>
      <p>The timer is shared by every tab of this page.</p>
      <p>
        {MINUTES.map((m) => (
          <button key={m} type="button" onClick={() => start(m)}>
            {m} min
          </button>
        ))}{' '}
        {endsAt !== null && (
          <button type="button" onClick={stop}>
            Stop
          </button>
        )}
      </p>
      <p role="timer" aria-label="Time left">
        {endsAt === null ? 'No timer running.' : done ? "Time's up!" : mm}
      </p>
      <p role="status">{rang ? 'Ringing in this tab.' : ''}</p>
    </section>
  );
}
