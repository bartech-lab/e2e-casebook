import { useEffect, useRef, useState } from 'react';
import { json } from '../http.ts';

type Score = { home: number; away: number };
const POLL_MS = 3000;
const goals = (s: Score) => s.home + s.away;

export function LiveScore({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/score`;
  const [score, setScore] = useState<Score | null>(null);
  const [missed, setMissed] = useState('');
  const latest = useRef<Score | null>(null);
  const goalsWhenHidden = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      const next = await json<Score>(await fetch(url));
      if (!live) return null;
      latest.current = next;
      setScore(next);
      return next;
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => void load().catch(() => {}), POLL_MS);
    };
    const onVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(timer);
        goalsWhenHidden.current = latest.current ? goals(latest.current) : 0;
        return;
      }
      const next = await load().catch(() => null);
      if (next && goalsWhenHidden.current !== null) {
        const n = goals(next) - goalsWhenHidden.current;
        if (n > 0) setMissed(`${n} ${n === 1 ? 'goal' : 'goals'} while you were away`);
      }
      goalsWhenHidden.current = null;
      start();
    };
    void load().catch(() => {});
    if (document.visibilityState === 'visible') start();
    else goalsWhenHidden.current = 0;
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [url]);

  return (
    <section>
      <h1>Live score</h1>
      {score && (
        <p className="score" aria-label="Score">
          Lions {score.home} : {score.away} Tigers
        </p>
      )}
      {missed && (
        <p role="status">
          {missed}{' '}
          <button type="button" onClick={() => setMissed('')}>
            Dismiss
          </button>
        </p>
      )}
    </section>
  );
}
