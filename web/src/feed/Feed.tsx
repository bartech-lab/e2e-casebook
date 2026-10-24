import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Post = { id: number; text: string };
type Page = { posts: Post[]; more: boolean };

const POLL_MS = 2000;

export function Feed({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/feed`;
  const [posts, setPosts] = useState<Post[]>([]);
  const [more, setMore] = useState(true);
  const [fresh, setFresh] = useState<Post[]>([]);
  const loading = useRef(false);
  const newest = useRef(0);
  const sentinel = useRef<HTMLLIElement>(null);

  async function loadOlder() {
    if (loading.current || !more) return;
    loading.current = true;
    try {
      const oldest = posts.at(-1)?.id;
      const page = await json<Page>(await fetch(oldest === undefined ? url : `${url}?before=${oldest}`));
      setPosts((p) => [...p, ...page.posts]);
      setMore(page.more);
      if (oldest === undefined) newest.current = page.posts[0]?.id ?? 0;
    } finally {
      loading.current = false;
    }
  }

  useEffect(() => {
    const target = sentinel.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) void loadOlder();
    });
    observer.observe(target);
    return () => observer.disconnect();
  });

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!newest.current) return;
      const page = await json<Page>(await fetch(`${url}?after=${newest.current}`));
      if (page.posts.length) {
        newest.current = page.posts[0]!.id;
        setFresh((f) => [...page.posts, ...f]);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [url]);

  return (
    <section>
      <h1>Feed</h1>
      {fresh.length > 0 && (
        <button
          type="button"
          className="new-posts"
          onClick={() => {
            setPosts((p) => [...fresh, ...p]);
            setFresh([]);
            scrollTo(0, 0);
          }}
        >
          {fresh.length} new {fresh.length === 1 ? 'post' : 'posts'}
        </button>
      )}
      <ol aria-label="Posts" className="feed">
        {posts.map((p) => (
          <li key={p.id}>{p.text}</li>
        ))}
        {more ? (
          <li ref={sentinel} aria-hidden="true" className="sentinel">
            Loading…
          </li>
        ) : null}
      </ol>
      {!more && <p>No more posts.</p>}
    </section>
  );
}
