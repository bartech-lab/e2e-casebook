import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type Params = { sandbox: string };
type Claim = { id: number; amount: number; description: string; status: 'submitted' };
type State = { tokens: Set<string>; claims: Claim[]; nextId: number };
const EMAIL = 'ewa@example.com';
const PASSWORD = 'kawa-z-mlekiem';

export type ExpenseClaims = ReturnType<typeof createExpenseClaims>;

export function createExpenseClaims() {
  const sandboxes = new Map<string, State>();
  const of = (sandbox: string) => {
    if (!sandboxes.has(sandbox)) sandboxes.set(sandbox, { tokens: new Set(), claims: [], nextId: 1 });
    return sandboxes.get(sandbox)!;
  };
  const signedIn = (req: FastifyRequest<{ Params: Params }>) => {
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1];
    return !!token && of(req.params.sandbox).tokens.has(token);
  };

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: { email?: unknown; password?: unknown } }>('/claims/login', async (req, reply) => {
        const { email, password } = req.body ?? {};
        if (email !== EMAIL || password !== PASSWORD) return reply.code(401).send({ error: 'Wrong email or password.' });
        const token = randomBytes(18).toString('base64url');
        of(req.params.sandbox).tokens.add(token);
        return { token, email: EMAIL };
      });
      scope.get<{ Params: Params }>('/claims', async (req, reply) => {
        if (!signedIn(req)) return reply.code(401).send({ error: 'Not signed in.' });
        return { claims: of(req.params.sandbox).claims };
      });
      scope.post<{ Params: Params; Body: { amount?: unknown; description?: unknown } }>('/claims', async (req, reply) => {
        if (!signedIn(req)) return reply.code(401).send({ error: 'Not signed in.' });
        const { amount, description } = req.body ?? {};
        if (typeof amount !== 'number' || !(amount > 0) || typeof description !== 'string' || !description.trim())
          return reply.code(400).send({ error: 'Enter an amount and a description.' });
        const s = of(req.params.sandbox);
        const claim: Claim = { id: s.nextId++, amount, description: description.trim(), status: 'submitted' };
        s.claims.push(claim);
        return reply.code(201).send(claim);
      });
      scope.post<{ Params: Params & { id: string } }>('/claims/:id/approve', async (req, reply) => {
        if (!signedIn(req)) return reply.code(401).send({ error: 'Not signed in.' });
        return reply.code(403).send({ error: 'Only managers can approve claims.' });
      });
      scope.post<{ Params: Params }>('/claims/logout', async (req) => {
        const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1];
        if (token) of(req.params.sandbox).tokens.delete(token);
        return { ok: true };
      });
    },
    expireAll(sandbox: string) {
      const s = of(sandbox);
      const n = s.tokens.size;
      s.tokens.clear();
      return { expired: n };
    },
    clear(sandbox: string) {
      sandboxes.delete(sandbox);
    },
  };
}
