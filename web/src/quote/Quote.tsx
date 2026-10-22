import { useState } from 'react';

const locale = navigator.language;
const decimal = new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')!.value;
const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' });
const example = `12${decimal}50`;

function parseGrosze(input: string): number | null {
  const m = new RegExp(`^(\\d{1,6})(?:\\${decimal}(\\d{1,2}))?$`).exec(input.trim());
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0'));
}

export function Quote() {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const grosze = parseGrosze(price);
  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty >= 1 && qty <= 99;

  return (
    <section>
      <h1>Quote</h1>
      <p>
        <label>
          Unit price (PLN) <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" autoComplete="off" />
        </label>{' '}
        <label>
          Quantity <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
      </p>
      {price !== '' && grosze === null && <p role="alert">Enter a price like {example}.</p>}
      {quantity !== '' && !validQty && <p role="alert">Enter a quantity from 1 to 99.</p>}
      <p>Total: {grosze !== null && validQty ? money.format((grosze * qty) / 100) : '–'}</p>
    </section>
  );
}
