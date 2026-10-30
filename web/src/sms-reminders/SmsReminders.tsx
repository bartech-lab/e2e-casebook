import { useState } from 'react';

const GSM_BASIC = new Set('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà');
const GSM_EXTENDED = new Set('^{}\\[~]|€\f');
const PLAIN: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
  '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"', '\u2013': '-', '\u2014': '-', '\u2026': '...',
};

const isGsm = (ch: string) => GSM_BASIC.has(ch) || GSM_EXTENDED.has(ch);

function measure(text: string) {
  const chars = [...text];
  const unicode = chars.some((ch) => !isGsm(ch));
  const units = unicode ? text.length : chars.reduce((n, ch) => n + (GSM_EXTENDED.has(ch) ? 2 : 1), 0);
  const single = unicode ? 70 : 160;
  const part = unicode ? 67 : 153;
  const parts = units <= single ? 1 : Math.ceil(units / part);
  const left = (parts === 1 ? single : parts * part) - units;
  const culprits = [...new Set(chars.filter((ch) => !isGsm(ch)))];
  return { unicode, parts, left, culprits };
}

const toPlain = (text: string) => [...text].map((ch) => PLAIN[ch] ?? ch).join('');

export function SmsReminders() {
  const [text, setText] = useState('');
  const m = measure(text);

  return (
    <section className="sms-reminders">
      <h1>Appointment reminders</h1>
      <label>
        Message
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <p className="sms-meter" aria-live="polite">
        {m.unicode ? 'Unicode' : 'GSM-7'} · {m.parts} {m.parts === 1 ? 'message' : 'messages'} · {m.left} characters left
      </p>
      {m.unicode && (
        <p className="sms-unicode">
          Unicode because of: {m.culprits.join(', ')}{' '}
          <button type="button" onClick={() => setText(toPlain(text))}>
            Replace with plain letters
          </button>
        </p>
      )}
    </section>
  );
}
