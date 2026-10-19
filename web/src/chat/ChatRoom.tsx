import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postMessage, type Message } from './api.ts';
import { mergeMessages } from './merge.ts';
import { messagesKey, useLiveMessages } from './useLiveMessages.ts';

export function ChatRoom({ sandbox, name }: { sandbox: string; name: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const { query, state } = useLiveMessages(sandbox, name);

  const send = useMutation({
    mutationFn: (text: string) => postMessage(sandbox, name, text),
    onSuccess: (msg) => {
      queryClient.setQueryData<Message[]>(messagesKey(sandbox), (old) => mergeMessages(old ?? [], [msg]));
      setDraft('');
    },
  });

  return (
    <section>
      <h1>Chat</h1>
      <p>
        Connection:{' '}
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
