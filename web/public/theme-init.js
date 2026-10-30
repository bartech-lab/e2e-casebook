// Runs before first paint so the page never flashes the wrong theme. Mirrors storedTheme() in src/theme.ts.
(function () {
  var t = localStorage.getItem('e2e-casebook:theme');
  if (t === 'dark' || (t !== 'light' && !navigator.webdriver)) document.documentElement.dataset.ui = 'dark';
})();
