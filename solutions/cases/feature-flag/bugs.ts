import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Dialog variant creates nothing",
    edits: [
      { file: "web/src/board/CreateCard.tsx", find: "create.mutate({ title, description: String(data.get('description') ?? ''), dueDate: due || null });", replace: "void due;" },
    ],
  },
  {
    name: "Inline variant creates nothing",
    edits: [
      { file: "web/src/board/CreateCard.tsx", find: "if (title.trim()) create.mutate({ title });", replace: "if (false) create.mutate({ title });" },
    ],
  },
  {
    name: "Pinned flag ignored",
    edits: [
      { file: "web/src/board/useCreateCardVariant.ts", find: "return flags.data?.createCard ?? visitorVariant(flags.data?.draw ?? null);", replace: "return visitorVariant(flags.data?.draw ?? null);" },
    ],
  },
  {
    name: "Stored assignment ignored",
    edits: [
      { file: "web/src/board/useCreateCardVariant.ts", find: "const stored = localStorage.getItem(STORAGE_KEY);", replace: "const stored = null as string | null;" },
    ],
  },
];
