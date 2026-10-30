import { useState, type FormEvent } from 'react';

export function CourierPickup() {
  const [status, setStatus] = useState('');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const missing = ['name', 'phone', 'street', 'postcode', 'city', 'date'].filter((k) => !String(data.get(k) ?? '').trim());
    setStatus(missing.length ? 'Fill in every field except Notes.' : `Pickup booked for ${String(data.get('date'))}.`);
  }

  return (
    <section className="courier-pickup">
      <h1>Courier pickup</h1>
      <form onSubmit={submit} noValidate>
        <div className="courier-grid">
          <label className="courier-name">
            Name <input name="name" autoComplete="name" />
          </label>
          <label className="courier-phone">
            Phone <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="courier-street">
            Street <input name="street" autoComplete="street-address" />
          </label>
          <label className="courier-postcode">
            Postcode <input name="postcode" autoComplete="postal-code" />
          </label>
          <label className="courier-city">
            City <input name="city" autoComplete="address-level2" />
          </label>
          <label className="courier-date">
            Pickup date <input name="date" type="date" />
          </label>
          <label className="courier-notes">
            Notes <textarea name="notes" rows={2} />
          </label>
        </div>
        <div className="courier-actions">
          <button type="button" onClick={() => setStatus('Nothing booked.')}>
            Back
          </button>
          <button type="button" onClick={() => setStatus('Draft saved.')}>
            Save draft
          </button>
          <button type="submit">Book pickup</button>
        </div>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
