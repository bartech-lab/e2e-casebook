import { useEffect, useRef, useState } from 'react';

const READY_EVERY = 10_000;
const FIRST_RETRY = 1000;
const MAX_RETRY = 30_000;

type View = { kind: 'checking' } | { kind: 'ready'; queue: number } | { kind: 'offline'; at: number };

export function PrinterStatus({ sandbox }: { sandbox: string }) {
  const [view, setView] = useState<View>({ kind: 'checking' });
  const [now, setNow] = useState(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retry = useRef(FIRST_RETRY);
  const live = useRef(true);

  async function check() {
    clearTimeout(timer.current);
    let ok = false;
    let queue = 0;
    try {
      const res = await fetch(`/api/s/${sandbox}/printer`);
      if (res.ok) {
        ok = true;
        queue = ((await res.json()) as { queue: number }).queue;
      }
    } catch {
      ok = false;
    }
    if (!live.current) return;
    clearTimeout(timer.current);
    if (ok) {
      retry.current = FIRST_RETRY;
      setView({ kind: 'ready', queue });
      timer.current = setTimeout(() => void check(), READY_EVERY);
    } else {
      const wait = retry.current;
      retry.current = Math.min(MAX_RETRY, retry.current * 2);
      setView({ kind: 'offline', at: Date.now() + wait });
      setNow(Date.now());
      timer.current = setTimeout(() => void check(), wait);
    }
  }

  useEffect(() => {
    live.current = true;
    void check();
    return () => {
      live.current = false;
      clearTimeout(timer.current);
    };
  }, [sandbox]);

  useEffect(() => {
    if (view.kind !== 'offline') return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [view]);

  return (
    <section>
      <h1>Printer status</h1>
      <p role="status">
        {view.kind === 'checking'
          ? 'Checking the printer…'
          : view.kind === 'ready'
            ? `Printer ready. ${view.queue} jobs waiting.`
            : `Printer offline. Checking again in ${Math.max(1, Math.ceil((view.at - now) / 1000))} s.`}
      </p>
      <button type="button" onClick={() => void check()}>
        Check now
      </button>
    </section>
  );
}
