import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Country = 'PL' | 'US' | 'UK';
type Address = { country: Country; postcode: string; state?: string };

const COUNTRIES: [Country, string][] = [
  ['PL', 'Poland'],
  ['US', 'United States'],
  ['UK', 'United Kingdom'],
];
const FORMAT: Record<Country, { label: string; hint: string; re: RegExp }> = {
  PL: { label: 'Postcode', hint: 'Like 80-001.', re: /^\d{2}-\d{3}$/ },
  US: { label: 'ZIP code', hint: 'Like 94105 or 94105-1234.', re: /^\d{5}(-\d{4})?$/ },
  UK: { label: 'Postcode', hint: 'Like SW1A 1AA.', re: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i },
};
const STATES = [
  ['CA', 'California'],
  ['NY', 'New York'],
  ['TX', 'Texas'],
];

export function Shipping({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['shipping', sandbox];
  const url = `/api/s/${sandbox}/shipping`;
  const saved = useQuery({ queryKey: key, queryFn: async () => json<{ address: Address | null }>(await fetch(url)) });
  const [country, setCountry] = useState<Country>('PL');
  const [postcode, setPostcode] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState<{ postcode?: string; state?: string }>({});
  const [status, setStatus] = useState('');
  const format = FORMAT[country];

  function changeCountry(next: Country) {
    setCountry(next);
    setErrors({});
    if (next !== 'US') setState('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!format.re.test(postcode.trim())) next.postcode = `Enter a ${format.label.toLowerCase()}. ${format.hint}`;
    if (country === 'US' && !state) next.state = 'Choose a state.';
    setErrors(next);
    if (next.postcode || next.state) return;
    const body: Address = country === 'US' ? { country, postcode, state } : { country, postcode };
    try {
      const res = await json<{ address: Address }>(await fetch(url, sendJson('PUT', body)));
      client.setQueryData(key, res);
      setStatus('Address saved.');
    } catch {
      setStatus('Could not save the address. Try again.');
    }
  }

  const address = saved.data?.address;

  return (
    <section>
      <h1>Shipping address</h1>
      <form onSubmit={onSubmit} noValidate aria-label="Shipping address">
        <p className="field">
          <label htmlFor="ship-country">Country</label>
          <select id="ship-country" value={country} onChange={(e) => changeCountry(e.target.value as Country)}>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </p>
        {country === 'US' && (
          <p className="field">
            <label htmlFor="ship-state">State</label>
            <select id="ship-state" value={state} onChange={(e) => setState(e.target.value)} aria-describedby={errors.state ? 'ship-state-error' : undefined}>
              <option value="">Choose…</option>
              {STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            {errors.state && (
              <span id="ship-state-error" className="field-error">
                {errors.state}
              </span>
            )}
          </p>
        )}
        <p className="field">
          <label htmlFor="ship-postcode">{format.label}</label>
          <input id="ship-postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} aria-describedby={errors.postcode ? 'ship-postcode-error' : undefined} />
          {errors.postcode && (
            <span id="ship-postcode-error" className="field-error">
              {errors.postcode}
            </span>
          )}
        </p>
        <p>
          <button type="submit">Save address</button> <span role="status">{status}</span>
        </p>
      </form>
      <h2>Saved address</h2>
      <p aria-label="Saved address">{address ? [address.country, address.state, address.postcode].filter(Boolean).join(', ') : 'None yet.'}</p>
    </section>
  );
}
