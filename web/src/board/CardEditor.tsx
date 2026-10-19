import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../http.ts';
import { Link } from '../router.tsx';
import { STATUS_LABEL, cardKey, fetchCard, patchCard, type Card } from './api.ts';

type Draft = { title: string; description: string; dueDate: string };

export function CardEditor({ sandbox, id, name }: { sandbox: string; id: number; name: string }) {
  const queryClient = useQueryClient();
  const card = useQuery({ queryKey: cardKey(sandbox, id), queryFn: () => fetchCard(sandbox, id), staleTime: Infinity });
  const [base, setBase] = useState<Card | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: '', description: '', dueDate: '' });
  const [conflict, setConflict] = useState<Card | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (card.data && !base) {
      setBase(card.data);
      setDraft({ title: card.data.title, description: card.data.description, dueDate: card.data.dueDate ?? '' });
    }
  }, [card.data, base]);

  const save = useMutation({
    mutationFn: ({ draft, version }: { draft: Draft; version: number }) =>
      patchCard(
        sandbox,
        id,
        { title: draft.title, description: draft.description, dueDate: draft.dueDate || null },
        name,
        version,
      ),
    onMutate: () => setSaved(false),
    onSuccess: (updated) => {
      setBase(updated);
      setConflict(null);
      setSaved(true);
      queryClient.setQueryData(cardKey(sandbox, id), updated);
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 412) {
        setConflict((error.body as { current: Card }).current);
      }
    },
  });

  if (card.isError) return <p role="alert">Could not load the card: {card.error.message}</p>;
  if (!base) return <p>Loading the card…</p>;

  return (
    <section>
      <p>
        <Link href={`/s/${sandbox}/board`}>← Back to the board</Link>
      </p>
      <h1>Edit card</h1>
      <p>
        Status: {STATUS_LABEL[base.status]} · version {base.version} · last changed by {base.updatedBy}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ draft, version: base.version });
        }}
      >
        <label>
          Title{' '}
          <input
            value={draft.title}
            maxLength={80}
            required
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, title: e.target.value });
            }}
          />
        </label>
        <label>
          Description{' '}
          <textarea
            value={draft.description}
            maxLength={1000}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, description: e.target.value });
            }}
          />
        </label>
        <label>
          Due date{' '}
          <input
            type="date"
            value={draft.dueDate}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, dueDate: e.target.value });
            }}
          />
        </label>
        <button type="submit" disabled={save.isPending || conflict !== null}>
          Save
        </button>
      </form>
      {saved && <p role="status">Saved.</p>}
      {save.isError && !conflict && (
        <p role="alert">
          {save.error instanceof HttpError && save.error.status === 409
            ? `Another card is already named “${draft.title.trim()}”.`
            : `Could not save: ${save.error.message}`}
        </p>
      )}
      {conflict && (
        <div role="alert" aria-label="Conflict">
          <p>
            {conflict.updatedBy} changed this card while you were editing. Their version is {conflict.version}:
          </p>
          <dl>
            <dt>Their title</dt>
            <dd>{conflict.title}</dd>
            <dt>Their description</dt>
            <dd>{conflict.description || '(empty)'}</dd>
          </dl>
          <button
            type="button"
            onClick={() => {
              setBase(conflict);
              setDraft({ title: conflict.title, description: conflict.description, dueDate: conflict.dueDate ?? '' });
              setConflict(null);
              queryClient.setQueryData(cardKey(sandbox, id), conflict);
            }}
          >
            Use theirs
          </button>{' '}
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate({ draft, version: conflict.version })}
          >
            Keep mine
          </button>
        </div>
      )}
    </section>
  );
}
