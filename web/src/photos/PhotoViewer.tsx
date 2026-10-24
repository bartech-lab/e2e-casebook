import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const PHOTOS = [
  { caption: 'Morning on the Vistula', color: '#7aa7c7' },
  { caption: 'Old Town market square', color: '#c79a7a' },
  { caption: 'Tatra mountains in fog', color: '#8a9a8a' },
  { caption: 'Baltic dunes at Łeba', color: '#d8c38a' },
  { caption: 'Night tram in Kraków', color: '#4a4a6a' },
];

export function PhotoViewer() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'normal' | 'fullscreen' | 'expanded'>('normal');
  const viewer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => {
      const on = document.fullscreenElement === viewer.current;
      setMode((m) => (on ? 'fullscreen' : m === 'fullscreen' ? 'normal' : m));
      if (on) viewer.current?.focus();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggle() {
    if (mode === 'fullscreen') return void (await document.exitFullscreen());
    if (mode === 'expanded') return setMode('normal');
    try {
      await viewer.current!.requestFullscreen();
    } catch {
      setMode('expanded');
      viewer.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') setIndex((i) => Math.min(PHOTOS.length - 1, i + 1));
    else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    else if (e.key === 'Escape' && mode === 'expanded') setMode('normal');
    else return;
    e.preventDefault();
  }

  const photo = PHOTOS[index]!;
  return (
    <section>
      <h1>Photos</h1>
      <div ref={viewer} tabIndex={-1} className={`viewer${mode === 'expanded' ? ' expanded' : ''}`} onKeyDown={onKeyDown} aria-label="Photo viewer" role="region">
        <figure>
          <div className="photo" style={{ background: photo.color }} role="img" aria-label={photo.caption} />
          <figcaption>
            {photo.caption} ({index + 1} of {PHOTOS.length})
          </figcaption>
        </figure>
        <div className="viewer-controls">
          <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            Previous photo
          </button>
          <button type="button" onClick={() => setIndex((i) => Math.min(PHOTOS.length - 1, i + 1))} disabled={index === PHOTOS.length - 1}>
            Next photo
          </button>
          <button type="button" onClick={() => void toggle()}>
            {mode === 'normal' ? 'Full screen' : 'Exit full screen'}
          </button>
        </div>
      </div>
    </section>
  );
}
