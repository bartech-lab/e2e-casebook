import { useEffect, useRef, useState } from 'react';

const MAX = 280;
const PARAGRAPHS = [
  'Kraków is a city that rewards walking. The Old Town is small enough to cross in fifteen minutes, yet most visitors spend a whole day there without noticing the time.',
  'Start early at the Cloth Hall, before the tour groups arrive. The arcades are quiet at eight in the morning, and the light on the stone is soft and warm.',
  'From there, follow the Royal Road south to Wawel Hill. Take the stairs on the river side; the view over the Vistula is the best free sight in the city.',
  'In the afternoon, cross into Kazimierz for lunch. The old Jewish quarter is full of small cafés, bookshops and courtyards that are easy to miss from the street.',
];

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

export function Highlights() {
  const article = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const sel = document.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !article.current) return setSelection(null);
      const range = sel.getRangeAt(0);
      if (!article.current.contains(range.startContainer) || !article.current.contains(range.endContainer)) return setSelection(null);
      const text = clean(sel.toString());
      if (!text) return setSelection(null);
      const rects = range.getClientRects();
      const last = rects[rects.length - 1] ?? range.getBoundingClientRect();
      setSelection({ text, top: last.top + scrollY - 40, left: last.right + scrollX });
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  function save() {
    if (!selection || selection.text.length > MAX) return;
    setSaved((cur) => [...cur, selection.text]);
    document.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  const tooLong = selection !== null && selection.text.length > MAX;
  return (
    <section className="hl-page">
      <h1>A day in Kraków</h1>
      <p className="hl-meta">By Marta Zielińska, 6 minutes to read</p>
      <article ref={article} aria-label="Article">
        {PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
      {selection && (
        <div className="hl-popup" style={{ top: selection.top, left: selection.left }}>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={save} disabled={tooLong}>
            Save highlight
          </button>
          {tooLong && <p role="alert">Highlights can be up to {MAX} characters.</p>}
        </div>
      )}
      <h2>Your highlights</h2>
      <ul aria-label="Your highlights">
        {saved.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </section>
  );
}
