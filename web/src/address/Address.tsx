import { useEffect, useState, type FormEvent } from 'react';
import { navigate, setBlocker } from '../router.tsx';

type Fields = { street: string; city: string; postcode: string };

const EMPTY: Fields = { street: '', city: '', postcode: '' };
const key = (sandbox: string) => `address:${sandbox}`;
const LABELS: [keyof Fields, string][] = [
  ['street', 'Street'],
  ['city', 'City'],
  ['postcode', 'Postcode'],
];

function read(sandbox: string): Fields {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(key(sandbox)) ?? '{}') as Partial<Fields>) };
  } catch {
    return EMPTY;
  }
}

export function Address({ sandbox }: { sandbox: string }) {
  const [saved, setSaved] = useState(() => read(sandbox));
  const [values, setValues] = useState(saved);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const dirty = LABELS.some(([f]) => values[f] !== saved[f]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    addEventListener('beforeunload', onBeforeUnload);
    const release = setBlocker((path) => {
      setPending(path);
      return true;
    });
    return () => {
      removeEventListener('beforeunload', onBeforeUnload);
      release();
    };
  }, [dirty]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    localStorage.setItem(key(sandbox), JSON.stringify(values));
    setSaved(values);
    setStatus('Address saved.');
  }

  function leave() {
    const path = pending!;
    setPending(null);
    navigate(path, { force: true });
  }

  return (
    <section>
      <h1>Address</h1>
      <form onSubmit={onSubmit} aria-label="Address">
        {LABELS.map(([f, label]) => (
          <p className="field" key={f}>
            <label htmlFor={`address-${f}`}>{label}</label>
            <input id={`address-${f}`} value={values[f]} onChange={(e) => setValues({ ...values, [f]: e.target.value })} />
          </p>
        ))}
        <p>
          <button type="submit">Save</button> <span role="status">{status}</span>
        </p>
      </form>
      {pending && (
        <div className="modal-backdrop">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="address-leave" aria-describedby="address-leave-text">
            <h2 id="address-leave">Leave without saving?</h2>
            <p id="address-leave-text">Your changes to the address will be lost.</p>
            <p>
              <button type="button" autoFocus onClick={() => setPending(null)}>
                Stay
              </button>{' '}
              <button type="button" onClick={leave}>
                Leave
              </button>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
