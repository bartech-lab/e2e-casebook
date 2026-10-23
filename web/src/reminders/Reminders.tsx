import { useEffect, useState, type FormEvent } from 'react';

type Reminder = { id: string; text: string; due: number };

const key = (sandbox: string) => `reminders:${sandbox}`;
const time = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function read(sandbox: string): Reminder[] {
  try {
    return JSON.parse(localStorage.getItem(key(sandbox)) ?? '[]') as Reminder[];
  } catch {
    return [];
  }
}

export function Reminders({ sandbox }: { sandbox: string }) {
  const [list, setList] = useState(() => read(sandbox));
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState('5');
  const [banner, setBanner] = useState('');

  function save(next: Reminder[]) {
    localStorage.setItem(key(sandbox), JSON.stringify(next));
    setList(next);
  }

  useEffect(() => {
    const timers = list.map((r) =>
      setTimeout(() => {
        save(read(sandbox).filter((x) => x.id !== r.id));
        if ('Notification' in window && Notification.permission === 'granted') new Notification('Reminder', { body: r.text });
        else setBanner(`Reminder: ${r.text}`);
      }, Math.max(0, r.due - Date.now())),
    );
    return () => timers.forEach(clearTimeout);
  }, [list]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    save([...list, { id: crypto.randomUUID(), text: text.trim(), due: Date.now() + Number(minutes) * 60_000 }]);
    setText('');
  }

  return (
    <section>
      <h1>Reminders</h1>
      {banner && (
        <p role="alert">
          {banner}{' '}
          <button type="button" onClick={() => setBanner('')}>
            Dismiss
          </button>
        </p>
      )}
      <form onSubmit={onSubmit}>
        <label htmlFor="reminder-text">Remind me about</label>{' '}
        <input id="reminder-text" value={text} onChange={(e) => setText(e.target.value)} />{' '}
        <label htmlFor="reminder-minutes">In</label>{' '}
        <select id="reminder-minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)}>
            {['1', '5', '15', '60'].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
        </select>{' '}
        <button type="submit">Remind me</button>
      </form>
      <ul aria-label="Pending reminders">
        {list.map((r) => (
          <li key={r.id}>
            {r.text} at {time(r.due)}{' '}
            <button type="button" aria-label={`Cancel ${r.text}`} onClick={() => save(list.filter((x) => x.id !== r.id))}>
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
