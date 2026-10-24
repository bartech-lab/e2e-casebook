import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';

type Statement = { month: string; rows: { date: string; description: string; amount: string }[]; total: string };
const MONTHS = [
  ['2026-09', 'September 2026'],
  ['2026-10', 'October 2026'],
  ['2026-11', 'November 2026'],
];

export function StatementPage({ sandbox }: { sandbox: string }) {
  const [month, setMonth] = useState('2026-10');
  const base = `/api/s/${sandbox}`;
  const statement = useQuery({ queryKey: ['statement', sandbox, month], queryFn: async () => json<Statement>(await fetch(`${base}/statement?month=${month}`)) });

  return (
    <section>
      <h1>Statement</h1>
      <p>
        <label>
          Month{' '}
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>{' '}
        <a href={`${base}/statement.csv?month=${month}`}>Download CSV</a>
      </p>
      {statement.data && (
        <table className="statement">
          <caption>Transactions, Warsaw time</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description</th>
              <th scope="col">Amount (PLN)</th>
            </tr>
          </thead>
          <tbody>
            {statement.data.rows.map((r) => (
              <tr key={r.date + r.description}>
                <td>{r.date}</td>
                <td>{r.description}</td>
                <td>{r.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total
              </th>
              <td>{statement.data.total}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
