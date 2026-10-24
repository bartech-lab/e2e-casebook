import { useEffect, useRef, useState, type ReactNode } from 'react';

const RECIPES = [
  'Barszcz', 'Pierogi ruskie', 'Bigos', 'Żurek', 'Gołąbki', 'Placki ziemniaczane', 'Kopytka', 'Kluski śląskie',
  'Naleśniki', 'Racuchy', 'Sernik', 'Szarlotka', 'Pączki', 'Makowiec', 'Kotlet schabowy', 'Mizeria',
  'Rosół', 'Krupnik', 'Fasolka po bretońsku', 'Zrazy', 'Kaszanka', 'Leniwe', 'Kisiel', 'Babka',
  'Chłodnik', 'Gulasz', 'Pyzy', 'Knedle', 'Faworki', 'Kompot',
].map((name, i) => ({ id: `r${i + 1}`, name }));

let locks = 0;
let saved = 0;

function lockScroll() {
  if (locks++ > 0) return;
  saved = window.scrollY;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  Object.assign(document.body.style, { position: 'fixed', top: `-${saved}px`, left: '0', right: `${gap}px` });
}

function unlockScroll() {
  if (--locks > 0) return;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '' });
  window.scrollTo(0, saved);
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    lockScroll();
    box.current?.querySelector<HTMLElement>('button, input')?.focus();
    return unlockScroll;
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        ref={box}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          e.stopPropagation();
          onClose();
        }}
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Cookbook() {
  const [sharing, setSharing] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(false);
  const [shared, setShared] = useState<Record<string, 'Public' | 'Friends'>>({});
  const opener = useRef<HTMLButtonElement | null>(null);
  const recipe = RECIPES.find((r) => r.id === sharing);

  function closeShare() {
    setSharing(null);
    opener.current?.focus();
  }

  return (
    <section>
      <h1>Cookbook</h1>
      <ol aria-label="Recipes" className="cookbook">
        {RECIPES.map((r) => (
          <li key={r.id}>
            <h2>{r.name}</h2>
            <p>Seen by: {shared[r.id] ?? 'Only me'}</p>
            <button
              type="button"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setSharing(r.id);
              }}
            >
              Share {r.name}
            </button>
          </li>
        ))}
      </ol>
      {recipe && (
        <Dialog title={`Share ${recipe.name}`} onClose={closeShare}>
          <p>Seen by: {shared[recipe.id] ?? 'Only me'}</p>
          <button type="button" onClick={() => setVisibility(true)}>
            Change who can see it
          </button>{' '}
          <button type="button" onClick={closeShare}>
            Done
          </button>
          {visibility && (
            <Dialog title="Who can see it" onClose={() => setVisibility(false)}>
              {(['Public', 'Friends'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setShared((s) => ({ ...s, [recipe.id]: v }));
                    setVisibility(false);
                  }}
                >
                  {v}
                </button>
              ))}
            </Dialog>
          )}
        </Dialog>
      )}
    </section>
  );
}
