import { useEffect, useRef, useState } from 'react';
import { REGIONS, type Totals } from './report-core.ts';

type Message = { type: 'progress'; done: number; total: number } | { type: 'done'; totals: Totals };

const money = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const count = new Intl.NumberFormat('en-GB');

export function Report() {
  const worker = useRef<Worker | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => () => worker.current?.terminate(), []);

  function build() {
    worker.current?.terminate();
    const w = new Worker(new URL('./report.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setTotals(null);
    setPercent(0);
    setStatus('Building the report…');
    w.onmessage = (e: MessageEvent<Message>) => {
      if (e.data.type === 'progress') setPercent(Math.round((e.data.done / e.data.total) * 100));
      else {
        setTotals(e.data.totals);
        setPercent(null);
        setStatus('Report ready.');
        w.terminate();
        worker.current = null;
      }
    };
    w.postMessage('start');
  }

  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    setPercent(null);
    setStatus('Cancelled.');
  }

  return (
    <section>
      <h1>Sales report</h1>
      <p>Adds up 20,000,000 sales by region, in the background.</p>
      <p>
        <button type="button" onClick={build} disabled={percent !== null}>
          Build report
        </button>{' '}
        <button type="button" onClick={cancel} disabled={percent === null}>
          Cancel
        </button>
      </p>
      {percent !== null && (
        <p>
          <progress aria-label="Report progress" max={100} value={percent} /> {percent}%
        </p>
      )}
      <p role="status">{status}</p>
      <label>
        Notes <input />
      </label>
      {totals && (
        <table>
          <caption>Sales by region</caption>
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Orders</th>
              <th scope="col">Revenue (PLN)</th>
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((name, i) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>{count.format(totals.orders[i]!)}</td>
                <td>{money.format(totals.cents[i]! / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
