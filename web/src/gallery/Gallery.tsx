import { useEffect, useRef, useState } from 'react';

const PHOTOS = Array.from({ length: 24 }, (_, i) => ({ n: i + 1, alt: `Photo ${i + 1} of 24 from the trip` }));

function Photo({ sandbox, n, alt }: { sandbox: string; n: number; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<'idle' | 'loaded' | 'failed'>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(box.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="photo" data-state={state}>
      {visible && state !== 'failed' && (
        <img src={`/api/s/${sandbox}/photos/${n}.svg${attempt ? `?retry=${attempt}` : ''}`} alt={alt} width={240} height={160} onLoad={() => setState('loaded')} onError={() => setState('failed')} />
      )}
      {state === 'failed' && (
        <p>
          Could not load photo {n}.{' '}
          <button
            type="button"
            onClick={() => {
              setAttempt((a) => a + 1);
              setState('idle');
            }}
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}

export function Gallery({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Gallery</h1>
      <p>Photos load as you scroll to them.</p>
      <div className="gallery">
        {PHOTOS.map((p) => (
          <Photo key={p.n} sandbox={sandbox} n={p.n} alt={p.alt} />
        ))}
      </div>
    </section>
  );
}
