import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';

type Order = { number: number; customer: string; total: number; date: string };
type Column = 'number' | 'customer' | 'total' | 'date';
type Page = { orders: Order[]; page: number; pages: number; count: number };

const COLUMNS: [Column, string][] = [
  ['number', 'Order'],
  ['customer', 'Customer'],
  ['total', 'Total'],
  ['date', 'Date'],
];
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function Orders({ sandbox }: { sandbox: string }) {
  const [sort, setSort] = useState<{ column: Column; dir: 'asc' | 'desc' }>({ column: 'number', dir: 'asc' });
  const [page, setPage] = useState(1);
  const query = `sort=${sort.column}&dir=${sort.dir}&page=${page}`;
  const data = useQuery({
    queryKey: ['orders', sandbox, query],
    queryFn: async () => json<Page>(await fetch(`/api/s/${sandbox}/order-list?${query}`)),
    placeholderData: keepPreviousData,
  });

  function sortBy(column: Column) {
    setSort((s) => ({ column, dir: s.column === column && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  }

  const pages = data.data?.pages ?? 1;

  return (
    <section>
      <h1>Orders</h1>
      <table aria-label="Orders" aria-busy={data.isFetching}>
        <thead>
          <tr>
            {COLUMNS.map(([column, label]) => (
              <th key={column} scope="col" aria-sort={sort.column === column ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => sortBy(column)}>
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data?.orders.map((o) => (
            <tr key={o.number}>
              <th scope="row">{o.number}</th>
              <td>{o.customer}</td>
              <td>{pln(o.total)}</td>
              <td>{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>{' '}
        <span>
          Page {page} of {pages}
        </span>{' '}
        <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </p>
    </section>
  );
}
