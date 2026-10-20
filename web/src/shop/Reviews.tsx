import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';
import { Link } from '../router.tsx';

type Review = { id: number; name: string; rating: number; text: string; createdAt: string; edited: boolean };
type ReviewList = { average: number | null; count: number; reviews: Review[] };
type Product = { sku: string; name: string; price: number };

const tokenKey = (sandbox: string, sku: string, id: number) => `review-token:${sandbox}:${sku}:${id}`;

export function Reviews({ sandbox, sku, name }: { sandbox: string; sku: string; name: string }) {
  const url = `/api/s/${sandbox}/products/${sku}/reviews`;
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ['products', sandbox],
    queryFn: async () => (await json<{ products: Product[] }>(await fetch(`/api/s/${sandbox}/products`))).products,
    staleTime: Infinity,
  });
  const list = useQuery({ queryKey: ['reviews', sandbox, sku], queryFn: async () => json<ReviewList>(await fetch(url)) });
  const [author, setAuthor] = useState(name);
  const [rating, setRating] = useState('');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<Review | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['reviews', sandbox, sku] });
  const post = useMutation({
    mutationFn: async () =>
      json<Review & { editToken: string }>(await fetch(url, sendJson('POST', { name: author, rating: Number(rating), text }))),
    onSuccess: (review) => {
      localStorage.setItem(tokenKey(sandbox, sku, review.id), review.editToken);
      setRating('');
      setText('');
      void refresh();
    },
  });

  const product = products.data?.find((p) => p.sku === sku);
  if (list.isError) return <p role="alert">Could not load reviews: {list.error.message}</p>;
  if (!list.data || !products.data) return <p>Loading reviews…</p>;
  if (!product) return <p role="alert">Unknown product.</p>;
  const { average, count, reviews } = list.data;

  return (
    <section>
      <p>
        <Link href={`/s/${sandbox}/shop`}>Back to the shop</Link>
      </p>
      <h1>{product.name} reviews</h1>
      <p>{average === null ? 'No reviews yet.' : `Average rating: ${average.toFixed(1)} out of 5 (${count} ${count === 1 ? 'review' : 'reviews'})`}</p>

      <ul aria-label="Reviews">
        {reviews.map((r) => (
          <li key={r.id}>
            <p>
              <strong>{r.name}</strong>, {r.rating} out of 5{r.edited ? ' (edited)' : ''}
            </p>
            <p>{r.text}</p>
            {localStorage.getItem(tokenKey(sandbox, sku, r.id)) && (
              <button type="button" onClick={() => setEditing(r)}>
                Edit review
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2>Write a review</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          post.mutate();
        }}
      >
        <label>
          Your name <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} required />
        </label>
        <label>
          Rating{' '}
          <select value={rating} onChange={(e) => setRating(e.target.value)} required>
            <option value="">Choose</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Review <textarea value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" disabled={post.isPending}>
          Post review
        </button>
      </form>
      {post.isError && <p role="alert">Could not post the review: {post.error.message}</p>}

      {editing && (
        <EditDialog
          key={editing.id}
          review={editing}
          url={`${url}/${editing.id}`}
          token={localStorage.getItem(tokenKey(sandbox, sku, editing.id)) ?? ''}
          onDone={() => {
            setEditing(null);
            void refresh();
          }}
        />
      )}
    </section>
  );
}

function EditDialog({ review, url, token, onDone }: { review: Review; url: string; token: string; onDone: () => void }) {
  const [rating, setRating] = useState(String(review.rating));
  const [text, setText] = useState(review.text);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const save = useMutation({
    mutationFn: async () => json<Review>(await fetch(url, sendJson('PATCH', { rating: Number(rating), text }, { 'x-edit-token': token }))),
    onSuccess: onDone,
  });
  return (
    <dialog ref={dialog} aria-label="Edit review" onClose={onDone}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label>
          Rating{' '}
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Review <textarea value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" disabled={save.isPending}>
          Update review
        </button>{' '}
        <button type="button" onClick={() => dialog.current?.close()}>
          Cancel
        </button>
      </form>
      {save.isError && <p role="alert">Could not update the review: {save.error.message}</p>}
    </dialog>
  );
}
