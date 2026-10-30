import { useEffect, useRef } from "react";
import { casesOnPage, docUrl, solutionUrl, THEMES } from "../cases.ts";
import { Link } from "../router.tsx";
import { NotificationsBadge } from "../settings/NotificationsBadge.tsx";
import { PAGES } from "./pages.ts";

const MORE = "More pages";
const GROUPS = [...THEMES, MORE]
  .map((theme) => ({
    theme,
    pages: PAGES.filter(
      (p) => (casesOnPage(p.path)[0]?.theme ?? MORE) === theme,
    ),
  }))
  .filter((g) => g.pages.length > 0);

const section = (path: string) => path.split("/")[0];

// Specs click these links by name inside navigation "Sandbox"; keep every link in the DOM and visible.
export function SandboxNav({
  sandbox,
  page,
  name,
}: {
  sandbox: string;
  page: string;
  name: string;
}) {
  const base = `/s/${sandbox}`;
  const active =
    PAGES.find((p) => section(p.path) === section(page))?.path ?? page;
  const cases = casesOnPage(active);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // Scroll only the sidebar itself, and only while it is a fixed sidebar: the page's own scroll position is
    // part of several cases.
    const nav = ref.current;
    const link = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!nav || !link || getComputedStyle(nav).position !== "fixed") return;
    nav.scrollTop = link.offsetTop - nav.clientHeight / 2;
  }, [active]);
  return (
    <nav aria-label="Sandbox" className="sandbox-nav" ref={ref}>
      <div className="nav-head">
        <div className="nav-top">
          <a href="/" className="nav-home">
            Case catalogue
          </a>
          <span>Name: {name}</span> <NotificationsBadge sandbox={sandbox} />
        </div>
        {cases.length > 0 && (
          <div className="case-strip">
            {cases.map((c) => (
              <div key={c.n} className="case-strip-item">
                <span className="case-strip-title">
                  Case {c.n}: {c.title}
                </span>
                <a href={docUrl(c)}>
                  Requirements<span className="sr-only"> for case {c.n}</span>
                </a>
                {c.solution && (
                  <a href={solutionUrl(c)}>
                    Solution<span className="sr-only"> for case {c.n}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {GROUPS.map((g) => (
        <div key={g.theme} className="nav-group">
          <span className="nav-group-title">{g.theme}</span>
          <div className="nav-links">
            {g.pages.map((p) => (
              <Link
                key={p.path}
                href={`${base}/${p.path}`}
                aria-current={p.path === active ? "page" : undefined}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
