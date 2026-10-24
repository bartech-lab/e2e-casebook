import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { json, sendJson } from '../http.ts';

type Message = { id: number; from: string; text: string; image?: { height: number } };
const NEAR = 40;

export function TeamChat({ sandbox }: { sandbox: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [text, setText] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);
  const lastId = useRef(0);

  const toBottom = () => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    let live = true;
    const poll = async () => {
      try {
        const { messages: fresh } = await json<{ messages: Message[] }>(await fetch(`/api/s/${sandbox}/team-chat?after=${lastId.current}`));
        if (!live || fresh.length === 0) return;
        lastId.current = fresh.at(-1)!.id;
        setMessages((cur) => [...cur, ...fresh]);
        if (!pinned.current) setUnseen((n) => n + fresh.filter((m) => m.from !== 'You').length);
      } catch {}
    };
    void poll();
    const timer = setInterval(() => void poll(), 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [sandbox]);

  useLayoutEffect(() => {
    if (pinned.current) toBottom();
  }, [messages]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (pinned.current) toBottom();
    });
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);

  function onScroll() {
    const el = box.current!;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR;
    if (pinned.current) setUnseen(0);
  }

  function jump() {
    pinned.current = true;
    setUnseen(0);
    toBottom();
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const mine = await json<Message>(await fetch(`/api/s/${sandbox}/team-chat`, sendJson('POST', { text })));
    setText('');
    pinned.current = true;
    setUnseen(0);
    if (mine.id > lastId.current) {
      lastId.current = mine.id;
      setMessages((cur) => [...cur, mine]);
    }
  }

  return (
    <section>
      <h1>Team chat</h1>
      <div className="team-chat" ref={box} onScroll={onScroll} role="log" aria-label="Messages" tabIndex={0}>
        <ol ref={inner}>
          {messages.map((m) => (
            <li key={m.id} id={`team-msg-${m.id}`}>
              <strong>{m.from}:</strong> {m.text}
              {m.image && <img src={`/api/s/${sandbox}/team-chat/images/${m.image.height}`} alt={`Photo from ${m.from}`} width={240} />}
            </li>
          ))}
        </ol>
      </div>
      {unseen > 0 && (
        <button type="button" onClick={jump}>
          {unseen === 1 ? '1 new message' : `${unseen} new messages`} ↓
        </button>
      )}
      <form onSubmit={(e) => void send(e)}>
        <label>
          Message <input value={text} onChange={(e) => setText(e.target.value)} />
        </label>{' '}
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
