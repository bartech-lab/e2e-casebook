import type { FastifyInstance, FastifyReply } from 'fastify';

type Params = { sandbox: string };
type Reply = { name: string; guest: string | null; note: string };

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function page(sandbox: string, thanks: string | null) {
  const action = `/api/s/${escape(sandbox)}/rsvp`;
  const body = thanks
    ? `<p role="status">See you there, ${escape(thanks)}!</p>`
    : `<p role="status"></p>
<form id="rsvp" method="post" action="${action}">
<p><label>Your name <input name="name" autocomplete="name" required></label></p>
<p><label><input type="checkbox" name="plusOne" value="yes"> I am bringing a guest</label></p>
<p id="guest"><label>Guest's name <input name="guestName"></label></p>
<p><label>Note for the organisers <textarea name="note" maxlength="200" rows="3" aria-describedby="count"></textarea></label>
<span id="count">0 of 200 characters</span></p>
<button type="submit">Reply</button>
</form>`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Village fête</title>
<script async src="/embed/rsvp/rsvp.js"></script></head>
<body><h1>Village fête</h1><p>Saturday 13 June, 12:00, on the green. Tell us if you are coming.</p>
${body}
</body></html>`;
}

export type Rsvps = ReturnType<typeof createRsvps>;

export function createRsvps() {
  const replies = new Map<string, Reply[]>();
  const html = (reply: FastifyReply, body: string) =>
    reply.code(200).header('content-type', 'text/html; charset=utf-8').header('cache-control', 'no-store').send(body);
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { thanks?: string } }>('/rsvp', async (req, reply) =>
        html(reply, page(req.params.sandbox, typeof req.query.thanks === 'string' ? req.query.thanks : null)),
      );
      scope.get<{ Params: Params }>('/rsvps', async (req) => ({ replies: replies.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params }>('/rsvp', async (req, reply) => {
        const b = (req.body ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
        const name = str(b.name).slice(0, 60);
        if (!name) return reply.code(400).send({ error: 'Enter your name.' });
        const plusOne = b.plusOne === 'yes' || b.plusOne === true;
        const entry = { name, guest: plusOne ? str(b.guestName).slice(0, 60) || null : null, note: str(b.note).slice(0, 200) };
        const list = replies.get(req.params.sandbox) ?? [];
        list.push(entry);
        replies.set(req.params.sandbox, list);
        if ((req.headers.accept ?? '').includes('application/json')) return { name };
        return reply.code(303).header('location', `/api/s/${req.params.sandbox}/rsvp?thanks=${encodeURIComponent(name)}`).send();
      });
    },
    clear(sandbox: string) {
      replies.delete(sandbox);
    },
  };
}
