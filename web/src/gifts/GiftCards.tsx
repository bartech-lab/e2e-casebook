import { useState } from 'react';
import { pln } from '../shop/Shop.tsx';
import { summarize } from './summary.ts';

const PRESETS = [5000, 10000, 20000];

function parseAmount(text: string): number | null {
  const grosze = Math.round(Number(text.trim().replace(',', '.')) * 100);
  return text.trim() !== '' && Number.isFinite(grosze) && grosze >= 2000 && grosze <= 50000 ? grosze : null;
}

export function GiftCards() {
  const [preset, setPreset] = useState<number | 'custom'>(5000);
  const [custom, setCustom] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wrap, setWrap] = useState(false);

  const amount = preset === 'custom' ? parseAmount(custom) : preset;
  const summary = amount === null ? null : summarize(amount, quantity, wrap);

  return (
    <section>
      <h1>Gift cards</h1>
      <fieldset>
        <legend>Amount</legend>
        {PRESETS.map((p) => (
          <label key={p}>
            <input type="radio" name="amount" checked={preset === p} onChange={() => setPreset(p)} /> {pln(p)}
          </label>
        ))}
        <label>
          <input type="radio" name="amount" checked={preset === 'custom'} onChange={() => setPreset('custom')} /> Custom
        </label>
        {preset === 'custom' && (
          <label>
            {' '}Custom amount (PLN) <input inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} />
          </label>
        )}
      </fieldset>
      {preset === 'custom' && amount === null && <p role="alert">Enter an amount from 20 to 500 PLN.</p>}
      <p>
        <label>
          Quantity{' '}
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(10, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))}
          />
        </label>{' '}
        <label>
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> Gift wrap (5.00 PLN per card)
        </label>
      </p>
      {summary && (
        <table aria-label="Summary">
          <tbody>
            <tr>
              <th scope="row">Card value</th>
              <td>{pln(summary.value)}</td>
            </tr>
            <tr>
              <th scope="row">Wrapping</th>
              <td>{pln(summary.wrapping)}</td>
            </tr>
            <tr>
              <th scope="row">Total</th>
              <td>{pln(summary.total)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {amount !== null && (
        <div hidden data-testid="gift-summary">
          <span data-testid="gift-value">{pln(amount * quantity)}</span>
          <span data-testid="gift-wrapping">{pln(wrap && quantity < 5 ? 500 * quantity : 0)}</span>
          <span data-testid="gift-total">{pln(amount * quantity + (wrap && quantity < 5 ? 500 * quantity : 0))}</span>
        </div>
      )}
    </section>
  );
}
