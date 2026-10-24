import { useEffect, useState } from 'react';

const SLIDES = ['Autumn sale: 20% off grinders', 'Free delivery over 200 PLN', 'New: single-origin beans', 'Workshops every Saturday'];
const ROTATE_MS = 5000;

export function Promotions() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = !paused && !hovered && !focused;

  useEffect(() => {
    if (!rotating) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [rotating]);

  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <section>
      <h1>Promotions</h1>
      <div
        className="carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotions"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <div className="carousel-controls">
          <button type="button" onClick={() => setPaused((p) => !p)}>
            {paused ? 'Play slides' : 'Pause slides'}
          </button>
          <button type="button" aria-label="Previous slide" onClick={() => go(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(1)}>
            ›
          </button>
        </div>
        <div aria-live={rotating ? 'off' : 'polite'} className="carousel-slides">
          {SLIDES.map((text, i) => (
            <div key={text} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} hidden={i !== index} className="carousel-slide">
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
