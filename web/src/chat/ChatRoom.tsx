import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpError, postMessage, type Message } from './api.ts';
import { mergeMessages } from './merge.ts';
import { messagesKey, useLiveMessages } from './useLiveMessages.ts';

export function ChatRoom({ sandbox }: { sandbox: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { query, state } = useLiveMessages(sandbox, name);

  const send = useMutation({
    mutationFn: (text: string) => postMessage(sandbox, name!, text),
    onSuccess: (msg) => {
      queryClient.setQueryData<Message[]>(messagesKey(sandbox), (old) => mergeMessages(old ?? [], [msg]));
      setDraft('');
    },
  });

  if (query.error instanceof HttpError && query.error.status === 404) {
    return (
      <section>
        <h1>Sandbox not found</h1>
        <p>
          It may have expired. <a href="/">Start a new sandbox</a>.
        </p>
      </section>
    );
  }

  if (!name) {
    return (
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('name');
          if (typeof value === 'string' && value.trim()) setName(value.trim());
        }}
      >
        <h1>Join the chat</h1>
        <label>
          Your name <input name="name" maxLength={40} required autoComplete="off" />
        </label>
        <button type="submit">Join</button>
      </form>
    );
  }

  return (
    <section>
      <h1>Chat</h1>
      <p>
        Signed in as <strong>{name}</strong>. Connection:{' '}
        <span data-testid="connection" data-state={state}>
          {state}
        </span>
      </p>
      <ol aria-label="Messages">
        {(query.data ?? []).map((m) => (
          <li key={m.seq} data-seq={m.seq}>
            <strong>{m.name}</strong>: {m.text}
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send.mutate(draft);
        }}
      >
        <label>
          Message <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} autoComplete="off" />
        </label>
        <button type="submit" disabled={send.isPending}>
          Send
        </button>
      </form>
      {send.isError && <p role="alert">Message not sent: {send.error.message}</p>}
    </section>
  );
}
