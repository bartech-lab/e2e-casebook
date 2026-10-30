import { useState } from 'react';
import { saveTheme, storedTheme } from './theme.ts';

// Named by what a press does next, so the name and the icon both flip with the theme (no aria-pressed).
// The name is text content, not aria-label: getByLabel matches substrings, and "Switch to…" would answer
// getByLabel('To') on case pages.
export function ThemeToggle() {
  const [dark, setDark] = useState(() => storedTheme() === 'dark');
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button
      type="button"
      className="theme-toggle"
      title={label}
      onClick={() => {
        saveTheme(dark ? 'light' : 'dark');
        setDark(!dark);
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

const svg = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const MoonIcon = () => (
  <svg {...svg}>
    <path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a6.6 6.6 0 0 0 10.6 10.6Z" />
  </svg>
);

const SunIcon = () => (
  <svg {...svg}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
