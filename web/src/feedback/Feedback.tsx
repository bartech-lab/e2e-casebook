import { useEffect, useRef, useState, type FormEvent } from 'react';
import { json, sendJson } from '../http.ts';
import type { RatingStars } from './rating-stars.ts';
import './rating-stars.ts';

export function Feedback({ sandbox }: { sandbox: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const stars = document.createElement('rating-stars') as RatingStars;
    stars.setAttribute('aria-label', 'Rating');
    stars.addEventListener('change', () => setRating(stars.value));
    slot.current!.append(stars);
    return () => stars.remove();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return setStatus('Choose a rating.');
    try {
      const saved = await json<{ rating: number }>(await fetch(`/api/s/${sandbox}/feedback`, sendJson('POST', { rating, comment })));
      setStatus(`Thanks! You rated us ${saved.rating} of 5.`);
    } catch {
      setStatus('Could not send your feedback. Try again.');
    }
  }

  return (
    <section>
      <h1>Feedback</h1>
      <form onSubmit={onSubmit} aria-label="Feedback">
        <p>
          How did we do? <span ref={slot} />
        </p>
        <p className="field">
          <label htmlFor="feedback-comment">Comment (optional)</label>
          <textarea id="feedback-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </p>
        <p>
          <button type="submit">Send feedback</button> <span role="status">{status}</span>
        </p>
      </form>
    </section>
  );
}
