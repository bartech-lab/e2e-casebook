import { useState, type FormEvent } from 'react';
import { distance, lockerList, LOCKERS } from './lockers.ts';

export function ParcelLockers() {
  const lockers = lockerList(LOCKERS);
  const [choice, setChoice] = useState('');
  const [status, setStatus] = useState('');

  function send(e: FormEvent) {
    e.preventDefault();
    const locker = lockers.find((l) => l.id === choice && !l.full);
    setStatus(locker ? `Your parcel goes to ${locker.id}, ${locker.street}.` : 'Choose a locker.');
  }

  return (
    <section className="parcel-lockers">
      <h1>Parcel lockers</h1>
      <form onSubmit={send}>
        <fieldset>
          <legend>Lockers near you</legend>
          {lockers.map((l) => (
            <label key={l.id} className={l.full ? 'locker full' : 'locker'}>
              <input type="radio" name="locker" value={l.id} disabled={l.full} checked={choice === l.id} onChange={() => setChoice(l.id)} />{' '}
              {l.id}, {l.street}, {distance(l.metres)}
              {l.full ? ', full' : ''}
            </label>
          ))}
        </fieldset>
        <button type="submit">Send here</button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
