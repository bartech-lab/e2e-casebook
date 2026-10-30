import { useEffect, useState, type FormEvent } from 'react';

const CURRENCIES = ['PLN', 'JPY', 'BHD'] as const;
type Currency = (typeof CURRENCIES)[number];

const digitsOf = (currency: Currency) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;

function show(minor: number, currency: Currency) {
  const digits = digitsOf(currency);
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: 'code' }).format(minor / 10 ** digits);
}

function toMinor(text: string, currency: Currency): number | string {
  const digits = digitsOf(currency);
  const m = /^(\d+)(?:\.(\d+))?$/.exec(text.trim());
  if (!m) return 'Use digits and a dot only.';
  const [, whole, frac = ''] = m;
  if (frac.length > digits) return digits === 0 ? `${currency} has no smaller unit than 1.` : `${currency} allows ${digits} decimal places.`;
  const minor = Number(whole + frac.padEnd(digits, '0'));
  if (!(minor > 0)) return 'Amount must be more than 0.';
  return minor;
}

export function TravelWallet({ sandbox }: { sandbox: string }) {
  const [balances, setBalances] = useState<Record<Currency, number> | null>(null);
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/wallet`)
      .then((r) => r.json())
      .then((d: { balances: Record<Currency, number> }) => setBalances(d.balances));
  }, [sandbox]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const minor = toMinor(amount, currency);
    if (typeof minor === 'string') {
      setError(minor);
      return;
    }
    setError('');
    const res = await fetch(`/api/s/${sandbox}/wallet/add`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currency, minor }),
    });
    if (!res.ok) {
      setStatus('Could not add the money. Try again.');
      return;
    }
    setBalances(((await res.json()) as { balances: Record<Currency, number> }).balances);
    setStatus(`Added ${show(minor, currency)}.`);
    setAmount('');
  }

  return (
    <section className="travel-wallet">
      <h1>Travel wallet</h1>
      {balances ? (
        <ul aria-label="Balances">
          {CURRENCIES.map((c) => (
            <li key={c}>{show(balances[c], c)}</li>
          ))}
        </ul>
      ) : (
        <p>Loading…</p>
      )}
      <form aria-label="Add money" onSubmit={(e) => void add(e)} noValidate>
        <label>
          Currency{' '}
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>{' '}
        <label>
          Amount <input inputMode="decimal" value={amount} aria-invalid={error ? true : undefined} aria-describedby="wallet-error" onChange={(e) => setAmount(e.target.value)} />
        </label>{' '}
        <button type="submit">Add money</button>
        <p id="wallet-error" className="wallet-error">
          {error}
        </p>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
