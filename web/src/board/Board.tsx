import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '../router.tsx';
import { STATUSES, STATUS_LABEL, cardsKey, fetchCard, fetchCards, patchCard, type Card, type Status } from './api.ts';

type Move = { card: Card; to: Status };
type Notice = { id: number; text: string };

export function Board({ sandbox, name }: { sandbox: string; name: string }) {
  const queryClient = useQueryClient();
  const key = cardsKey(sandbox);
  const cards = useQuery({ queryKey: key, queryFn: () => fetchCards(sandbox) });
  const pending = useRef(new Map<number, number>());
  const noticeId = useRef(0);
  const [notices, setNotices] = useState<Notice[]>([]);

  const replaceCard = (card: Card) =>
    queryClient.setQueryData<Card[]>(key, (old) => old?.map((c) => (c.id === card.id ? card : c)));

  const move = useMutation({
    mutationFn: ({ card, to }: Move) => patchCard(sandbox, card.id, { status: to }, name),
    onMutate: async ({ card, to }: Move) => {
      await queryClient.cancelQueries({ queryKey: key });
      pending.current.set(card.id, (pending.current.get(card.id) ?? 0) + 1);
      queryClient.setQueryData<Card[]>(key, (old) => old?.map((c) => (c.id === card.id ? { ...c, status: to } : c)));
    },
    onError: (_error, { card, to }) => {
      const id = ++noticeId.current;
      setNotices((n) => [...n, { id, text: `Could not move “${card.title}” to ${STATUS_LABEL[to]}.` }]);
    },
    onSettled: async (_data, _error, { card }) => {
      const left = (pending.current.get(card.id) ?? 1) - 1;
      if (left > 0) {
        pending.current.set(card.id, left);
        return;
      }
      pending.current.delete(card.id);
      const fresh = await fetchCard(sandbox, card.id).catch(() => undefined);
      if (fresh && !pending.current.has(card.id)) replaceCard(fresh);
    },
  });

  if (cards.isPending) return <p>Loading the board…</p>;
  if (cards.isError) return <p role="alert">Could not load the board: {cards.error.message}</p>;

  return (
    <section>
      <h1>Board</h1>
      {notices.length > 0 && (
        <ul aria-label="Errors">
          {notices.map((n) => (
            <li key={n.id} role="alert">
              {n.text}{' '}
              <button type="button" onClick={() => setNotices((all) => all.filter((x) => x.id !== n.id))}>
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="columns">
        {STATUSES.map((status) => (
          <section key={status} aria-label={STATUS_LABEL[status]} className="column">
            <h2>{STATUS_LABEL[status]}</h2>
            <ul>
              {cards.data
                .filter((c) => c.status === status)
                .map((c) => (
                  <li key={c.id} data-card-id={c.id}>
                    <Link href={`/s/${sandbox}/cards/${c.id}`}>{c.title}</Link>
                    <div>
                      {STATUSES.filter((s) => s !== status).map((to) => (
                        <button
                          key={to}
                          type="button"
                          aria-label={`Move “${c.title}” to ${STATUS_LABEL[to]}`}
                          onClick={() => move.mutate({ card: c, to })}
                        >
                          → {STATUS_LABEL[to]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
