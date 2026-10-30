import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };
const START = 250;
const REWARDS: Record<string, number> = { coffee: 100, cinema: 300 };
const EXPIRES = '2027-03-31';

const portOf = (req: FastifyRequest) => (req.headers.host ?? '').split(':')[1] ?? '80';

export type PartnerPoints = ReturnType<typeof createPartnerPoints>;

export function createPartnerPoints(hasSandbox: (id: string) => boolean) {
  const tokens = new Map<string, string>();
  const points = new Map<string, number>();

  function cors(req: FastifyRequest, reply: FastifyReply) {
    const origin = req.headers.origin;
    if (origin === `http://localhost:${portOf(req)}`) {
      reply.header('access-control-allow-origin', origin).header('access-control-expose-headers', 'x-points-expire');
    }
    reply.header('vary', 'Origin');
  }

  const authorised = (req: FastifyRequest<{ Params: Params }>) => {
    const token = tokens.get(req.params.sandbox);
    return !!token && req.headers.authorization === `Bearer ${token}`;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/loyalty-token', async (req) => {
        const token = tokens.get(req.params.sandbox) ?? randomBytes(12).toString('hex');
        tokens.set(req.params.sandbox, token);
        return { token, partner: `http://127.0.0.1:${portOf(req)}/partner/${req.params.sandbox}` };
      });
    },
    serve(root: FastifyInstance) {
      root.register(
        async (scope) => {
          scope.addHook('onRequest', async (req, reply) => {
            cors(req, reply);
            if (!hasSandbox((req.params as Params).sandbox)) return reply.code(404).send({ error: 'unknown sandbox' });
          });
          scope.options<{ Params: Params }>('/:sandbox/*', async (_req, reply) =>
            reply
              .header('access-control-allow-methods', 'GET, POST')
              .header('access-control-allow-headers', 'authorization, content-type')
              .code(204)
              .send(),
          );
          scope.get<{ Params: Params }>('/:sandbox/balance', async (req, reply) => {
            if (!authorised(req)) return reply.code(401).send({ error: 'Sign in again.' });
            return reply.header('x-points-expire', EXPIRES).send({ points: points.get(req.params.sandbox) ?? START });
          });
          scope.post<{ Params: Params; Body: { reward?: string } }>('/:sandbox/redeem', async (req, reply) => {
            if (!authorised(req)) return reply.code(401).send({ error: 'Sign in again.' });
            const cost = REWARDS[req.body?.reward ?? ''];
            if (!cost) return reply.code(400).send({ error: 'Unknown reward.' });
            const have = points.get(req.params.sandbox) ?? START;
            if (have < cost) return reply.code(409).send({ error: `You need ${cost} points for this reward.` });
            points.set(req.params.sandbox, have - cost);
            return reply.header('x-points-expire', EXPIRES).send({ points: have - cost });
          });
        },
        { prefix: '/partner' },
      );
    },
    clear(sandbox: string) {
      tokens.delete(sandbox);
      points.delete(sandbox);
    },
  };
}
