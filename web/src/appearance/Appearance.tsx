import { useEffect, useState } from 'react';
import { json, sendJson } from '../http.ts';

type Theme = 'system' | 'light' | 'dark';
type Motion = 'system' | 'reduce' | 'full';
type Prefs = { theme: Theme; motion: Motion };
const DEFAULTS: Prefs = { theme: 'system', motion: 'system' };
const cacheKey = (sandbox: string) => `appearance_${sandbox}`;

function cached(sandbox: string): Prefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(cacheKey(sandbox)) ?? '{}') as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const list = matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener('change', update);
    update();
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export function Appearance({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}/appearance`;
  const [prefs, setPrefs] = useState(() => cached(sandbox));
  const [status, setStatus] = useState('');
  const systemDark = useMedia('(prefers-color-scheme: dark)');
  const systemReduce = useMedia('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    let live = true;
    fetch(base)
      .then((res) => json<Prefs>(res))
      .then((saved) => {
        if (!live) return;
        setPrefs(saved);
        localStorage.setItem(cacheKey(sandbox), JSON.stringify(saved));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [base, sandbox]);

  async function change(next: Prefs) {
    setPrefs(next);
    localStorage.setItem(cacheKey(sandbox), JSON.stringify(next));
    try {
      await json(await fetch(base, sendJson('PUT', next)));
      setStatus('Saved.');
    } catch {
      setStatus('Could not save. Your choice applies on this device only.');
    }
  }

  const theme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;
  const reduce = prefs.motion === 'system' ? systemReduce : prefs.motion === 'reduce';

  return (
    <section>
      <h1>Appearance</h1>
      <fieldset>
        <legend>Theme</legend>
        {(['system', 'light', 'dark'] as const).map((t) => (
          <label key={t}>
            <input type="radio" name="theme" checked={prefs.theme === t} onChange={() => change({ ...prefs, theme: t })} />{' '}
            {t === 'system' ? 'Same as my device' : t === 'light' ? 'Light' : 'Dark'}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Motion</legend>
        {(['system', 'reduce', 'full'] as const).map((m) => (
          <label key={m}>
            <input type="radio" name="motion" checked={prefs.motion === m} onChange={() => change({ ...prefs, motion: m })} />{' '}
            {m === 'system' ? 'Same as my device' : m === 'reduce' ? 'Reduce motion' : 'Full motion'}
          </label>
        ))}
      </fieldset>
      <p role="status">{status}</p>
      <p>
        Showing the {theme} theme{prefs.theme === 'system' ? ', following your device' : ''}. Animations are {reduce ? 'off' : 'on'}.
      </p>
      <div className="ap-preview" data-theme={theme} data-motion={reduce ? 'reduce' : 'full'} aria-label="Preview" role="region">
        <h2>Your parcel</h2>
        <p>Your next delivery arrives on Tuesday.</p>
        <p className="ap-muted">Updated 5 minutes ago</p>
        <p>
          <span className="ap-spinner" role="img" aria-label="Checking for updates" /> Checking for updates
        </p>
        <button type="button">Track parcel</button>
      </div>
    </section>
  );
}
