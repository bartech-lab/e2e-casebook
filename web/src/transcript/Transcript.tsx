import { useEffect, useState } from 'react';
import { json } from '../http.ts';

type Line = { n: number; item: string; speaker: string; text: string };

function target() {
  const m = /^#line-(\d+)$/.exec(location.hash);
  return m ? Number(m[1]) : null;
}

export function Transcript({ sandbox }: { sandbox: string }) {
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [current, setCurrent] = useState<number | null>(target);

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/transcript`)
      .then((res) => json<{ title: string; lines: Line[] }>(res))
      .then((t) => {
        setTitle(t.title);
        setLines(t.lines);
      });
  }, [sandbox]);

  useEffect(() => {
    const onHash = () => setCurrent(target());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const el = current === null ? null : document.getElementById(`line-${current}`);
    if (!el) return;
    let frame = 0;
    let passes = 0;
    let still = 0;
    let last = NaN;
    const land = () => {
      el.scrollIntoView({ block: 'start' });
      const top = el.getBoundingClientRect().top;
      still = top === last ? still + 1 : 0;
      last = top;
      if (still < 5 && ++passes < 60) frame = requestAnimationFrame(land);
    };
    land();
    return () => cancelAnimationFrame(frame);
  }, [current, lines]);

  const items = lines.filter((l, i) => i === 0 || lines[i - 1]!.item !== l.item);
  return (
    <section className="transcript">
      <header className="transcript-head">
        <h1>Transcript</h1>
        <p>{title || 'Loading…'}</p>
      </header>
      {items.length > 0 && (
        <nav aria-label="Agenda">
          <ol>
            {items.map((l) => (
              <li key={l.n}>
                <a href={`#line-${l.n}`}>{l.item}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="transcript-lines">
        {lines.map((l) => (
          <p key={l.n} id={`line-${l.n}`} className="transcript-line" aria-current={l.n === current ? 'true' : undefined}>
            <a href={`#line-${l.n}`} aria-label={`Link to line ${l.n}`}>
              #
            </a>{' '}
            <strong>{l.speaker}:</strong> {l.text}
          </p>
        ))}
      </div>
    </section>
  );
}
