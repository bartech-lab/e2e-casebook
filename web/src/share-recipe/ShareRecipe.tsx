import { useEffect, useRef, useState } from 'react';

const TITLE = 'Pierogi with potato and cheese';

export function ShareRecipe() {
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const link = `${location.origin}${location.pathname}`;

  useEffect(() => {
    if (manual === null) return;
    field.current?.focus();
    field.current?.select();
  }, [manual]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied.');
    } catch {
      setManual(link);
      setStatus('Copy this link:');
    }
  }

  async function share() {
    setStatus('');
    setManual(null);
    const data = { title: TITLE, text: `${TITLE}, a recipe`, url: link };
    if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        setStatus('Shared.');
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    await copy();
  }

  return (
    <section>
      <h1>{TITLE}</h1>
      <p>Serves 4. Takes 90 minutes.</p>
      <button type="button" onClick={() => void share()}>
        Share recipe
      </button>
      <p role="status">{status}</p>
      {manual !== null && (
        <label>
          Recipe link <input ref={field} readOnly value={manual} />
        </label>
      )}
    </section>
  );
}
