import { useEffect, useRef, useState, type FormEvent } from 'react';

type Message = { id: number; name: string; text: string };
const SIGNAL_EVERY_MS = 1000;

export function typingText(names: string[]) {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return 'Several people are typing…';
}

export function StudyGroup({ sandbox, name }: { sandbox: string; name: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [text, setText] = useState('');
  const lastSignal = useRef(0);

  useEffect(() => {
    const es = new EventSource(`/api/s/${sandbox}/study-group/stream?name=${encodeURIComponent(name)}`);
    es.addEventListener('messages', (e) => setMessages(JSON.parse(e.data) as Message[]));
    es.addEventListener('message', (e) => setMessages((cur) => [...cur, JSON.parse(e.data) as Message]));
    es.addEventListener('typing', (e) => setTyping(JSON.parse(e.data) as string[]));
    return () => es.close();
  }, [sandbox, name]);

  const post = (path: string, body: object) =>
    fetch(`/api/s/${sandbox}/study-group/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  function onChange(value: string) {
    setText(value);
    if (!value) {
      lastSignal.current = 0;
      void post('typing/stop', { name });
      return;
    }
    const now = Date.now();
    if (now - lastSignal.current < SIGNAL_EVERY_MS) return;
    lastSignal.current = now;
    void post('typing', { name });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    lastSignal.current = 0;
    setText('');
    await post('messages', { name, text });
  }

  const others = typing.filter((n) => n !== name);
  return (
    <section>
      <h1>Study group</h1>
      <ol aria-label="Group messages">
        {messages.map((m) => (
          <li key={m.id}>
            <strong>{m.name}:</strong> {m.text}
          </li>
        ))}
      </ol>
      <p aria-live="polite" data-testid="typing">
        {typingText(others)}
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <label>
          Message <input value={text} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
        </label>{' '}
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
