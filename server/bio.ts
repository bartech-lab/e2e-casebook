import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

const ALLOWED = new Set(['b', 'strong', 'i', 'em', 'a', 'p', 'div', 'br']);
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
const ATTR = /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

const escapeText = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s: string) => s.replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function href(attrs: string) {
  for (const m of attrs.matchAll(ATTR)) {
    if (m[1]!.toLowerCase() !== 'href') continue;
    const value = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    return /^https?:\/\//i.test(value) ? value : null;
  }
  return null;
}

export function sanitize(html: string) {
  const input = html.replace(/<(script|style)\b[\s\S]*?(<\/\1\s*>|$)/gi, '');
  let out = '';
  let last = 0;
  for (const m of input.matchAll(TAG)) {
    out += escapeText(input.slice(last, m.index));
    last = m.index + m[0].length;
    const name = m[2]?.toLowerCase();
    if (!name || !ALLOWED.has(name)) continue;
    if (m[1]) out += name === 'br' ? '' : `</${name}>`;
    else if (name === 'a') {
      const link = href(m[3]!);
      out += link ? `<a href="${escapeAttr(link)}" rel="noopener noreferrer">` : '<a>';
    } else out += `<${name}>`;
  }
  return out + escapeText(input.slice(last));
}

export type Bios = ReturnType<typeof createBios>;

export function createBios() {
  const bios = new Map<string, string>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/bio', async (req) => ({ html: bios.get(req.params.sandbox) ?? '' }));

      scope.put<{ Params: Params }>('/bio', async (req, reply) => {
        const { html } = (req.body ?? {}) as { html?: unknown };
        if (typeof html !== 'string' || html.length > 5000) return reply.code(400).send({ error: 'html of at most 5000 characters' });
        const clean = sanitize(html);
        bios.set(req.params.sandbox, clean);
        return { html: clean };
      });
    },
    clear(sandbox: string) {
      bios.delete(sandbox);
    },
  };
}
