import { Component, useEffect, useState, type ReactNode } from 'react';
import { json } from '../http.ts';

type Report = (message: string) => void;

class TileBoundary extends Component<{ name: string; report: Report; children: (attempt: number) => ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.report(`${this.props.name} tile: ${error.message}`);
  }
  render() {
    if (!this.state.failed) return this.props.children(this.state.attempt);
    return (
      <p>
        This tile could not be shown.{' '}
        <button type="button" onClick={() => this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }))}>
          Try again
        </button>
      </p>
    );
  }
}

function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    void fetch(url)
      .then((res) => json<T>(res))
      .then(setData);
  }, [url]);
  return data;
}

function Orders({ sandbox }: { sandbox: string }) {
  const data = useData<{ count: number }>(`/api/s/${sandbox}/cafe/orders`);
  return <p>{data ? `${data.count} orders today` : 'Loading…'}</p>;
}

function Reviews({ sandbox }: { sandbox: string }) {
  const data = useData<{ average: number; count: number }>(`/api/s/${sandbox}/cafe/reviews`);
  return <p>{data ? `${data.average} stars from ${data.count} reviews` : 'Loading…'}</p>;
}

function Stock({ sandbox, report }: { sandbox: string; report: Report }) {
  const data = useData<{ items: { name: string; left: string }[] }>(`/api/s/${sandbox}/cafe/stock`);
  const [note, setNote] = useState('');

  async function reorder(name: string) {
    setNote('');
    try {
      const res = await fetch(`/api/s/${sandbox}/cafe/reorders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNote(`${name} reordered.`);
    } catch {
      setNote(`Could not reorder ${name}.`);
      report('Stock tile: reorder failed');
    }
  }

  if (!data) return <p>Loading…</p>;
  return (
    <>
      <ul>
        {data.items.map((item) => (
          <li key={item.name}>
            {item.name}: {item.left}{' '}
            <button type="button" aria-label={`Reorder ${item.name}`} onClick={() => void reorder(item.name)}>
              Reorder
            </button>
          </li>
        ))}
      </ul>
      <p role="status">{note}</p>
    </>
  );
}

export function CafeDashboard({ sandbox }: { sandbox: string }) {
  const report: Report = (message) =>
    void fetch(`/api/s/${sandbox}/client-errors`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) });

  return (
    <section>
      <h1>Café dashboard</h1>
      <div className="cafe-tiles">
        <section aria-label="Orders" className="cafe-tile">
          <h2>Orders</h2>
          <TileBoundary name="Orders" report={report}>
            {(attempt) => <Orders key={attempt} sandbox={sandbox} />}
          </TileBoundary>
        </section>
        <section aria-label="Stock" className="cafe-tile">
          <h2>Stock</h2>
          <TileBoundary name="Stock" report={report}>
            {(attempt) => <Stock key={attempt} sandbox={sandbox} report={report} />}
          </TileBoundary>
        </section>
        <section aria-label="Reviews" className="cafe-tile">
          <h2>Reviews</h2>
          <TileBoundary name="Reviews" report={report}>
            {(attempt) => <Reviews key={attempt} sandbox={sandbox} />}
          </TileBoundary>
        </section>
      </div>
    </section>
  );
}
