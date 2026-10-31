import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { CASES } from '../cases.ts';
import { navigate } from '../router.tsx';
import { PAGES } from './pages.ts';

const LABEL = new Map(PAGES.map((p) => [p.path, p.label]));
const ENTRIES = CASES.map((c) => ({ ...c, label: LABEL.get(c.page) ?? c.page, text: `${c.title} ${c.theme} ${LABEL.get(c.page) ?? ''}`.toLowerCase() }));

// The search field exists only while the dialog is open, and the dialog lives outside the Sandbox navigation, so
// case specs that look up "the textbox" or a navigation link by name never see it.
export function CaseFinder({ base }: { base: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (e: (typeof ENTRIES)[number], w: string) =>
      /^#?\d+$/.test(w) ? String(e.n) === w.replace('#', '') : new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(e.text);
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
        Jump to a case
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="page-finder"
            aria-label="Jump to a case"
            onClose={() => setOpen(false)}
            onClick={(e) => e.target === dialog.current && dialog.current?.close()}
          >
            <label className="search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Case, number or topic</span>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) {
                    e.preventDefault();
                    go(results[0].page);
                  }
                }}
                placeholder="Case title, number or topic"
              />
            </label>
            <p className="muted page-finder-count" aria-live="polite">
              {results.length} of {ENTRIES.length} cases
            </p>
            <ul className="page-finder-results">
              {results.map((e) => (
                <li key={e.n}>
                  <a
                    href={`${base}/${e.page}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      go(e.page);
                    }}
                  >
                    <span className="page-finder-label">
                      #{e.n} {e.title}
                    </span>
                    <span className="page-finder-cases">
                      {e.theme}
                      {e.label !== e.title && ` · on the ${e.label} page`}
                    </span>
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
