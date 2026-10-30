import type { Bug } from '../../scripts/score-lib.ts';

const page = 'web/src/product-tabs/ProductTabs.tsx';

export const bugs: Bug[] = [
  { name: "No wrap at the ends", edits: [{ file: page, find: "ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1", replace: "ArrowRight: Math.min(last, i + 1), ArrowLeft: Math.max(0, i - 1)" }] },
  { name: "Every tab in the Tab order", edits: [{ file: page, find: "tabIndex={t.id === selected ? 0 : -1}", replace: "tabIndex={0}" }] },
  { name: "Arrows move focus without selecting", edits: [{ file: page, find: "    select(TABS[next]!.id, true);", replace: "    refs.current[TABS[next]!.id]?.focus();" }] },
  { name: "Home and End ignored", edits: [{ file: page, find: ", Home: 0, End: last }", replace: " }" }] },
  { name: "Panels not labelled by their tab", edits: [{ file: page, find: "aria-labelledby={`tab-${t.id}`} ", replace: "" }] },
  { name: "Selected tab not kept in the address", edits: [{ file: page, find: "    history.replaceState(null, '', `#${id}`);\n", replace: "" }] },
  { name: "Panel skipped by Tab", edits: [{ file: page, find: " tabIndex={0} hidden=", replace: " hidden=" }] },
];
