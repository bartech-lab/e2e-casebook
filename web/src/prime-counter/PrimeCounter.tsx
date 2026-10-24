import { useEffect, useRef, useState, type FormEvent } from 'react';

const MAX = 2_000_000_000;
type Reply = { job: number; percent?: number; count?: number };

function startWorker(onReply: (reply: Reply) => void) {
  const worker = new Worker(new URL('./primes.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<Reply>) => onReply(e.data);
  return worker;
}

export function PrimeCounter() {
  const [input, setInput] = useState('1000000000');
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const worker = useRef<{ postMessage(m: unknown): void; terminate(): void } | null>(null);
  const job = useRef(0);
  const asked = useRef(0);

  function stop() {
    worker.current?.terminate();
    worker.current = null;
  }

  useEffect(() => stop, []);

  function onReply(reply: Reply) {
    if (reply.job !== job.current) return;
    if (reply.count !== undefined) {
      setProgress(null);
      setResult(`There are ${reply.count.toLocaleString('en-US')} primes up to ${asked.current.toLocaleString('en-US')}.`);
      stop();
    } else if (reply.percent !== undefined) setProgress(reply.percent);
  }

  function count(e: FormEvent) {
    e.preventDefault();
    const n = Number(input.replace(/[,\s_]/g, ''));
    if (!Number.isInteger(n) || n < 1 || n > MAX) {
      setNote(`Enter a whole number from 1 to ${MAX.toLocaleString('en-US')}.`);
      return;
    }
    stop();
    setNote('');
    setResult('');
    setProgress(0);
    asked.current = n;
    job.current += 1;
    worker.current = startWorker(onReply);
    worker.current.postMessage({ job: job.current, n });
  }

  function cancel() {
    stop();
    job.current += 1;
    setProgress(null);
    setNote('Cancelled.');
  }

  return (
    <section>
      <h1>Prime counter</h1>
      <p>The maths club counts the prime numbers up to a limit. Big limits take a few seconds.</p>
      <form onSubmit={count}>
        <label>
          Count primes up to <input value={input} onChange={(e) => setInput(e.target.value)} inputMode="numeric" />
        </label>{' '}
        <button type="submit">Count</button>{' '}
        {progress !== null && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
      </form>
      {progress !== null && (
        <p>
          <progress max={100} value={progress} aria-label="Counting" /> Counting… {progress}%
        </p>
      )}
      <p role="status">{note || result}</p>
    </section>
  );
}
