import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Notice = { id: number; title: string; body: string; read: boolean };
const DWELL_MS = 1000;

export function NoticeBoard({ sandbox }: { sandbox: string }) {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const sent = useRef(new Set<number>());

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/notices`)
      .then((r) => json<{ notices: Notice[] }>(r))
      .then((r) => {
        sent.current = new Set(r.notices.filter((n) => n.read).map((n) => n.id));
        setNotices(r.notices);
      });
  }, [sandbox]);

  const loaded = notices !== null;
  useEffect(() => {
    if (!loaded || !list.current) return;
    const pending = timers.current;
    const markRead = (id: number) => {
      if (sent.current.has(id)) return;
      sent.current.add(id);
      setNotices((cur) => cur && cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
      void fetch(`/api/s/${sandbox}/notices/read`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = Number((e.target as HTMLElement).dataset.id);
          if (e.intersectionRatio >= 0.5) {
            if (!pending.has(id) && !sent.current.has(id)) {
              pending.set(id, setTimeout(() => {
                pending.delete(id);
                markRead(id);
              }, DWELL_MS));
            }
          } else {
            clearTimeout(pending.get(id));
            pending.delete(id);
          }
        }
      },
      { threshold: [0, 0.5] },
    );
    for (const el of list.current.querySelectorAll<HTMLElement>('[data-id]')) io.observe(el);
    return () => {
      io.disconnect();
      for (const t of pending.values()) clearTimeout(t);
      pending.clear();
    };
  }, [loaded, sandbox]);

  const unread = notices?.filter((n) => !n.read).length ?? 0;
  return (
    <section>
      <h1>Notice board</h1>
      {notices === null ? (
        <p>Loading…</p>
      ) : (
        <>
          <p role="status">{unread === 1 ? '1 unread notice' : `${unread} unread notices`}</p>
          <ol ref={list} className="notice-list" aria-label="Notices">
            {notices.map((n) => (
              <li key={n.id} data-id={n.id} className="notice">
                <h2>{n.title}</h2>
                <p>{n.body}</p>
                <p>{n.read ? 'Read' : 'Unread'}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
