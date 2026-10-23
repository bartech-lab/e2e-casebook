import { useState } from 'react';

const ITEMS = [
  ['Coffee beans', 59.9],
  ['Tea', 18.5],
  ['Oat milk', 9.99],
  ['Honey', 32],
  ['Granola', 21.4],
  ['Dark chocolate', 12.75],
  ['Olive oil', 44.9],
  ['Pasta', 7.6],
  ['Tomatoes', 11.2],
  ['Basil', 5.5],
  ['Parmesan', 28.9],
  ['Bread', 6.5],
] as const;

const pln = (n: number) => `${n.toFixed(2)} PLN`;

export function Review() {
  const [qty, setQty] = useState<number[]>(ITEMS.map(() => 1));
  const [accepted, setAccepted] = useState(false);
  const [paid, setPaid] = useState('');
  const total = ITEMS.reduce((sum, [, price], i) => sum + price * qty[i]!, 0);
  const change = (i: number, by: number) => setQty(qty.map((q, k) => (k === i ? Math.max(0, q + by) : q)));

  return (
    <section className="checkout-page">
      <h1>Review your order</h1>
      <div className="co-scroll">
        <div className="co-header">
          <strong>Corner Shop</strong> · Checkout · <a href="#terms">Read the terms</a>
        </div>
        <ul aria-label="Items" className="co-items">
          {ITEMS.map(([name, price], i) => (
            <li key={name}>
              <span>{name}</span>
              <span>
                <button type="button" aria-label={`Fewer ${name}`} onClick={() => change(i, -1)}>
                  −
                </button>
                <output aria-label={`Quantity of ${name}`}>{qty[i]}</output>
                <button type="button" aria-label={`More ${name}`} onClick={() => change(i, 1)}>
                  +
                </button>
              </span>
              <span>{pln(price * qty[i]!)}</span>
            </li>
          ))}
        </ul>
        <h2 id="terms">Terms</h2>
        <div className="co-terms">
          <p>Orders are packed the same day and leave the shop before 18:00.</p>
          <p>Fresh goods cannot be returned. Everything else can be returned within 14 days in its original packaging.</p>
          <p>Delivery is free above 150.00 PLN. Below that, delivery costs 12.00 PLN.</p>
          <p>If something arrives damaged, send us a photo within 2 days and we replace it.</p>
          <p>We keep your address only to deliver this order, and delete it after 30 days.</p>
          <p>Prices include VAT. An invoice is sent by email when the order leaves the shop.</p>
        </div>
        <label className="co-accept">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> I accept the terms
        </label>
        <label className="co-note">
          Gift message <textarea rows={2} />
        </label>
        <div className="co-footer">
          <span>
            Total <strong>{pln(total)}</strong>
          </span>
          {paid ? (
            <span role="status">{paid}</span>
          ) : (
            <button type="button" disabled={!accepted || total === 0} onClick={() => setPaid(`Paid ${pln(total)}.`)}>
              Pay now
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
