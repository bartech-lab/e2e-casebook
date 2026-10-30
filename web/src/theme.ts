const KEY = 'e2e-casebook:theme';

export type UiTheme = 'light' | 'dark';

export const storedTheme = (): UiTheme => (localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light');

export function applyTheme(theme: UiTheme) {
  if (theme === 'dark') document.documentElement.dataset.ui = 'dark';
  else delete document.documentElement.dataset.ui;
}

export function saveTheme(theme: UiTheme) {
  if (theme === 'dark') localStorage.setItem(KEY, 'dark');
  else localStorage.removeItem(KEY);
  applyTheme(theme);
}
