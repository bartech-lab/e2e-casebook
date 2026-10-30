import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Token reusable",
    edits: [
      { file: "server/extras.ts", find: "if (!entry || entry.used || entry.expires < Date.now()) {", replace: "if (!entry || entry.expires < Date.now()) {" },
    ],
  },
  {
    name: "Mail never delivered",
    edits: [
      { file: "server/extras.ts", find: "      mail.set(sandbox, box);\n", replace: "" },
    ],
  },
  {
    name: "Account page ignores the session",
    edits: [
      { file: "web/src/account/Account.tsx", find: "  if (me.data) {", replace: "  if (false && me.data) {" },
    ],
  },
];
