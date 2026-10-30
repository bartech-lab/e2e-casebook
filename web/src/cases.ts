import index from './case-index.json';

export type Case = { n: number; title: string; summary: string; doc: string; theme: string; page: string; solution?: string; featured?: string };

export const CASES = index as Case[];
export const THEMES = [...new Set(CASES.map((c) => c.theme))].sort(
  (a, b) => CASES.filter((c) => c.theme === b).length - CASES.filter((c) => c.theme === a).length,
);

const REPO = 'https://github.com/bartech-lab/e2e-casebook';
export const REPO_URL = REPO;
export const SOLUTIONS_URL = `${REPO}/tree/main/solutions#readme`;
export const BENCHMARK_URL = `${REPO}/tree/main/solutions/benchmark#readme`;
export const docUrl = (c: Case) => `${REPO}/blob/main/${c.doc}`;
export const solutionUrl = (c: Case) => `${REPO}/tree/main/solutions/cases/${c.solution}#readme`;

const byPage = new Map<string, Case[]>();
for (const c of CASES) byPage.set(c.page, [...(byPage.get(c.page) ?? []), c]);
export const casesOnPage = (page: string) => byPage.get(page) ?? [];
