import { useState } from 'react';

const PRICES = { adult: 3200, child: 3200 };
const MAX_PASSENGERS = 9;

const pln = (grosz: number) => `${(grosz / 100).toFixed(2)} PLN`;

function total(adults: number, children: number) {
  const full = adults * PRICES.adult + children * PRICES.child;
  const family = adults === 2 && children >= 2;
  return { full, discount: family ? Math.round(full / 10) : 0 };
}

export function FerryTickets() {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const tooMany = adults + children > MAX_PASSENGERS;
  const { full, discount } = total(adults, children);

  return (
    <section className="ferry-tickets">
      <h1>Ferry tickets</h1>
      <p>Hel to Gdynia, 10:30.</p>
      <label>
        Adults <input type="number" min={0} max={9} value={adults} onChange={(e) => setAdults(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} />
      </label>{' '}
      <label>
        Children under 12 <input type="number" min={0} max={9} value={children} onChange={(e) => setChildren(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} />
      </label>
      {tooMany ? (
        <p role="alert">At most 9 passengers per booking.</p>
      ) : (
        <dl className="ferry-total">
          <dt>Tickets</dt>
          <dd>{pln(full)}</dd>
          {discount > 0 && (
            <>
              <dt>Family discount</dt>
              <dd>−{pln(discount)}</dd>
            </>
          )}
          <dt>Total</dt>
          <dd>{pln(full - discount)}</dd>
        </dl>
      )}
    </section>
  );
}
