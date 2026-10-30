const KEY = 'e2e-casebook:theme';

export type UiTheme = 'light' | 'dark';

// Storage can be blocked (privacy settings, the storage-full case); the theme then lasts for the page only.
function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Dark for people; light under automation unless a test picks a theme, so colour and screenshot checks
// keep one baseline.
export function storedTheme(): UiTheme {
  const stored = read();
  if (stored === 'dark' || stored === 'light') return stored;
  return navigator.webdriver ? 'light' : 'dark';
}

export function applyTheme(theme: UiTheme) {
  if (theme === 'dark') document.documentElement.dataset.ui = 'dark';
  else delete document.documentElement.dataset.ui;
}

export function saveTheme(theme: UiTheme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Blocked storage: keep the choice for this page only.
  }
  applyTheme(theme);
}
