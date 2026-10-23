import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Meeting = { id: number; title: string; zone: string; minutes: number; starts: string[] };

const here = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Meetings({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['meetings', sandbox];
  const base = `/api/s/${sandbox}/meetings`;
  const meetings = useQuery({ queryKey: key, queryFn: async () => json<Meeting[]>(await fetch(base)) });
  const [error, setError] = useState('');

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(
      base,
      sendJson('POST', { title: form.get('title'), date: form.get('date'), time: form.get('time'), weeks: form.get('repeat') ? 4 : 1, zone: here() }),
    );
    if (!res.ok) return setError(((await res.json()) as { error: string }).error);
    setError('');
    e.currentTarget?.reset();
    await client.invalidateQueries({ queryKey: key });
  }

  const occurrences = (meetings.data ?? [])
    .flatMap((m) => m.starts.map((s) => ({ m, start: new Date(s) })))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const days = new Map<string, typeof occurrences>();
  for (const o of occurrences) {
    const k = localDay(o.start);
    days.set(k, [...(days.get(k) ?? []), o]);
  }

  return (
    <section>
      <h1>Meetings</h1>
      <p>Times are shown in your time zone, {here()}.</p>
      <form onSubmit={add} className="meeting-form">
        <label>
          Title <input name="title" required />
        </label>
        <label>
          Date <input name="date" type="date" required />
        </label>
        <label>
          Time <input name="time" type="time" required />
        </label>
        <label>
          <input name="repeat" type="checkbox" /> Every week for 4 weeks
        </label>
        <button type="submit">Add meeting</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {[...days].map(([k, list]) => (
        <section key={k} aria-label={day.format(list[0]!.start)}>
          <h2>{day.format(list[0]!.start)}</h2>
          <ul>
            {list.map(({ m, start }) => (
              <li key={`${m.id}-${start.toISOString()}`}>
                {clock.format(start)}–{clock.format(new Date(start.getTime() + m.minutes * 60_000))} {m.title}
                {m.zone !== here() && <small> (set in {m.zone})</small>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
