import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Bug, Search, Sparkles, Target, Trophy } from 'lucide-react';
import { navigate } from './router.tsx';
import { createSandbox } from './chat/api.ts';
import { ThemeToggle } from './ThemeToggle.tsx';
import { GitHubMark, LogoMark, hueStyle, themeMeta } from './themeMeta.tsx';
import { BENCHMARK_URL, CASES, REPO_URL, SOLUTIONS_URL, THEMES, docUrl, solutionUrl, type Case } from './cases.ts';

const START_HERE = 'Start here';
const ALL = 'All cases';
const SOLVED = 'Worked solution';
const solvedCount = CASES.filter((c) => c.solution).length;
const solvedIn = (theme: string) => CASES.filter((c) => c.theme === theme && c.solution).length;

export function Landing() {
  const start = useMutation({
    mutationFn: async (page: string) => ({ id: (await createSandbox()).id, page }),
    onSuccess: ({ id, page }) => navigate(page ? `/s/${id}/${page}` : `/s/${id}`),
  });
  const [filter, setFilter] = useState(START_HERE);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const catalogue = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CASES.filter((c) => {
      if (q) return `${c.n} ${c.title} ${c.summary} ${c.featured ?? ''} ${c.theme}`.toLowerCase().includes(q);
      if (filter === START_HERE) return c.featured;
      if (filter === SOLVED) return c.solution;
      return filter === ALL || c.theme === filter;
    });
  }, [filter, query]);

  const pick = (name: string) => {
    setFilter(name);
    setQuery('');
  };
  const browse = (name: string) => {
    pick(name);
    catalogue.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
        <a href="/" className="brand">
          <LogoMark />
          e2e-casebook
        </a>
        <div className="site-links">
          <a href="#cases">Cases</a>
          <a href={SOLUTIONS_URL}>Solutions</a>
          <a href={BENCHMARK_URL}>Benchmark</a>
          <a href={REPO_URL} className="icon-link">
            <GitHubMark />
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">
          <Sparkles size={15} aria-hidden="true" /> End-to-end testing practice, scored
        </p>
        <h1>{CASES.length} features built to break the obvious test</h1>
        <p className="lead">
          A realistic web app where every feature hides one detail the first test you would write misses: a race, a
          time zone, a reconnect, a focus trap. Practise on it, then see which approaches really catch the bugs.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={() => start.mutate('')} disabled={start.isPending}>
            Start a sandbox
          </button>
          <a href="#cases" className="ghost-link">
            Browse cases <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        {start.isError && <p role="alert">Could not start a sandbox: {start.error.message}</p>}
        <dl className="stats">
          <div>
            <dt>Cases</dt>
            <dd>{CASES.length}</dd>
          </div>
          <div>
            <dt>Topics</dt>
            <dd>{THEMES.length}</dd>
          </div>
          <div>
            <dt>Scored solutions</dt>
            <dd>{solvedCount}</dd>
          </div>
          <div>
            <dt>Runs to count as caught</dt>
            <dd>10/10</dd>
          </div>
        </dl>
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          <li>
            <Target size={22} aria-hidden="true" />
            <h3>Pick a case</h3>
            <p>Each page is one feature with its requirements. A sandbox is your own copy; share its URL to be two users.</p>
          </li>
          <li>
            <BookOpen size={22} aria-hidden="true" />
            <h3>Write the test</h3>
            <p>Any framework that drives a browser. Test hooks reset, seed and break a sandbox when a test needs it.</p>
          </li>
          <li>
            <Bug size={22} aria-hidden="true" />
            <h3>Check it catches bugs</h3>
            <p>
              Cases with a worked solution plant real bugs. An approach counts only if it fails 10 of 10 runs on the buggy build and
              passes 10 of 10 on the clean one.
            </p>
          </li>
        </ol>
      </section>

      <section className="themes" aria-labelledby="themes-title">
        <h2 id="themes-title">What do you want to test?</h2>
        <ul className="theme-grid">
          {THEMES.map((t) => {
            const { icon: Icon, blurb } = themeMeta(t);
            return (
              <li key={t} style={hueStyle(t)}>
                <button type="button" className="theme-card" onClick={() => browse(t)}>
                  <span className="theme-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="theme-name">{t}</span>
                  <span className="theme-blurb">{blurb}</span>
                  <span className="theme-count">
                    {CASES.filter((c) => c.theme === t).length} cases
                    {solvedIn(t) > 0 && (
                      <span className="theme-solved">
                        <Trophy size={12} aria-hidden="true" />
                        {solvedIn(t)} solved
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="catalogue" id="cases" ref={catalogue} aria-labelledby="catalogue-title">
        <div className="catalogue-head">
          <h2 id="catalogue-title">Cases</h2>
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Find a case</span>
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a case: dst, websocket, 92…"
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
        </div>
        <div className="chips" role="group" aria-label="Show">
          {[START_HERE, SOLVED, ALL, ...THEMES].map((name) => (
            <button key={name} type="button" aria-pressed={!query && filter === name} onClick={() => pick(name)}>
              {name === SOLVED && <Trophy size={14} aria-hidden="true" />}
              {name}
            </button>
          ))}
        </div>
        <p className="muted catalogue-count" aria-live="polite">
          {summary(shown.length, filter, query)}
        </p>
        {(query || filter !== SOLVED) && (
          <p className="muted catalogue-note">
            <Trophy size={14} aria-hidden="true" />
            <span>
              The trophy marks the {solvedCount} cases with a worked solution: several test approaches, each scored
              against planted bugs.{' '}
              <button type="button" className="link-button" onClick={() => pick(SOLVED)}>
                Show them
              </button>
            </span>
          </p>
        )}
        <ul className="case-grid">
          {shown.map((c) => (
            <CaseCard key={c.n} c={c} onTry={() => start.mutate(c.page)} busy={start.isPending} />
          ))}
        </ul>
      </section>

      <footer className="site-footer">
        <span>
          Built by <a href="https://www.linkedin.com/in/bkow/">Bartosz Kowalski</a> · MIT licence
        </span>
      </footer>
    </>
  );
}

function summary(count: number, filter: string, query: string) {
  const total = CASES.length;
  if (query) return `${count} of ${total} cases match.`;
  if (filter === START_HERE) return `${count} cases to start with, picked from all ${total}.`;
  if (filter === ALL) return `All ${total} cases.`;
  if (filter === SOLVED)
    return `${count} of ${total} cases have a worked solution: several test approaches, each scored against planted bugs. The rest stay open as exercises.`;
  return `${count} of ${total} cases.`;
}

function CaseCard({ c, onTry, busy }: { c: Case; onTry: () => void; busy: boolean }) {
  const { icon: Icon } = themeMeta(c.theme);
  return (
    <li className="case-card" style={hueStyle(c.theme)}>
      <div className="case-meta">
        <span className="case-no">#{c.n}</span>
        <span className="theme-tag">
          <Icon size={12} aria-hidden="true" />
          {c.theme}
        </span>
        {c.solution && (
          <span className="solved-tag" title="Has a worked solution">
            <Trophy size={14} aria-hidden="true" />
            <span className="sr-only">Has a worked solution</span>
          </span>
        )}
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
