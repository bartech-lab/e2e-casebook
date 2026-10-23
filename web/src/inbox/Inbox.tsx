import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Message = { id: number; from: string; subject: string; unread: boolean };

export function Inbox({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['inbox', sandbox];
  const url = `/api/s/${sandbox}/inbox`;
  const inbox = useQuery({ queryKey: key, queryFn: async () => json<{ messages: Message[] }>(await fetch(url)) });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [status, setStatus] = useState('');
  const anchor = useRef<number | null>(null);
  const all = useRef<HTMLInputElement>(null);

  const visible = (inbox.data?.messages ?? []).filter((m) => !unreadOnly || m.unread);
  const chosen = visible.filter((m) => selected.has(m.id));

  useEffect(() => {
    if (all.current) all.current.indeterminate = chosen.length > 0 && chosen.length < visible.length;
  });

  function toggle(index: number, e: MouseEvent<HTMLInputElement>) {
    const target = visible[index]!;
    const on = e.currentTarget.checked;
    const next = new Set(selected);
    if (e.shiftKey && anchor.current !== null) {
      const [from, to] = anchor.current < index ? [anchor.current, index] : [index, anchor.current];
      for (const m of visible.slice(from, to + 1)) {
        if (on) next.add(m.id);
        else next.delete(m.id);
      }
    } else if (on) next.add(target.id);
    else next.delete(target.id);
    anchor.current = index;
    setSelected(next);
  }

  function toggleAll(on: boolean) {
    const next = new Set(selected);
    for (const m of visible) {
      if (on) next.add(m.id);
      else next.delete(m.id);
    }
    setSelected(next);
  }

  async function archive() {
    const ids = chosen.map((m) => m.id);
    const body = await json<{ messages: Message[] }>(await fetch(`${url}/archive`, sendJson('POST', { ids })));
    client.setQueryData(key, body);
    setSelected(new Set());
    anchor.current = null;
    setStatus(`Archived ${ids.length} ${ids.length === 1 ? 'message' : 'messages'}.`);
  }

  return (
    <section>
      <h1>Inbox</h1>
      <p>
        <label>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread only
        </label>
      </p>
      <p>
        <label>
          <input ref={all} type="checkbox" checked={visible.length > 0 && chosen.length === visible.length} onChange={(e) => toggleAll(e.target.checked)} /> Select all
        </label>{' '}
        <button type="button" disabled={!chosen.length} onClick={archive}>
          Archive selected ({chosen.length})
        </button>{' '}
        <span role="status">{status}</span>
      </p>
      <ul aria-label="Messages">
        {visible.map((m, i) => (
          <li key={m.id}>
            <label>
              <input type="checkbox" checked={selected.has(m.id)} onClick={(e) => toggle(i, e)} onChange={() => {}} /> {m.unread ? <strong>{m.from}</strong> : m.from}: {m.subject}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
