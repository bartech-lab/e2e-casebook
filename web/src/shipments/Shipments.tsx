import { useEffect, useState, type FormEvent } from 'react';

type Row = { id: number; id_str: string; to: string; status: string };
type Detail = Row & { history: string[] };

export function Shipments({ sandbox }: { sandbox: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/shipments`)
      .then((res) => res.json() as Promise<{ shipments: Row[] }>)
      .then(({ shipments }) => setRows(shipments));
  }, [sandbox]);

  async function track(tracking: string) {
    setMessage('');
    const res = await fetch(`/api/s/${sandbox}/shipments/${encodeURIComponent(tracking)}`);
    if (res.status === 404) {
      setDetail(null);
      setMessage(`No shipment with tracking number ${tracking}.`);
      return;
    }
    setDetail((await res.json()) as Detail);
  }

  function find(e: FormEvent) {
    e.preventDefault();
    const tracking = query.replace(/\s+/g, '');
    if (!/^\d+$/.test(tracking)) {
      setMessage('A tracking number has only digits.');
      return;
    }
    void track(tracking);
  }

  return (
    <section>
      <h1>Shipments</h1>
      <form onSubmit={find}>
        <label>
          Tracking number <input value={query} onChange={(e) => setQuery(e.target.value)} inputMode="numeric" autoComplete="off" />
        </label>{' '}
        <button type="submit">Find</button>
      </form>
      <table aria-label="Shipments">
        <thead>
          <tr>
            <th>Tracking number</th>
            <th>To</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id_str}>
              <td>{r.id_str}</td>
              <td>{r.to}</td>
              <td>{r.status}</td>
              <td>
                <button type="button" aria-label={`Track ${r.id_str}`} onClick={() => void track(r.id_str)}>
                  Track
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="alert">{message}</p>
      {detail && (
        <section aria-label="Shipment details">
          <h2>Shipment {detail.id_str}</h2>
          <p>
            To {detail.to}: {detail.status}
          </p>
          <ol>
            {detail.history.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
