import { useState, type ReactNode } from 'react';

type Article = { title: string; text: string };
const ARTICLES: Article[] = [
  { title: 'Changing your password', text: 'Open Settings, then Security. A new password needs 12 characters.' },
  { title: 'Shipping to Łódź and Kraków', text: 'Orders to Łódź arrive in two days; Kraków in three.' },
  { title: 'Using <b> tags in signatures', text: 'Signatures are plain text, so <b> shows as written.' },
  { title: 'C++ and C# SDKs (beta)', text: 'The C++ SDK is in beta. The C# SDK is stable.' },
  { title: 'Annual billing', text: 'Anna from billing explains annual plans.' },
  { title: 'Żółw mode for slow connections', text: 'Turn on żółw mode on a slow network.' },
  { title: 'Exporting invoices', text: 'Export invoices as CSV or PDF from Billing.' },
  { title: 'Two-factor sign-in', text: 'Use a code from an app, or a passkey.' },
  { title: 'Deleting your account', text: 'Deleting an account removes all invoices after 30 days.' },
  { title: 'Prices in złoty (PLN)', text: 'All prices are in złoty, VAT included.' },
  { title: 'Night mode', text: 'Night mode follows your system setting.' },
  { title: 'Contact support', text: 'Write to support; we answer within a day.' },
];

const SPECIAL: Record<string, string> = { ł: 'l', Ł: 'l', đ: 'd', Đ: 'd', ø: 'o', Ø: 'o' };
const foldChar = (c: string) => SPECIAL[c] ?? c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function fold(text: string) {
  let folded = '';
  const at: number[] = [];
  Array.from(text).forEach((c, i) => {
    const f = foldChar(c);
    folded += f;
    for (let k = 0; k < f.length; k++) at.push(i);
  });
  return { folded, at };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function ranges(text: string, terms: string[]) {
  const { folded, at } = fold(text);
  const found: [number, number][] = [];
  for (const term of terms) {
    const re = new RegExp(escape(fold(term).folded), 'g');
    for (let m = re.exec(folded); m; m = re.exec(folded)) found.push([at[m.index]!, at[m.index + m[0].length - 1]! + 1]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of found) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const chars = Array.from(text);
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [s, e] of ranges(text, terms)) {
    if (s > at) parts.push(chars.slice(at, s).join(''));
    parts.push(<mark key={s}>{chars.slice(s, e).join('')}</mark>);
    at = e;
  }
  parts.push(chars.slice(at).join(''));
  return <>{parts}</>;
}

const matches = (a: Article, terms: string[]) => {
  const hay = fold(`${a.title} ${a.text}`).folded;
  return terms.every((t) => hay.includes(fold(t).folded));
};

export function Answers() {
  const [query, setQuery] = useState('');
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const shown = terms.length ? ARTICLES.filter((a) => matches(a, terms)) : ARTICLES;
  return (
    <section>
      <h1>Support answers</h1>
      <label>
        Search answers <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <p role="status">{terms.length ? (shown.length === 1 ? '1 answer matches' : `${shown.length} answers match`) : ''}</p>
      <ul aria-label="Answers">
        {shown.map((a) => (
          <li key={a.title}>
            <h2>
              <Highlight text={a.title} terms={terms} />
            </h2>
            <p>
              <Highlight text={a.text} terms={terms} />
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
