import { useEffect, useRef, useState } from 'react';
import { Link } from '../router.tsx';

const ARTICLES: Record<string, { title: string; body: string }> = {
  billing: { title: 'Billing', body: 'Invoices are sent on the first day of each month.' },
  refunds: { title: 'Refunds', body: 'Refunds reach your card within 5 working days.' },
  account: { title: 'Your account', body: 'Change your email under Settings.' },
};

const readArticle = () => new URLSearchParams(location.search).get('article');

export function Help({ sandbox }: { sandbox: string }) {
  const base = `/s/${sandbox}/help`;
  const [article, setArticle] = useState(readArticle);
  const [announcement, setAnnouncement] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const originalTitle = useRef(document.title);
  const current = article ? ARTICLES[article] : undefined;

  useEffect(() => {
    const onPop = () => setArticle(readArticle());
    addEventListener('popstate', onPop);
    const title = originalTitle.current;
    return () => {
      removeEventListener('popstate', onPop);
      document.title = title;
    };
  }, []);

  useEffect(() => {
    document.title = current ? `${current.title} · Help centre` : 'Help centre';
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    heading.current?.focus();
    setAnnouncement(current ? `${current.title}, help article` : 'All help articles');
  }, [article]);

  return (
    <section>
      <h1>Help centre</h1>
      <nav aria-label="Help articles">
        <ul>
          <li>
            <Link href={base} aria-current={!current ? 'page' : undefined}>
              All articles
            </Link>
          </li>
          {Object.entries(ARTICLES).map(([slug, a]) => (
            <li key={slug}>
              <Link href={`${base}?article=${slug}`} aria-current={article === slug ? 'page' : undefined}>
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <h2 ref={heading} tabIndex={-1}>
        {current ? current.title : 'All articles'}
      </h2>
      {current ? <p>{current.body}</p> : <p>Pick an article to read it.</p>}
      <div className="help-filler" />
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
