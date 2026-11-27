// The Try address: /?try=<page> opens a new sandbox on that case's page, so other sites (for example the QA Interview Bank)
// can link straight to a case. An unknown page, or no try parameter, gives null and the landing page stays.
export function tryPage(search: string, pages: Iterable<string>): string | null {
  const page = new URLSearchParams(search).get('try');
  if (!page) return null;
  for (const p of pages) if (p === page) return page;
  return null;
}
