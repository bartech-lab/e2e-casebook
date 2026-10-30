import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { navigate } from './router.tsx';
import { createSandbox } from './chat/api.ts';
import { saveTheme, storedTheme } from './theme.ts';
import { BENCHMARK_URL, CASES, REPO_URL, SOLUTIONS_URL, THEMES, docUrl, solutionUrl, type Case } from './cases.ts';

const START_HERE = 'Start here';
const ALL = 'All cases';
const SOLVED = 'Solved';

export function Landing() {
  const start = useMutation({
    mutationFn: async (page: string) => ({ id: (await createSandbox()).id, page }),
    onSuccess: ({ id, page }) => navigate(page ? `/s/${id}/${page}` : `/s/${id}`),
  });
  const [filter, setFilter] = useState(START_HERE);
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(() => storedTheme() === 'dark');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CASES.filter((c) => {
      if (q) return `${c.n} ${c.title} ${c.summary} ${c.theme}`.toLowerCase().includes(q);
      if (filter === START_HERE) return c.featured;
      if (filter === SOLVED) return c.solution;
      return filter === ALL || c.theme === filter;
    });
  }, [filter, query]);

  const chips: [string, number][] = [
    [START_HERE, CASES.filter((c) => c.featured).length],
    [SOLVED, CASES.filter((c) => c.solution).length],
    [ALL, CASES.length],
    ...THEMES.map((t): [string, number] => [t, CASES.filter((c) => c.theme === t).length]),
  ];

  return (
    <>
      <section className="hero">
        <h1>e2e-casebook</h1>
        <p className="lead">
          {CASES.length} features that are hard to test end to end. Each one hides a detail that makes the obvious
          test miss a broken requirement.
        </p>
        <p>
          A sandbox is your own copy of the app. Share its URL to test with a second user. Every page lists the
          requirements to test; {CASES.filter((c) => c.solution).length} cases also have scored Playwright solutions.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={() => start.mutate('')} disabled={start.isPending}>
            Start a sandbox
          </button>
          <a href={REPO_URL}>Source on GitHub</a>
          <a href={SOLUTIONS_URL}>Scored solutions</a>
          <a href={BENCHMARK_URL}>AI agent benchmark</a>
          <button
            type="button"
            className="theme-toggle"
            aria-pressed={dark}
            onClick={() => {
              saveTheme(dark ? 'light' : 'dark');
              setDark(!dark);
            }}
          >
            Dark theme
          </button>
        </div>
        {start.isError && <p role="alert">Could not start a sandbox: {start.error.message}</p>}
      </section>

      <section className="catalogue" aria-labelledby="catalogue-title">
        <h2 id="catalogue-title">Cases</h2>
        <div className="catalogue-tools">
          <label>
            Find a case
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="dst, websocket, 92…" />
          </label>
          <div className="chips" role="group" aria-label="Show">
            {chips.map(([name, count]) => (
              <button key={name} type="button" aria-pressed={!query && filter === name} onClick={() => { setFilter(name); setQuery(''); }}>
                {name} <span className="count">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'case' : 'cases'}
        </p>
        <ul className="case-grid">
          {shown.map((c) => (
            <CaseCard key={c.n} c={c} onTry={() => start.mutate(c.page)} busy={start.isPending} />
          ))}
        </ul>
      </section>
    </>
  );
}

function CaseCard({ c, onTry, busy }: { c: Case; onTry: () => void; busy: boolean }) {
  return (
    <li className="case-card">
      <div className="case-meta">
        <span className="case-no">#{c.n}</span>
        <span className="theme-tag">{c.theme}</span>
        {c.solution && <span className="solved-tag">Solved</span>}
      </div>
      <h3>{c.title}</h3>
      <p>{c.featured ?? c.summary}</p>
      <div className="case-actions">
        <button type="button" onClick={onTry} disabled={busy}>
          Try case {c.n}
        </button>
        <a href={docUrl(c)}>
          Requirements<span className="sr-only"> for case {c.n}</span>
        </a>
        {c.solution && (
          <a href={solutionUrl(c)}>
            Solution<span className="sr-only"> for case {c.n}</span>
          </a>
        )}
      </div>
    </li>
  );
}
