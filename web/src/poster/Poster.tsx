import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX = 48;
const MIN = 16;

export function Poster({ sandbox }: { sandbox: string }) {
  const [text, setText] = useState('Winter concert in the village hall');
  const box = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);

  const fit = () => {
    const b = box.current;
    const h = headline.current;
    if (!b || !h) return;
    let size = MAX;
    h.style.fontSize = `${size}px`;
    while (h.scrollWidth > b.clientWidth && size > MIN) {
      size--;
      h.style.fontSize = `${size}px`;
    }
  };

  useEffect(() => {
    const report = (e: ErrorEvent) => {
      void fetch(`/api/s/${sandbox}/client-errors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: String(e.message || e.error || 'Unknown error') }),
        keepalive: true,
      });
    };
    addEventListener('error', report);
    return () => removeEventListener('error', report);
  }, [sandbox]);

  useLayoutEffect(fit, [text]);

  useEffect(() => {
    const ro = new ResizeObserver(() => fit());
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <section>
      <h1>Concert poster</h1>
      <label>
        Headline <input value={text} maxLength={80} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="poster" ref={box} aria-label="Poster preview" role="img">
        <h2 ref={headline} className="poster-headline">
          {text}
        </h2>
        <p>Saturday 13 December, 18:00. Free entry.</p>
      </div>
    </section>
  );
}
