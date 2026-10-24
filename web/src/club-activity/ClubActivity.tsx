import { useEffect, useState } from 'react';
import { json } from '../http.ts';

type Event = { text: string; at: string };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function relative(at: Date, now: Date) {
  const seconds = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  if (sameDay(at, now)) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(at, yesterday)) return `yesterday at ${pad(at.getHours())}:${pad(at.getMinutes())}`;
  const day = `${at.getDate()} ${MONTHS[at.getMonth()]}`;
  return at.getFullYear() === now.getFullYear() ? day : `${day} ${at.getFullYear()}`;
}

export function ClubActivity({ sandbox }: { sandbox: string }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/club-activity`).then((r) => json<{ events: Event[] }>(r)).then((r) => setEvents(r.events));
  }, [sandbox]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <h1>Club activity</h1>
      {events === null ? (
        <p>Loading…</p>
      ) : (
        <ul aria-label="Activity">
          {events.map((e) => (
            <li key={e.at + e.text}>
              {e.text} <time dateTime={e.at}>{relative(new Date(e.at), now)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
