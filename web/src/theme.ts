const KEY = 'e2e-casebook:theme';

export type UiTheme = 'light' | 'dark';

// Dark for people; light under automation unless a test picks a theme, so colour and screenshot checks
// keep one baseline.
export function storedTheme(): UiTheme {
  const stored = localStorage.getItem(KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return navigator.webdriver ? 'light' : 'dark';
}

export function applyTheme(theme: UiTheme) {
  if (theme === 'dark') document.documentElement.dataset.ui = 'dark';
  else delete document.documentElement.dataset.ui;
}

export function saveTheme(theme: UiTheme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}
