import type { Bug } from '../../scripts/score-lib.ts';

const page = 'web/src/search/Search.tsx';

export const bugs: Bug[] = [
  { name: "Older results replace newer ones", edits: [{ file: page, find: "        if (!current) return;\n", replace: "" }, { file: page, find: "      controller.abort();\n", replace: "" }] },
  { name: "Searches on every key", edits: [{ file: page, find: "setTimeout(() => setDebounced(query.trim()), 300)", replace: "setTimeout(() => setDebounced(query.trim()), 0)" }] },
  { name: "Status names the typed text", edits: [{ file: page, find: "for “${shown.q}”` : `No results for “${shown.q}”`", replace: "for “${query.trim()}”` : `No results for “${query.trim()}”`" }] },
  { name: "Query not encoded", edits: [{ file: page, find: "search?q=${encodeURIComponent(debounced)}", replace: "search?q=${debounced}" }] },
  { name: "Empty box shows everything", edits: [{ file: page, find: "    if (!debounced) {\n      setShown({ q: '', results: [] });\n      return;\n    }\n", replace: "" }] },
];
