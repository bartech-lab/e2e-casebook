import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';

type Values = { name: string; email: string; voice: string; diet: string[]; notes: string };
type Change = <K extends keyof Values>(key: K, value: Values[K]) => void;
const SECTIONS = ['About you', 'Food', 'Anything else'] as const;
const FIELD_SECTION: Record<string, number> = { 'choir-name': 0, 'choir-email': 0, 'choir-voice': 0, 'choir-diet-vegetarian': 1, 'choir-diet-gluten': 1, 'choir-diet-lactose': 1, 'choir-notes': 2 };
const DIETS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten', label: 'No gluten' },
  { id: 'lactose', label: 'No lactose' },
];
const WIDE = '(min-width: 600px)';

function useWide() {
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
  const focusedId = useRef<string | null>(null);
  const caret = useRef<[number, number] | null>(null);
  useEffect(() => {
    const mq = matchMedia(WIDE);
    const onChange = () => {
      const el = document.activeElement as HTMLElement | null;
      focusedId.current = el?.id || null;
      caret.current = el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === 'text') ? [el.selectionStart ?? 0, el.selectionEnd ?? 0] : null;
      setWide(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return { wide, focusedId, caret };
}

function Section({ index, values, change }: { index: number; values: Values; change: Change }) {
  if (index === 0)
    return (
      <fieldset>
        <legend>{SECTIONS[0]}</legend>
        <label htmlFor="choir-name">Name</label>
        <input id="choir-name" value={values.name} onChange={(e) => change('name', e.target.value)} />
        <label htmlFor="choir-email">Email</label>
        <input id="choir-email" type="email" value={values.email} onChange={(e) => change('email', e.target.value)} />
        <label htmlFor="choir-voice">Voice</label>
        <select id="choir-voice" value={values.voice} onChange={(e) => change('voice', e.target.value)}>
          <option value="">Choose…</option>
          <option>Soprano</option>
          <option>Alto</option>
          <option>Tenor</option>
          <option>Bass</option>
        </select>
      </fieldset>
    );
  if (index === 1)
    return (
      <fieldset>
        <legend>{SECTIONS[1]}</legend>
        {DIETS.map((d) => (
          <label key={d.id} className="choir-check">
            <input
              id={`choir-diet-${d.id}`}
              type="checkbox"
              checked={values.diet.includes(d.id)}
              onChange={(e) => change('diet', e.target.checked ? [...values.diet, d.id] : values.diet.filter((x) => x !== d.id))}
            />{' '}
            {d.label}
          </label>
        ))}
      </fieldset>
    );
  return (
    <fieldset>
      <legend>{SECTIONS[2]}</legend>
      <label htmlFor="choir-notes">Notes for the organisers</label>
      <textarea id="choir-notes" rows={4} value={values.notes} onChange={(e) => change('notes', e.target.value)} />
    </fieldset>
  );
}

export function ChoirSignup() {
  const { wide, focusedId, caret } = useWide();
  const [values, setValues] = useState<Values>({ name: '', email: '', voice: '', diet: [], notes: '' });
  const [step, setStep] = useState(0);
  const [done, setDone] = useState('');
  const change: Change = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  useLayoutEffect(() => {
    const id = focusedId.current;
    if (!id) return;
    if (!wide && FIELD_SECTION[id] !== undefined) setStep(FIELD_SECTION[id]!);
  }, [wide]);

  useEffect(() => {
    const id = focusedId.current;
    focusedId.current = null;
    if (!id) return;
    const el = document.getElementById(id);
    el?.focus();
    if (caret.current && (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) el.setSelectionRange(...caret.current);
    caret.current = null;
  }, [wide, step]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const diet = DIETS.filter((d) => values.diet.includes(d.id)).map((d) => d.label);
    setDone(
      `Thanks, ${values.name.trim() || 'singer'}. Voice: ${values.voice || 'not chosen'}. Food: ${diet.join(', ') || 'no needs'}. Notes: ${values.notes.trim() || 'none'}.`,
    );
  }

  return (
    <section>
      <h1>Choir sign-up</h1>
      <p>Sign up for the Christmas concert of the Zielona Wola choir.</p>
      {done ? (
        <p role="status">{done}</p>
      ) : (
        <form onSubmit={submit} className={wide ? 'choir-wide' : 'choir-narrow'} aria-label="Sign-up">
          {wide ? (
            SECTIONS.map((_, i) => <Section key={i} index={i} values={values} change={change} />)
          ) : (
            <>
              <p>
                Step {step + 1} of {SECTIONS.length}
              </p>
              <Section index={step} values={values} change={change} />
              <div className="choir-steps">
                {step > 0 && (
                  <button type="button" onClick={() => setStep(step - 1)}>
                    Back
                  </button>
                )}
                {step < SECTIONS.length - 1 && (
                  <button type="button" onClick={() => setStep(step + 1)}>
                    Next
                  </button>
                )}
              </div>
            </>
          )}
          {(wide || step === SECTIONS.length - 1) && <button type="submit">Sign up</button>}
        </form>
      )}
    </section>
  );
}
