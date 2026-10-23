import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

const POLL_MS = 30_000;

export function Updates({ sandbox }: { sandbox: string }) {
  const [running, setRunning] = useState<number | null>(null);
  const [latest, setLatest] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const loaded = useRef<number | null>(null);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      try {
        const { version } = await json<{ version: number }>(await fetch(`/api/s/${sandbox}/version`, { cache: 'no-store' }));
        if (stopped) return;
        if (loaded.current === null) {
          loaded.current = version;
          setRunning(version);
        }
        setLatest(version);
      } catch {
        return;
      }
    };
    void check();
    const timer = setInterval(check, POLL_MS);
    const onFocus = () => void check();
    addEventListener('focus', onFocus);
    return () => {
      stopped = true;
      clearInterval(timer);
      removeEventListener('focus', onFocus);
    };
  }, [sandbox]);

  const outdated = running !== null && latest !== null && latest !== running && latest !== dismissed;

  return (
    <section>
      <h1>Updates</h1>
      {outdated && (
        <div role="alert">
          A new version is available.{' '}
          <button type="button" onClick={() => location.reload()}>
            Reload
          </button>{' '}
          <button type="button" onClick={() => setDismissed(latest)}>
            Later
          </button>
        </div>
      )}
      <p>This page checks for a new version of the app every 30 seconds and when you come back to it.</p>
      <p>{running === null ? 'Checking your version…' : `You are on version ${running}.`}</p>
    </section>
  );
}
