import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FEATURES = [
  'Pool',
  'Breakfast included',
  'Free parking',
  'Pets allowed',
  'Free cancellation',
  'Gym',
  'Spa',
  'Sea view',
  'Airport shuttle',
  'EV charging',
  'Family rooms',
  'Step-free access',
  'Air conditioning',
  'Kitchen',
  'Late check-out',
  'Bike rental',
];
const HOTELS = [
  ['Hotel Bałtyk', 'Pool', 'Sea view', 'Breakfast included', 'Spa'],
  ['Pod Lipami', 'Free parking', 'Pets allowed', 'Kitchen'],
  ['Grand Sopot', 'Pool', 'Gym', 'Spa', 'Late check-out', 'Air conditioning'],
  ['Mewa Rooms', 'Free cancellation', 'Bike rental', 'Sea view'],
  ['Airport Inn', 'Airport shuttle', 'Free parking', 'EV charging', 'Air conditioning'],
  ['Dom Rybaka', 'Family rooms', 'Kitchen', 'Pets allowed', 'Free cancellation'],
  ['Hostel Molo', 'Bike rental', 'Late check-out'],
  ['Villa Oliwa', 'Breakfast included', 'Step-free access', 'Free parking', 'Family rooms'],
  ['Park Hotel', 'Gym', 'EV charging', 'Step-free access', 'Breakfast included'],
  ['Wydmy Resort', 'Pool', 'Spa', 'Family rooms', 'Sea view', 'Free cancellation'],
  ['City Loft', 'Kitchen', 'Air conditioning'],
  ['Stara Przystań', 'Pets allowed', 'Sea view', 'Breakfast included'],
].map(([name, ...features]) => ({ name: name!, features }));

export function HotelSearch() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const opener = useRef<HTMLButtonElement>(null);
  const firstBox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstBox.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    opener.current?.focus();
  }

  const shown = HOTELS.filter((h) => applied.every((f) => h.features.includes(f)));
  const sheet = open && (
    <div className="hotel-sheet" role="dialog" aria-modal="true" aria-labelledby="hotel-sheet-title">
      <div className="hotel-sheet-head">
        <h2 id="hotel-sheet-title">Filters</h2>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      <fieldset className="hotel-sheet-list">
        <legend>The hotel must have</legend>
        {FEATURES.map((f, i) => (
          <label key={f}>
            <input
              ref={i === 0 ? firstBox : undefined}
              type="checkbox"
              checked={draft.includes(f)}
              onChange={(e) => setDraft(e.target.checked ? [...draft, f] : draft.filter((d) => d !== f))}
            />{' '}
            {f}
          </label>
        ))}
      </fieldset>
      <div className="hotel-sheet-foot">
        <button
          type="button"
          onClick={() => {
            setApplied(draft);
            close();
          }}
        >
          Show hotels
        </button>
      </div>
    </div>
  );

  return (
    <section>
      <h1>Hotels</h1>
      <div className="hotel-bar">
        <strong>Stays in Sopot</strong>
        <button
          ref={opener}
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setDraft(applied);
            setOpen(true);
          }}
        >
          Filters{applied.length > 0 && ` (${applied.length})`}
        </button>
      </div>
      <p role="status">{shown.length === 1 ? '1 hotel' : `${shown.length} hotels`}</p>
      <ul aria-label="Hotels" className="hotel-list">
        {shown.map((h) => (
          <li key={h.name}>
            <strong>{h.name}</strong>
            <span>{h.features.join(', ')}</span>
          </li>
        ))}
      </ul>
      {sheet && createPortal(sheet, document.body)}
    </section>
  );
}
