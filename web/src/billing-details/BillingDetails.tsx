import { useRef, useState, type FormEvent } from 'react';

type Buyer = 'person' | 'company';
type Field = 'name' | 'email' | 'companyName' | 'vatNumber' | 'invoiceEmail';
type Values = Record<Field, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS: Record<Field, string> = {
  name: 'Full name',
  email: 'Email',
  companyName: 'Company name',
  vatNumber: 'VAT number',
  invoiceEmail: 'Invoice email',
};

export const normaliseVat = (v: string) => v.replace(/[\s-]/g, '').toUpperCase();

function check(field: Field, value: string): string | null {
  const v = value.trim();
  if (field === 'name') return v ? null : 'Enter your full name.';
  if (field === 'companyName') return v ? null : 'Enter the company name.';
  if (field === 'vatNumber') return /^PL\d{10}$/.test(normaliseVat(v)) ? null : 'Enter a VAT number like PL1234567890.';
  return EMAIL.test(v) ? null : 'Enter an email address like name@example.com.';
}

export function BillingDetails({ sandbox }: { sandbox: string }) {
  const [buyer, setBuyer] = useState<Buyer>('person');
  const [otherEmail, setOtherEmail] = useState(false);
  const [values, setValues] = useState<Values>({ name: '', email: '', companyName: '', vatNumber: '', invoiceEmail: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState('');
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const shown: Field[] = ['name', 'email', ...(buyer === 'company' ? (['companyName', 'vatNumber'] as Field[]) : []), ...(otherEmail ? (['invoiceEmail'] as Field[]) : [])];
  const visibleErrors = shown.filter((f) => errors[f]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    const found: Partial<Record<Field, string>> = {};
    for (const f of shown) {
      const problem = check(f, values[f]);
      if (problem) found[f] = problem;
    }
    setErrors(found);
    const first = shown.find((f) => found[f]);
    if (first) {
      inputs.current[first]?.focus();
      return;
    }
    const body: Record<string, string> = { buyer };
    for (const f of shown) body[f] = f === 'vatNumber' ? normaliseVat(values[f]) : values[f].trim();
    const res = await fetch(`/api/s/${sandbox}/billing`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? 'Billing details saved.' : 'Could not save. Try again.');
  }

  const field = (f: Field, type = 'text') => (
    <p key={f}>
      <label>
        {LABELS[f]}{' '}
        <input
          ref={(el) => {
            inputs.current[f] = el;
          }}
          type={type}
          value={values[f]}
          aria-invalid={errors[f] ? true : undefined}
          aria-describedby={errors[f] ? `${f}-error` : undefined}
          onChange={(e) => setValues({ ...values, [f]: e.target.value })}
        />
      </label>
      {errors[f] && (
        <span id={`${f}-error`} className="field-error">
          {errors[f]}
        </span>
      )}
    </p>
  );

  return (
    <section>
      <h1>Billing details</h1>
      {visibleErrors.length > 0 && (
        <div role="alert" aria-labelledby="billing-problems">
          <h2 id="billing-problems">There is a problem</h2>
          <ul>
            {visibleErrors.map((f) => (
              <li key={f}>{errors[f]}</li>
            ))}
          </ul>
        </div>
      )}
      <form noValidate onSubmit={(e) => void save(e)}>
        <fieldset>
          <legend>Buying as</legend>
          <label>
            <input type="radio" name="buyer" checked={buyer === 'person'} onChange={() => setBuyer('person')} /> A private person
          </label>{' '}
          <label>
            <input type="radio" name="buyer" checked={buyer === 'company'} onChange={() => setBuyer('company')} /> A company
          </label>
        </fieldset>
        {field('name')}
        {field('email', 'email')}
        {buyer === 'company' && (
          <>
            {field('companyName')}
            {field('vatNumber')}
          </>
        )}
        <p>
          <label>
            <input type="checkbox" checked={otherEmail} onChange={(e) => setOtherEmail(e.target.checked)} /> Send invoices to a
            different email
          </label>
        </p>
        {otherEmail && field('invoiceEmail', 'email')}
        <button type="submit">Save billing details</button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
