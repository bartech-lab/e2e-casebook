import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Today computed in UTC",
    edits: [
      { file: "web/src/board/due.ts", find: "Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())", replace: "Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())" },
    ],
  },
  {
    name: "Local midnights, floored (DST)",
    edits: [
      { file: "web/src/board/due.ts", find: "  const days = (Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000;", replace: "  const days = Math.floor((new Date(y, m - 1, d).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);" },
    ],
  },
  {
    name: "Badge never refreshes",
    edits: [
      { file: "web/src/board/due.ts", find: "    const timer = setInterval(() => setNow(new Date()), everyMs);", replace: "    const timer = setInterval(() => {}, everyMs);" },
    ],
  },
];
