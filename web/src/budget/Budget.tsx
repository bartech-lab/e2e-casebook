import { useEffect, useRef, useState } from 'react';
import { pln } from '../shop/Shop.tsx';
import { addTo, bars, CATEGORIES, EMPTY, removeFrom, type Category } from './totals.ts';

type Expense = { id: number; category: Category; grosze: number };

const WIDTH = 360;
const HEIGHT = 200;

function parseAmount(text: string): number | null {
  const grosze = Math.round(Number(text.trim().replace(',', '.')) * 100);
  return text.trim() !== '' && Number.isFinite(grosze) && grosze >= 1 && grosze <= 1_000_000 ? grosze : null;
}

export function Budget() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState(EMPTY);
  const [category, setCategory] = useState<Category>('Food');
  const [amount, setAmount] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [showData, setShowData] = useState(false);
  const nextId = useRef(1);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const data = bars(totals);
    const max = Math.max(1, ...data.map((b) => b.grosze));
    const slot = WIDTH / CATEGORIES.length;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((b, i) => {
      const h = Math.round((b.grosze / max) * (HEIGHT - 50));
      const x = i * slot + slot * 0.2;
      ctx.fillStyle = '#3b6fd8';
      ctx.fillRect(x, HEIGHT - 20 - h, slot * 0.6, h);
      ctx.fillStyle = '#222';
      ctx.fillText(b.category, x + slot * 0.3, HEIGHT - 5);
      ctx.fillText(pln(b.grosze), x + slot * 0.3, HEIGHT - 25 - h);
    });
  }, [totals]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const grosze = parseAmount(amount);
    if (grosze === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setExpenses((xs) => [...xs, { id: nextId.current++, category, grosze }]);
    setTotals((t) => addTo(t, category, grosze));
    setAmount('');
  }

  function remove(x: Expense) {
    setExpenses((xs) => xs.filter((y) => y.id !== x.id));
    setTotals((t) => removeFrom(t, x.category, x.grosze));
  }

  return (
    <section>
      <h1>Budget</h1>
      <form onSubmit={add}>
        <label>
          Category{' '}
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Amount (PLN) <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button type="submit">Add expense</button>
      </form>
      {invalid && <p role="alert">Enter an amount from 0.01 to 10000 PLN.</p>}
      <ul aria-label="Expenses">
        {expenses.map((x) => (
          <li key={x.id}>
            {x.category}: {pln(x.grosze)}{' '}
            <button type="button" onClick={() => remove(x)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <h2>Spending by category</h2>
      <canvas ref={canvas} width={WIDTH} height={HEIGHT} role="img" aria-label="Bar chart of spending by category" />
      <p>
        <button type="button" aria-expanded={showData} onClick={() => setShowData((s) => !s)}>
          {showData ? 'Hide data' : 'Show data'}
        </button>
      </p>
      {showData && (
        <table aria-label="Spending by category">
          <tbody>
            {bars(totals).map((b) => (
              <tr key={b.category}>
                <th scope="row">{b.category}</th>
                <td>{pln(b.grosze)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
