import { useEffect, useState } from 'react';

const LINES: [string, number][] = [
  ['Bread', 650],
  ['Extra-large organic free-range eggs, box of 30', 4299],
  ['Milk', 449],
  ['Coffee beans', 5990],
  ['Gift card GC7F3K9Q2M8X4R1T6V5W2Y8Z0N4P', 10000],
];

const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function Receipt() {
  const [dark, setDark] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [order] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section>
      <h1>Receipt</h1>
      <p>
        <button type="button" aria-pressed={dark} onClick={() => setDark((d) => !d)}>
          Dark mode
        </button>
      </p>
      <article className={dark ? 'receipt dark' : 'receipt'} aria-label="Receipt">
        <header>
          <strong>Corner Shop</strong>
          <span className="order">Order #{order}</span>
          <span className="printed">Printed at {now.toLocaleTimeString('en-GB')}</span>
        </header>
        <table>
          <tbody>
            {LINES.map(([name, price]) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>{pln(price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total">
              <th scope="row">Total</th>
              <td>{pln(LINES.reduce((sum, [, p]) => sum + p, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </article>
    </section>
  );
}
