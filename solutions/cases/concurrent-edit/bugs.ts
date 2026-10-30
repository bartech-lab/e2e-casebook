import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Server ignores `If-Match`",
    edits: [
      { file: "server/board-routes.ts", find: "if (expected !== undefined && expected !== current.version) {", replace: "if (false) {" },
    ],
  },
  {
    name: "Keep mine sends the stale version",
    edits: [
      { file: "web/src/board/CardEditor.tsx", find: "onClick={() => save.mutate({ draft, version: conflict.version })}", replace: "onClick={() => save.mutate({ draft, version: base.version })}" },
    ],
  },
  {
    name: "Use theirs keeps my draft",
    edits: [
      { file: "web/src/board/CardEditor.tsx", find: "              setDraft({ title: conflict.title, description: conflict.description, dueDate: conflict.dueDate ?? '' });\n", replace: "" },
    ],
  },
  {
    name: "Client never sends `If-Match`",
    edits: [
      { file: "web/src/board/api.ts", find: "ifVersion === undefined ? {}", replace: "true ? {}" },
    ],
  },
];
