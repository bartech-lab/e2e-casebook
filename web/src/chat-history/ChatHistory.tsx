import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Message = { id: number; from: string; text: string };

export function ChatHistory({ sandbox }: { sandbox: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [more, setMore] = useState(true);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLOListElement>(null);
  const top = useRef<HTMLLIElement>(null);
  const loading = useRef(false);
  const keep = useRef<{ height: number; scroll: number } | null>(null);
  const first = useRef(true);

  async function load() {
    if (loading.current || !more) return;
    loading.current = true;
    setFailed(false);
    const oldest = messages[0]?.id;
    try {
      const res = await fetch(`/api/s/${sandbox}/chat-history${oldest ? `?before=${oldest}` : ''}`);
      const page = await json<{ messages: Message[]; more: boolean }>(res);
      if (box.current) keep.current = { height: box.current.scrollHeight, scroll: box.current.scrollTop };
      setMessages((cur) => [...page.messages, ...cur]);
      setMore(page.more);
    } catch {
      setFailed(true);
    } finally {
      loading.current = false;
    }
  }

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || messages.length === 0) return;
    if (first.current) {
      first.current = false;
      el.scrollTop = el.scrollHeight;
    } else if (keep.current) {
      el.scrollTop = keep.current.scroll + (el.scrollHeight - keep.current.height);
    }
    keep.current = null;
  }, [messages]);

  useEffect(() => void load(), [sandbox]);

  useEffect(() => {
    if (!top.current || !box.current || messages.length === 0) return;
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && void load(), { root: box.current, rootMargin: '150px 0px 0px 0px' });
    observer.observe(top.current);
    return () => observer.disconnect();
  }, [messages, more]);

  return (
    <section>
      <h1>Chat history</h1>
      <ol ref={box} className="chat-history" aria-label="Conversation with Ola">
        <li ref={top} className="chat-history-top">
          {failed ? (
            <span role="alert">
              Could not load older messages.{' '}
              <button type="button" onClick={() => void load()}>
                Try again
              </button>
            </span>
          ) : more ? (
            'Loading older messages…'
          ) : (
            'Start of the conversation'
          )}
        </li>
        {messages.map((m) => (
          <li key={m.id} className={m.from === 'You' ? 'chat-history-mine' : undefined}>
            <strong>{m.from}:</strong> {m.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
