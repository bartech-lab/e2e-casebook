import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

const MIN_LINES = 2;
const MAX_LINES = 6;

export function Comments() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const box = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = box.current!;
    const style = getComputedStyle(el);
    const line = parseFloat(style.lineHeight);
    const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.height = '0px';
    const needed = Math.round((el.scrollHeight - pad) / line);
    const lines = Math.min(MAX_LINES, Math.max(MIN_LINES, needed));
    el.style.height = `${lines * line + pad + border}px`;
    el.style.overflowY = needed > MAX_LINES ? 'auto' : 'hidden';
  }, [text]);

  function send() {
    const t = text.trim();
    if (!t) return;
    setSent((cur) => [...cur, t]);
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section>
      <h1>Comments</h1>
      <p>Comments on the plan for the new playground.</p>
      <ol aria-label="Your comments" className="comment-list">
        {sent.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ol>
      <div className="comment-box">
        <label htmlFor="comment-text">Your comment</label>
        <textarea id="comment-text" ref={box} rows={MIN_LINES} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} />
        <button type="button" onClick={send}>
          Send
        </button>
      </div>
    </section>
  );
}
