import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';
import { Link } from '../router.tsx';

type Story = { id: number; title: string };
type Kept = { sandbox: string; stories: Story[]; more: boolean };
let kept: Kept | null = null;

export function Newsroom({ sandbox }: { sandbox: string }) {
  const restored = kept?.sandbox === sandbox ? kept : null;
  const [stories, setStories] = useState<Story[]>(restored?.stories ?? []);
  const [more, setMore] = useState(restored?.more ?? true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const latest = useRef({ stories, more });
  latest.current = { stories, more };

  async function load() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const last = latest.current.stories.at(-1);
      const query = last ? `before=${last.id}&limit=10` : 'limit=10';
      const page = await json<{ stories: Story[]; more: boolean }>(await fetch(`/api/s/${sandbox}/news?${query}`));
      setStories((cur) => [...cur, ...page.stories]);
      setMore(page.more);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!restored) void load();
  }, []);

  const remember = () => (kept = { sandbox, ...latest.current });

  return (
    <section>
      <h1>Newsroom</h1>
      <ol className="news-list" aria-label="Stories">
        {stories.map((s) => (
          <li key={s.id}>
            <Link href={`/s/${sandbox}/newsroom/${s.id}`} onClick={remember}>
              {s.title}
            </Link>
          </li>
        ))}
      </ol>
      {failed && (
        <p role="alert">
          Could not load more stories.{' '}
          <button type="button" onClick={() => void load()}>
            Try again
          </button>
        </p>
      )}
      {stories.length > 0 && !failed && (more ? (
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      ) : (
        <p>No older stories.</p>
      ))}
    </section>
  );
}

export function NewsStory({ sandbox, id }: { sandbox: string; id: number }) {
  const [story, setStory] = useState<{ title: string; body: string } | null>(null);
  useEffect(() => {
    void fetch(`/api/s/${sandbox}/news/${id}`).then(async (res) => setStory(await json(res)));
  }, [sandbox, id]);
  return (
    <article>
      <p>
        <Link href={`/s/${sandbox}/newsroom`}>All stories</Link>
      </p>
      {story ? (
        <>
          <h1>{story.title}</h1>
          <p>{story.body}</p>
        </>
      ) : (
        <p>Loading…</p>
      )}
    </article>
  );
}
