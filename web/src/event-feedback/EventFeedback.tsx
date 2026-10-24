import { createElement, useRef, useState, type FormEvent } from 'react';
import './starRating.ts';

export function EventFeedback({ sandbox }: { sandbox: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) {
      const bad = Array.from(f.elements).find((el) => el.tagName !== 'FIELDSET' && el.matches(':invalid')) as (Element & { validationMessage: string }) | undefined;
      setError(bad?.validationMessage ?? 'Check the form.');
      return;
    }
    setError('');
    const res = await fetch(`/api/s/${sandbox}/event-feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(f))),
    });
    const body = (await res.json()) as { rating?: number; error?: string };
    if (!res.ok) return setError(body.error ?? 'Could not send.');
    setThanks(`Thank you. Your rating of ${body.rating} was saved.`);
    f.reset();
  }

  return (
    <section>
      <h1>Event feedback</h1>
      <p>How was the Kraków Testing Meetup on 22 October?</p>
      <label>
        <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} /> Feedback closed (organisers only)
      </label>
      <form ref={form} className="event-form" onSubmit={(e) => void submit(e)} noValidate aria-label="Event feedback">
        <fieldset disabled={closed}>
          <label>
            Your name <input name="name" required />
          </label>
          <div className="event-rating">
            <span>Rating</span> {createElement('star-rating', { name: 'rating', required: true, label: 'Rating' })}
          </div>
          <label>
            Comment <textarea name="comment" rows={3} />
          </label>
          <p role="alert">{error}</p>
          <div>
            <button type="submit">Send</button> <button type="reset">Clear</button>
          </div>
        </fieldset>
      </form>
      <p role="status">{thanks}</p>
    </section>
  );
}
