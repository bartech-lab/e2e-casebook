import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Contact = Record<'givenName' | 'familyName' | 'email' | 'tel' | 'postalCode' | 'city' | 'street', string>;

const POSTCODES: Record<string, string> = { '00-950': 'Warszawa', '30-001': 'Kraków', '80-001': 'Gdańsk' };
const FIELDS = ['givenName', 'familyName', 'email', 'tel', 'postalCode', 'city', 'street'] as const;

export type TicketContacts = ReturnType<typeof createTicketContacts>;

export function createTicketContacts() {
  const saved = new Map<string, Contact[]>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params & { code: string } }>('/postcodes/:code', async (req, reply) => {
        await new Promise((r) => setTimeout(r, 150));
        const city = POSTCODES[req.params.code];
        return city ? { city } : reply.code(404).send({ error: 'Unknown postal code.' });
      });
      scope.get<{ Params: Params }>('/ticket-contacts', async (req) => ({ contacts: saved.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params }>('/ticket-contacts', async (req, reply) => {
        const body = (req.body ?? {}) as Record<string, unknown>;
        if (!FIELDS.every((f) => typeof body[f] === 'string')) return reply.code(400).send({ error: 'every field must be a string' });
        const contact = Object.fromEntries(FIELDS.map((f) => [f, body[f] as string])) as Contact;
        const list = saved.get(req.params.sandbox) ?? [];
        list.push(contact);
        saved.set(req.params.sandbox, list);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      saved.delete(sandbox);
    },
  };
}
