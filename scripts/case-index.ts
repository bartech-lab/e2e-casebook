// Builds web/src/case-index.json from README.md, cases/themes.json, the page registry and solutions/.
// Run `npm run case-index` after adding or renaming a case; a unit test fails while the file is stale.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES } from '../web/src/sandbox/pages.ts';

export type CaseEntry = {
  n: number;
  title: string;
  summary: string;
  doc: string;
  theme: string;
  page: string;
  solution?: string;
  featured?: string;
};

const root = join(import.meta.dirname, '..');
export const indexFile = join(root, 'web/src/case-index.json');

// Cases whose title is not the label of their page: several early cases share one page.
const PAGE_OF: Record<number, string> = {
  1: 'chat', 2: 'board', 3: 'board', 4: 'exports', 5: 'board', 6: 'board', 7: 'board', 8: 'account',
  9: 'activity', 10: 'settings', 11: 'shop', 12: 'shop', 13: 'shop', 14: 'shop', 15: 'shop', 16: 'shop',
  17: 'deals', 21: 'plan',
};

export function buildIndex(): CaseEntry[] {
  const themes = JSON.parse(readFileSync(join(root, 'cases/themes.json'), 'utf8')) as Record<string, number[]>;
  const themeOf = new Map(Object.entries(themes).flatMap(([theme, ns]) => ns.map((n) => [n, theme] as const)));
  const pageOf = new Map(PAGES.map((p) => [p.label, p.path]));
  const solutions = new Map<number, string>();
  for (const dir of readdirSync(join(root, 'solutions/cases'), { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const head = /^# Case (\d+):/.exec(readFileSync(join(root, 'solutions/cases', dir.name, 'README.md'), 'utf8'));
    if (head) solutions.set(Number(head[1]), dir.name);
  }
  const startHere = readFileSync(join(root, 'README.md'), 'utf8').split('## Start here')[1]!.split('\n## ')[0]!;
  const featured = new Map([...startHere.matchAll(/^\| \[(\d+)\. .+?\]\(.+?\) \| (.+?) \|$/gm)].map(([, n, why]) => [Number(n), why!]));
  const rows = [...readFileSync(join(root, 'README.md'), 'utf8').matchAll(/^\| (\d+) \| \[(.+?)\]\((cases\/[^)]+)\) \| (.+?) \|$/gm)];
  return rows.map(([, n, title, doc, summary]) => {
    const num = Number(n);
    const page = PAGE_OF[num] ?? pageOf.get(title!);
    const theme = themeOf.get(num);
    if (!page) throw new Error(`case ${num} (${title}) has no page: add it to PAGE_OF`);
    if (!theme) throw new Error(`case ${num} (${title}) has no theme in cases/themes.json`);
    const solution = solutions.get(num);
    const why = featured.get(num);
    return { n: num, title: title!, summary: summary!.replaceAll('**', ''), doc: doc!, theme, page, ...(solution && { solution }), ...(why && { featured: why }) };
  });
}

export const render = (index: CaseEntry[]) => `${JSON.stringify(index, null, 1)}\n`;

if (import.meta.main) {
  writeFileSync(indexFile, render(buildIndex()));
  console.log(`wrote ${indexFile}`);
}
