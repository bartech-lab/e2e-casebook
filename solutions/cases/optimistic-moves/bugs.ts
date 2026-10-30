import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "No rollback",
    edits: [
      { file: "web/src/board/Board.tsx", find: "if (fresh && !pending.current.has(card.id)) replaceCard(fresh);", replace: "void fresh;" },
    ],
  },
  {
    name: "Rollback to the status at click time",
    edits: [
      { file: "web/src/board/Board.tsx", find: "if (fresh && !pending.current.has(card.id)) replaceCard(fresh);", replace: "void fresh;" },
      { file: "web/src/board/Board.tsx", find: "    onError: (_error, { card, to }) => {\n", replace: "    onError: (_error, { card, to }) => {\n      replaceCard(card);\n" },
    ],
  },
  {
    name: "Rollback restores the whole board",
    edits: [
      { file: "web/src/board/Board.tsx", find: "if (fresh && !pending.current.has(card.id)) replaceCard(fresh);", replace: "void fresh;" },
      { file: "web/src/board/Board.tsx", find: "      pending.current.set(card.id, (pending.current.get(card.id) ?? 0) + 1);\n", replace: "      pending.current.set(card.id, (pending.current.get(card.id) ?? 0) + 1);\n      (window as any).__before = queryClient.getQueryData<Card[]>(key);\n" },
      { file: "web/src/board/Board.tsx", find: "    onError: (_error, { card, to }) => {\n", replace: "    onError: (_error, { card, to }) => {\n      queryClient.setQueryData<Card[]>(key, (window as any).__before);\n" },
    ],
  },
  {
    name: "Error shown twice",
    edits: [
      { file: "web/src/board/Board.tsx", find: "setNotices((n) => [...n, { id, text: `Could not move “${card.title}” to ${STATUS_LABEL[to]}.` }]);", replace: "setNotices((n) => [...n, { id, text: `Could not move “${card.title}” to ${STATUS_LABEL[to]}.` }, { id: -id, text: `Could not move “${card.title}” to ${STATUS_LABEL[to]}.` }]);" },
    ],
  },
  {
    name: "Server ignores status changes",
    edits: [
      { file: "server/store.ts", find: "        change.status ?? card.status,", replace: "        card.status," },
    ],
  },
];
