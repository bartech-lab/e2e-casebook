import { useEffect, useState } from 'react';

type Lang = 'en' | 'ar';

const TEXT = {
  en: { title: 'Order summary', language: 'Language', order: 'Order', placed: 'Placed on', total: 'Total', back: 'Back', pay: 'Pay now' },
  ar: { title: 'ملخص الطلب', language: 'اللغة', order: 'الطلب', placed: 'تاريخ الطلب', total: 'المجموع', back: 'رجوع', pay: 'ادفع الآن' },
};
const LOCALE: Record<Lang, string> = { en: 'en-GB', ar: 'ar-EG' };
const key = (sandbox: string) => `lang:${sandbox}`;

export function Summary({ sandbox }: { sandbox: string }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(key(sandbox)) === 'ar' ? 'ar' : 'en'));
  const t = TEXT[lang];
  const rtl = lang === 'ar';

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = rtl ? 'rtl' : 'ltr';
    return () => {
      html.lang = 'en';
      html.dir = 'ltr';
    };
  }, [lang, rtl]);

  function choose(next: Lang) {
    localStorage.setItem(key(sandbox), next);
    setLang(next);
  }

  const number = (n: number) => new Intl.NumberFormat(LOCALE[lang]).format(n);
  const money = (n: number) => new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'PLN' }).format(n);
  const date = new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(new Date('2026-03-06T12:00:00Z'));

  return (
    <section className="summary">
      <h1>{t.title}</h1>
      <p>
        <label htmlFor="summary-lang">{t.language}</label>{' '}
        <select id="summary-lang" value={lang} onChange={(e) => choose(e.target.value as Lang)}>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </p>
      <dl>
        <dt>{t.order}</dt>
        <dd>{number(1042)}</dd>
        <dt>{t.placed}</dt>
        <dd>{date}</dd>
        <dt>{t.total}</dt>
        <dd>{money(1234.5)}</dd>
      </dl>
      <div className="summary-actions">
        <button type="button">{t.back}</button>
        <button type="button">
          {t.pay} <span aria-hidden="true">{rtl ? '←' : '→'}</span>
        </button>
      </div>
    </section>
  );
}
