import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Song = { id: number; title: string; others: number; liked: boolean };
type Saved = { liked: boolean; likes: number };

export function Favourites({ sandbox }: { sandbox: string }) {
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [error, setError] = useState('');
  const desired = useRef(new Map<number, boolean>());
  const confirmed = useRef(new Map<number, boolean>());
  const inflight = useRef(new Set<number>());

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/songs`)
      .then((r) => json<{ songs: (Saved & { id: number; title: string })[] }>(r))
      .then((r) => {
        for (const s of r.songs) confirmed.current.set(s.id, s.liked);
        setSongs(r.songs.map((s) => ({ id: s.id, title: s.title, liked: s.liked, others: s.likes - (s.liked ? 1 : 0) })));
      });
  }, [sandbox]);

  const setLiked = (id: number, liked: boolean) => setSongs((cur) => cur && cur.map((s) => (s.id === id ? { ...s, liked } : s)));

  async function flush(id: number) {
    inflight.current.add(id);
    try {
      for (;;) {
        const want = desired.current.get(id)!;
        const res = await fetch(`/api/s/${sandbox}/songs/${id}/like`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ liked: want }),
        });
        const saved = await json<Saved>(res);
        confirmed.current.set(id, saved.liked);
        if (desired.current.get(id) === want) break;
      }
    } catch {
      const back = confirmed.current.get(id)!;
      desired.current.set(id, back);
      setLiked(id, back);
      setError('Could not save your like. Try again.');
    } finally {
      inflight.current.delete(id);
    }
  }

  function toggle(song: Song) {
    const next = !song.liked;
    setError('');
    setLiked(song.id, next);
    desired.current.set(song.id, next);
    if (!inflight.current.has(song.id)) void flush(song.id);
  }

  return (
    <section>
      <h1>Radio favourites</h1>
      <p role="alert">{error}</p>
      {songs === null ? (
        <p>Loading…</p>
      ) : (
        <ul aria-label="Songs">
          {songs.map((s) => {
            const likes = s.others + (s.liked ? 1 : 0);
            return (
              <li key={s.id}>
                {s.title}{' '}
                <button type="button" aria-pressed={s.liked} aria-label={`Like ${s.title}`} onClick={() => toggle(s)}>
                  {s.liked ? '♥' : '♡'}
                </button>{' '}
                <span>{likes === 1 ? '1 like' : `${likes} likes`}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
