import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ['name', 'email', 'password'];

function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter an email address like ann@example.com.';
  if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

export function Signup() {
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState(false);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const submit = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const opened = useRef(false);

  useEffect(() => {
    if (created) dialog.current?.querySelector<HTMLElement>('button')?.focus();
    else if (opened.current) submit.current?.focus();
    opened.current = created;
  }, [created]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    const first = FIELDS.find((f) => next[f]);
    if (first) inputs.current[first]?.focus();
    else setCreated(true);
  }

  function close() {
    setCreated(false);
    setValues({ name: '', email: '', password: '' });
  }

  function onDialogKey(e: KeyboardEvent) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const items = [...dialog.current!.querySelectorAll<HTMLElement>('button')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const to = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : (at + 1) % items.length;
    e.preventDefault();
    items[to]?.focus();
  }

  const field = (f: Field, label: string, type = 'text') => (
    <p className="field">
      <label htmlFor={`signup-${f}`}>{label}</label>
      <input
        id={`signup-${f}`}
        ref={(el) => {
          inputs.current[f] = el;
        }}
        type={type}
        value={values[f]}
        aria-invalid={errors[f] ? true : undefined}
        aria-describedby={errors[f] ? `signup-${f}-error` : undefined}
        onChange={(e) => setValues({ ...values, [f]: e.target.value })}
      />
      {errors[f] && (
        <span id={`signup-${f}-error`} className="field-error">
          {errors[f]}
        </span>
      )}
    </p>
  );

  return (
    <section>
      <h1>Sign up</h1>
      <form noValidate onSubmit={onSubmit} aria-label="Sign up" inert={created}>
        {field('name', 'Name')}
        {field('email', 'Email', 'email')}
        {field('password', 'Password', showPassword ? 'text' : 'password')}
        <p>
          <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((s) => !s)}>
            Show password
          </button>{' '}
          <button type="submit" ref={submit}>
            Create account
          </button>
        </p>
      </form>
      {created && (
        <div className="modal-backdrop">
          <div ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="signup-done" onKeyDown={onDialogKey}>
            <h2 id="signup-done">Account created</h2>
            <p>Welcome, {values.name}. You can take a short tour now or later from the menu.</p>
            <p>
              <button type="button" onClick={close}>
                Start tour
              </button>{' '}
              <button type="button" onClick={close}>
                Close
              </button>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
