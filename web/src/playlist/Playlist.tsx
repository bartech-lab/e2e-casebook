import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Song = { id: number; title: string };
type Drag = { id: number; startY: number; moving: boolean; gap: number };

const THRESHOLD = 8;

function moved(songs: Song[], id: number, to: number): Song[] {
  const rest = songs.filter((s) => s.id !== id);
  rest.splice(to, 0, songs.find((s) => s.id === id)!);
  return rest;
}

export function Playlist({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['playlist', sandbox];
  const url = `/api/s/${sandbox}/playlist`;
  const list = useQuery({ queryKey: key, queryFn: async () => json<{ songs: Song[] }>(await fetch(url)) });
  const save = useMutation({
    mutationFn: async (songs: Song[]) => json<{ songs: Song[] }>(await fetch(url, sendJson('PUT', { order: songs.map((s) => s.id) }))),
    onSuccess: (data) => client.setQueryData(key, data),
  });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [grabbed, setGrabbed] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const rows = useRef<HTMLOListElement>(null);

  const songs = list.data?.songs ?? [];
  const latest = () => client.getQueryData<{ songs: Song[] }>(key)?.songs ?? [];

  function commit(next: Song[], id: number) {
    client.setQueryData(key, { songs: next });
    save.mutate(next);
    const at = next.findIndex((s) => s.id === id);
    setMessage(`Moved ${next[at]!.title} to position ${at + 1} of ${next.length}.`);
  }

  function gapAt(y: number): number {
    const items = [...(rows.current?.children ?? [])];
    const i = items.findIndex((item) => {
      const box = item.getBoundingClientRect();
      return y < box.top + box.height / 2;
    });
    return i < 0 ? items.length : i;
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, id: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, startY: e.clientY, moving: false, gap: 0 });
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const moving = drag.moving || Math.abs(e.clientY - drag.startY) > THRESHOLD;
    setDrag({ ...drag, moving, gap: moving ? gapAt(e.clientY) : drag.gap });
  }

  function onPointerUp() {
    if (drag?.moving) {
      const from = songs.findIndex((s) => s.id === drag.id);
      const to = drag.gap > from ? drag.gap - 1 : drag.gap;
      if (to !== from) commit(moved(songs, drag.id, to), drag.id);
    }
    setDrag(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, song: Song) {
    if (e.key === 'Escape' && drag) {
      e.preventDefault();
      setDrag(null);
      setMessage('Move cancelled.');
    } else if (e.key === 'Escape' && grabbed !== null) {
      e.preventDefault();
      setGrabbed(null);
      void client.invalidateQueries({ queryKey: key });
      setMessage('Move cancelled.');
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (grabbed === null) {
        setGrabbed(song.id);
        setMessage(`Picked up ${song.title}. Press the up or down arrow key to move it, and Space to drop it.`);
      } else {
        setGrabbed(null);
        commit(latest(), grabbed);
      }
    } else if (grabbed !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const current = latest();
      const to = current.findIndex((s) => s.id === grabbed) + (e.key === 'ArrowUp' ? -1 : 1);
      if (to >= 0 && to < current.length) client.setQueryData(key, { songs: moved(current, grabbed, to) });
    }
  }

  return (
    <section>
      <h1>Playlist</h1>
      <p>Drag a song by its handle, or focus the handle, press Space, move it with the arrow keys, and press Space again.</p>
      <ol ref={rows} aria-label="Playlist" className="playlist">
        {songs.map((s, i) => (
          <li
            key={s.id}
            className={[
              drag?.moving && drag.id === s.id ? 'dragging' : '',
              grabbed === s.id ? 'grabbed' : '',
              drag?.moving && drag.gap === i ? 'drop-before' : '',
              drag?.moving && drag.gap === songs.length && i === songs.length - 1 ? 'drop-after' : '',
            ].join(' ').trim() || undefined}
          >
            <button
              type="button"
              className="handle"
              aria-label={`Move ${s.title}`}
              aria-pressed={grabbed === s.id}
              onPointerDown={(e) => onPointerDown(e, s.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag(null)}
              onKeyDown={(e) => onKeyDown(e, s)}
            >
              ⠿
            </button>{' '}
            {s.title}
          </li>
        ))}
      </ol>
      <p role="status">{message}</p>
    </section>
  );
}
