import { useState, type FormEvent } from 'react';
import { HttpError, json, sendJson } from '../http.ts';

const MIN = 12;
const EMAIL = 'alice@example.com';

type FieldProps = { id: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void };

function PasswordField({ id, label, autoComplete, value, onChange }: FieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-row">
        <input
          id={id}
          name={id}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label={`Show ${label.toLowerCase()}`}
          aria-pressed={shown}
          aria-controls={id}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShown((s) => !s)}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export function ChangePassword({ sandbox }: { sandbox: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if ([...next].length < MIN) return setError(`The new password needs at least ${MIN} characters.`);
    if (next !== again) return setError('The new passwords do not match.');
    setError('');
    setSaving(true);
    try {
      await json(await fetch(`/api/s/${sandbox}/password`, sendJson('POST', { current, next })));
      setCurrent('');
      setNext('');
      setAgain('');
      setDone(true);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not change the password. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h1>Change password</h1>
      <form className="password-form" onSubmit={(e) => void submit(e)} noValidate>
        <label htmlFor="account-email">Account</label>
        <input id="account-email" name="username" type="email" autoComplete="username" value={EMAIL} readOnly />
        <PasswordField id="current-password" label="Current password" autoComplete="current-password" value={current} onChange={setCurrent} />
        <PasswordField id="new-password" label="New password" autoComplete="new-password" value={next} onChange={setNext} />
        <PasswordField id="confirm-password" label="Confirm new password" autoComplete="new-password" value={again} onChange={setAgain} />
        <button type="submit" disabled={saving}>
          Change password
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p role="status">{done ? 'Password changed.' : ''}</p>
    </section>
  );
}
