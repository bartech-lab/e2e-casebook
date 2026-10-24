import { useEffect, useRef, useState } from 'react';

type Message = { who: 'You' | 'Assistant'; text: string; state?: 'answering' | 'done' | 'stopped' | 'failed' };
const CONVERSATIONS = ['Trip planning', 'Recipes', 'Taxes'];

export function Assistant({ sandbox }: { sandbox: string }) {
  const [active, setActive] = useState(CONVERSATIONS[0]!);
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => Object.fromEntries(CONVERSATIONS.map((c) => [c, []])));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [unread, setUnread] = useState<string[]>([]);
  const activeRef = useRef(active);
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const updateLast = (conv: string, change: (m: Message) => Message) =>
    setMessages((cur) => {
      const list = cur[conv]!;
      return { ...cur, [conv]: [...list.slice(0, -1), change(list[list.length - 1]!)] };
    });
  const answering = (conv: string) => messages[conv]!.at(-1)?.state === 'answering';

  function open(conv: string) {
    setActive(conv);
    setUnread((cur) => cur.filter((c) => c !== conv));
  }

  async function ask(conv: string) {
    const question = (drafts[conv] ?? '').trim();
    if (!question) return;
    const controller = new AbortController();
    controllers.current.set(conv, controller);
    setDrafts((cur) => ({ ...cur, [conv]: '' }));
    setMessages((cur) => ({ ...cur, [conv]: [...cur[conv]!, { who: 'You', text: question }, { who: 'Assistant', text: '', state: 'answering' }] }));
    let end: Message['state'] = 'done';
    try {
      const res = await fetch(`/api/s/${sandbox}/assistant/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        updateLast(conv, (m) => ({ ...m, text: m.text + chunk }));
      }
    } catch {
      end = controller.signal.aborted ? 'stopped' : 'failed';
    }
    controllers.current.delete(conv);
    updateLast(conv, (m) => ({ ...m, state: end }));
    if (activeRef.current !== conv) setUnread((cur) => (cur.includes(conv) ? cur : [...cur, conv]));
  }

  function stop(conv: string) {
    controllers.current.get(conv)?.abort();
  }

  const list = messages[active]!;
  return (
    <section className="assistant">
      <h1>Assistant</h1>
      <div className="assistant-layout">
        <aside aria-label="Conversations">
          <ul>
            {CONVERSATIONS.map((c) => (
              <li key={c}>
                <button type="button" aria-current={c === active ? 'page' : undefined} onClick={() => open(c)}>
                  {c}
                  {answering(c) ? ' (answering…)' : unread.includes(c) ? ' (new answer)' : ''}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div>
          <h2>{active}</h2>
          <ol aria-label="Messages" className="assistant-messages">
            {list.map((m, i) => (
              <li key={i}>
                <strong>{m.who}:</strong> {m.text}
                {m.state === 'stopped' && ' (stopped)'}
                {m.state === 'failed' && ' (the answer failed, ask again)'}
              </li>
            ))}
          </ol>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(active);
            }}
          >
            <label>
              Your question <input value={drafts[active] ?? ''} maxLength={200} onChange={(e) => setDrafts({ ...drafts, [active]: e.target.value })} />
            </label>{' '}
            <button type="submit" disabled={answering(active)}>
              Ask
            </button>{' '}
            {answering(active) && (
              <button type="button" onClick={() => stop(active)}>
                Stop
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
