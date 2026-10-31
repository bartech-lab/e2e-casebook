import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { casesOnPage } from '../cases.ts';
import { navigate } from '../router.tsx';
import { PAGES } from './pages.ts';

const ENTRIES = PAGES.map((p) => {
  const cases = casesOnPage(p.path);
  const text = [p.label, ...cases.map((c) => `${c.title} ${c.theme}`)].join(' ').toLowerCase();
  return { ...p, cases, text };
});

// The search field exists only while the dialog is open, and the dialog lives outside the Sandbox navigation, so
// case specs that look up "the textbox" or a navigation link by name never see it.
export function PageFinder({ base }: { base: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (e: (typeof ENTRIES)[number], w: string) =>
      /^#?\d+$/.test(w) ? e.cases.some((c) => String(c.n) === w.replace('#', '')) : e.text.includes(w);
    return words.length ? ENTRIES.filter((e) => words.every((w) => matches(e, w))) : ENTRIES;
  }, [query]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  const go = (path: string) => {
    dialog.current?.close();
    navigate(`${base}/${path}`);
  };

  return (
    <>
      <button type="button" className="page-finder-button" onClick={() => (setQuery(''), setOpen(true))}>
        <Search size={15} aria-hidden="true" />
        Jump to a page
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="page-finder"
            aria-label="Jump to a page"
            onClose={() => setOpen(false)}
            onClick={(e) => e.target === dialog.current && dialog.current?.close()}
          >
            <label className="search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Page, case or topic</span>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) {
                    e.preventDefault();
                    go(results[0].path);
                  }
                }}
                placeholder="Page, case number or topic"
              />
            </label>
            <p className="muted page-finder-count" aria-live="polite">
              {results.length} of {ENTRIES.length} pages
            </p>
            <ul className="page-finder-results">
              {results.map((e) => (
                <li key={e.path}>
                  <a
                    href={`${base}/${e.path}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      go(e.path);
                    }}
                  >
                    <span className="page-finder-label">{e.label}</span>
                    {e.cases.length > 0 && (
                      <span className="page-finder-cases">
                        {e.cases.map((c) => `#${c.n}${c.title === e.label ? '' : ` ${c.title}`}`).join(' · ')} · {e.cases[0]!.theme}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </dialog>,
          document.body,
        )}
    </>
  );
}
