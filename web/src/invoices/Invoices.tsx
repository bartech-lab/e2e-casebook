import { useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';

type Invoice = { number: string; date: string; customer: string; total: number };

const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function Invoices({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/invoices`;
  const invoices = useQuery({ queryKey: ['invoices', sandbox], queryFn: async () => json<{ invoices: Invoice[] }>(await fetch(url)) });
  const list = invoices.data?.invoices ?? [];

  return (
    <section>
      <h1>Invoices</h1>
      <table>
        <thead>
          <tr>
            <th scope="col">Number</th>
            <th scope="col">Date</th>
            <th scope="col">Customer</th>
            <th scope="col">Total</th>
            <th scope="col">PDF</th>
          </tr>
        </thead>
        <tbody>
          {list.map((inv) => (
            <tr key={inv.number}>
              <th scope="row">{inv.number}</th>
              <td>{inv.date}</td>
              <td>{inv.customer}</td>
              <td>{pln(inv.total)}</td>
              <td>
                <a href={`${url}/${inv.number}.pdf`} download aria-label={`Download ${inv.number} as PDF`}>
                  Download PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
