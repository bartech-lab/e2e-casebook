import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../http.ts';
import { cardsKey, createCard, type Card } from './api.ts';
import { useCreateCardVariant } from './useCreateCardVariant.ts';

type Input = { title: string; description?: string; dueDate?: string | null };

function useCreate(sandbox: string, name: string, onDone: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Input) => createCard(sandbox, input, name),
    onSuccess: (card) => {
      queryClient.setQueryData<Card[]>(cardsKey(sandbox), (old) => [...(old ?? []), card]);
      onDone();
    },
  });
}

function errorText(error: Error, title: string) {
  return error instanceof HttpError && error.status === 409
    ? `A card named “${title.trim()}” already exists.`
    : `Could not create the card: ${error.message}`;
}

export function CreateCard({ sandbox, name }: { sandbox: string; name: string }) {
  const variant = useCreateCardVariant(sandbox);
  if (!variant) return null;
  return variant === 'inline' ? <InlineCreate sandbox={sandbox} name={name} /> : <DialogCreate sandbox={sandbox} name={name} />;
}

function InlineCreate({ sandbox, name }: { sandbox: string; name: string }) {
  const [title, setTitle] = useState('');
  const create = useCreate(sandbox, name, () => setTitle(''));
  return (
    <form
      data-variant="inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) create.mutate({ title });
      }}
    >
      <label>
        New card title <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <button type="submit" disabled={create.isPending}>
        Add card
      </button>
      {create.isError && <p role="alert">{errorText(create.error, title)}</p>}
    </form>
  );
}

function DialogCreate({ sandbox, name }: { sandbox: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const create = useCreate(sandbox, name, () => dialog.current?.close());
  return (
    <div data-variant="dialog">
      <button
        type="button"
        onClick={() => {
          setTitle('');
          create.reset();
          dialog.current?.showModal();
        }}
      >
        New card
      </button>
      <dialog ref={dialog} aria-label="New card">
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const due = String(data.get('dueDate') ?? '');
            create.mutate({ title, description: String(data.get('description') ?? ''), dueDate: due || null });
          }}
        >
          <h2>New card</h2>
          <label>
            Title <input value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Description <textarea name="description" maxLength={1000} />
          </label>
          <label>
            Due date <input type="date" name="dueDate" />
          </label>
          <button type="submit" disabled={create.isPending}>
            Create
          </button>{' '}
          <button type="button" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
          {create.isError && <p role="alert">{errorText(create.error, title)}</p>}
        </form>
      </dialog>
    </div>
  );
}
