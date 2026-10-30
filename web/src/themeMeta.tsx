import {
  Accessibility, CalendarClock, CreditCard, Cpu, FileUp, FlaskConical, LayoutGrid, ListOrdered, Radio, ShieldCheck,
  TextCursorInput, Timer, WifiOff, type LucideIcon,
} from 'lucide-react';

// One icon and one hue per case theme; the hue drives --hue in CSS for tags, dots and card accents.
export const THEME_META: Record<string, { icon: LucideIcon; hue: number; blurb: string }> = {
  'Realtime and multi-user': { icon: Radio, hue: 265, blurb: 'Two browsers, sockets, replay after reconnect' },
  'Async, races and network': { icon: Timer, hue: 25, blurb: 'Out-of-order responses, retries, slow servers' },
  'Time, dates and locales': { icon: CalendarClock, hue: 200, blurb: 'Time zones, DST, plurals, formats' },
  'Forms and input': { icon: TextCursorInput, hue: 160, blurb: 'Validation, paste, undo, unsaved changes' },
  'Accessibility and keyboard': { icon: Accessibility, hue: 330, blurb: 'ARIA patterns, focus, screen readers' },
  'Sign-in, sessions and security': { icon: ShieldCheck, hue: 0, blurb: 'Magic links, 2FA, tokens, CSP, roles' },
  'Files, uploads and downloads': { icon: FileUp, hue: 45, blurb: 'Progress, cancel, PDFs, printing' },
  'Money and checkout': { icon: CreditCard, hue: 140, blurb: 'Totals, VAT, discounts, minor units' },
  'Lists, layout and scrolling': { icon: ListOrdered, hue: 220, blurb: 'Virtual lists, sticky bars, reflow' },
  'Offline, caching and storage': { icon: WifiOff, hue: 290, blurb: 'Service workers, IndexedDB, ETags' },
  'Browser APIs and devices': { icon: Cpu, hue: 185, blurb: 'Clipboard, media, touch, workers' },
  'Test environments': { icon: FlaskConical, hue: 90, blurb: 'Shared data, flags, isolation' },
};

export const OTHER = { icon: LayoutGrid, hue: 230, blurb: '' };
export const themeMeta = (theme: string) => THEME_META[theme] ?? OTHER;
export const hueStyle = (theme: string) => ({ '--hue': themeMeta(theme).hue }) as React.CSSProperties;

export const GitHubMark = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

export const LogoMark = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M9 10h9M9 16h14M9 22h6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="23" cy="22" r="3.2" fill="none" stroke="#fff" strokeWidth="2.2" />
  </svg>
);
