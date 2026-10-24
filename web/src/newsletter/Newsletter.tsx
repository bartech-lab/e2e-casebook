import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Article = { id: number; title: string; paragraphs: number; read: boolean };
const DWELL_MS = 2000;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const FILLER =
  'Residents can read the details below, with dates, places and who to contact. The notice is repeated here so that it is easy to find later.';

export function Newsletter({ sandbox }: { sandbox: string }) {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const read = useRef(new Set<number>());
  const inView = useRef(new Set<number>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let live = true;
    void (async () => {
      const body = await json<{ articles: Article[] }>(await fetch(`/api/s/${sandbox}/articles`));
      if (!live) return;
      read.current = new Set(body.articles.filter((a) => a.read).map((a) => a.id));
      setArticles(body.articles);
    })();
    return () => {
      live = false;
    };
  }, [sandbox]);

  useEffect(() => {
    if (!articles) return;
    const all = timers.current;

    const markRead = (id: number) => {
      all.delete(id);
      if (read.current.has(id)) return;
      read.current.add(id);
      setArticles((list) => list && list.map((a) => (a.id === id ? { ...a, read: true } : a)));
      void fetch(`/api/s/${sandbox}/articles/${id}/read`, { method: 'POST' });
    };
    const start = (id: number) => {
      if (read.current.has(id) || all.has(id) || document.visibilityState !== 'visible') return;
      all.set(id, setTimeout(() => markRead(id), DWELL_MS));
    };
    const stop = (id: number) => {
      clearTimeout(all.get(id));
      all.delete(id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = Number((entry.target as HTMLElement).dataset.id);
          const screen = entry.rootBounds?.height ?? innerHeight;
          const seen = entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= screen / 2;
          if (seen) {
            inView.current.add(id);
            start(id);
          } else {
            inView.current.delete(id);
            stop(id);
          }
        }
      },
      { threshold: THRESHOLDS },
    );
    document.querySelectorAll<HTMLElement>('[data-article]').forEach((el) => observer.observe(el));

    const onVisibility = () => {
      if (document.visibilityState === 'visible') inView.current.forEach(start);
      else [...all.keys()].forEach(stop);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      [...all.keys()].forEach(stop);
    };
  }, [articles !== null, sandbox]);

  if (!articles) return <p>Loading…</p>;
  const count = articles.filter((a) => a.read).length;

  return (
    <section>
      <h1>Newsletter</h1>
      <p className="newsletter-count" role="status">
        {count} of {articles.length} read
      </p>
      {articles.map((a) => (
        <article key={a.id} data-article data-id={a.id} className="newsletter-article" aria-labelledby={`article-${a.id}`}>
          <h2 id={`article-${a.id}`}>
            {a.title} {!a.read && <span className="badge">New</span>}
          </h2>
          {Array.from({ length: a.paragraphs }, (_, i) => (
            <p key={i}>{FILLER}</p>
          ))}
        </article>
      ))}
    </section>
  );
}
