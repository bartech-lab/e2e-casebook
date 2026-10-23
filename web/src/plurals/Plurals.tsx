import { useEffect, useState } from 'react';

type Lang = 'en' | 'pl';
const TEXT = {
  en: {
    title: 'Messages',
    count: 'Messages',
    fewer: 'Fewer messages',
    more: 'More messages',
    none: 'No new messages',
    forms: { one: '{n} new message', other: '{n} new messages' } as Record<string, string>,
  },
  pl: {
    title: 'Wiadomości',
    count: 'Liczba wiadomości',
    fewer: 'Mniej wiadomości',
    more: 'Więcej wiadomości',
    none: 'Brak nowych wiadomości',
    forms: { one: '{n} nowa wiadomość', few: '{n} nowe wiadomości', many: '{n} nowych wiadomości', other: '{n} nowej wiadomości' } as Record<string, string>,
  },
};

const storageKey = (sandbox: string) => `lang:${sandbox}`;

function summary(lang: Lang, n: number) {
  const t = TEXT[lang];
  if (n === 0) return t.none;
  const rule = new Intl.PluralRules(lang).select(n);
  return (t.forms[rule] ?? t.forms.other!).replace('{n}', new Intl.NumberFormat(lang).format(n));
}

export function Plurals({ sandbox }: { sandbox: string }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(storageKey(sandbox));
    if (saved === 'en' || saved === 'pl') return saved;
    return navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en';
  });
  const [n, setN] = useState(3);
  const t = TEXT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  return (
    <section>
      <h1>{t.title}</h1>
      <label>
        Language / Język{' '}
        <select
          value={lang}
          onChange={(e) => {
            const next = e.target.value as Lang;
            setLang(next);
            localStorage.setItem(storageKey(sandbox), next);
          }}
        >
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </label>
      <p>
        <button type="button" aria-label={t.fewer} onClick={() => setN(Math.max(0, n - 1))}>
          −
        </button>{' '}
        <label>
          {t.count} <input type="number" min={0} value={n} onChange={(e) => setN(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </label>{' '}
        <button type="button" aria-label={t.more} onClick={() => setN(n + 1)}>
          +
        </button>
      </p>
      <p role="status">{summary(lang, n)}</p>
    </section>
  );
}
