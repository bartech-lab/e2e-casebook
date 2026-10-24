import { useState, type FormEvent } from 'react';
import { json } from '../http.ts';

type Field = 'givenName' | 'familyName' | 'email' | 'tel' | 'postalCode' | 'city' | 'street';
type Values = Record<Field, string>;

const FIELDS: { name: Field; label: string; autoComplete: string; type?: string }[] = [
  { name: 'givenName', label: 'First name', autoComplete: 'given-name' },
  { name: 'familyName', label: 'Last name', autoComplete: 'family-name' },
  { name: 'email', label: 'Email', autoComplete: 'email', type: 'email' },
  { name: 'tel', label: 'Phone', autoComplete: 'tel', type: 'tel' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'street', label: 'Street and number', autoComplete: 'address-line1' },
];
const EMPTY: Values = { givenName: '', familyName: '', email: '', tel: '', postalCode: '', city: '', street: '' };
const POSTAL = /^\d{2}-?\d{3}$/;

function problem(field: Field, value: string): string | null {
  const v = value.trim();
  if (!v) return 'Fill this in.';
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter an email like name@example.com.';
  if (field === 'postalCode' && !POSTAL.test(v)) return 'Enter a postal code like 00-950.';
  return null;
}

export function TicketContact({ sandbox }: { sandbox: string }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState('');

  function lookUp(code: string) {
    const normal = code.replace(/^(\d{2})(\d{3})$/, '$1-$2');
    void fetch(`/api/s/${sandbox}/postcodes/${normal}`)
      .then((r) => json<{ city: string }>(r))
      .then(({ city }) => {
        setValues((cur) => {
          if (cur.city) return cur;
          setErrors((errs) => ({ ...errs, city: undefined }));
          return { ...cur, city };
        });
      })
      .catch(() => undefined);
  }

  function change(field: Field, value: string) {
    setValues((cur) => ({ ...cur, [field]: value }));
    setErrors((cur) => ({ ...cur, [field]: undefined }));
    if (field === 'postalCode' && POSTAL.test(value.trim())) lookUp(value.trim());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    const found: Partial<Record<Field, string>> = {};
    for (const f of FIELDS) {
      const p = problem(f.name, values[f.name]);
      if (p) found[f.name] = p;
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = Object.fromEntries(FIELDS.map((f) => [f.name, f.name === 'postalCode' ? values.postalCode.trim().replace(/^(\d{2})(\d{3})$/, '$1-$2') : values[f.name].trim()]));
    const res = await fetch(`/api/s/${sandbox}/ticket-contacts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? `Details saved for ${values.givenName.trim()}.` : 'Could not save. Try again.');
  }

  return (
    <section>
      <h1>Ticket contact</h1>
      <p>Where should we send your tickets?</p>
      <form noValidate onSubmit={(e) => void submit(e)}>
        {FIELDS.map((f) => (
          <p key={f.name}>
            <label>
              {f.label}{' '}
              <input
                name={f.name}
                type={f.type ?? 'text'}
                autoComplete={f.autoComplete}
                value={values[f.name]}
                onChange={(e) => change(f.name, e.target.value)}
                aria-invalid={errors[f.name] ? true : undefined}
                aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
              />
            </label>
            {errors[f.name] && (
              <span id={`${f.name}-error`} className="field-error">
                {errors[f.name]}
              </span>
            )}
          </p>
        ))}
        <button type="submit">Continue</button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
