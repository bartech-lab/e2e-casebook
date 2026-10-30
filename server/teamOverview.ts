import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };
type Session = { access: Set<string>; refresh: string; used: Set<string>; ended: boolean; refreshes: number };
const PANELS: Record<string, string[]> = {
  rota: ['Monday: Ola and Marek', 'Tuesday: Kasia', 'Wednesday: Piotr and Ewa'],
  holidays: ['Kasia: 3 to 7 November', 'Marek: 24 to 31 December'],
  announcements: ['The office is closed on 11 November.', 'New coffee machine on the second floor.'],
};
const token = () => randomBytes(12).toString('hex');

export type TeamOverview = ReturnType<typeof createTeamOverview>;

export function createTeamOverview() {
  const sessions = new Map<string, Session>();

  const bearer = (req: FastifyRequest) => (req.headers.authorization ?? '').replace(/^Bearer /, '');

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/team-auth/sign-in', async (req) => {
        const s: Session = { access: new Set([token()]), refresh: token(), used: new Set(), ended: false, refreshes: 0 };
        sessions.set(req.params.sandbox, s);
        return { access: [...s.access][0], refresh: s.refresh };
      });
      scope.post<{ Params: Params; Body: { refresh?: string } }>('/team-auth/refresh', async (req, reply) => {
        const s = sessions.get(req.params.sandbox);
        const given = req.body?.refresh ?? '';
        if (s) s.refreshes++;
        if (!s || s.ended) return reply.code(401).send({ error: 'session ended' });
        if (given !== s.refresh) {
          if (s.used.has(given)) {
            s.ended = true;
            s.access.clear();
          }
          return reply.code(401).send({ error: 'session ended' });
        }
        s.used.add(given);
        s.refresh = token();
        const access = token();
        s.access = new Set([access]);
        return { access, refresh: s.refresh };
      });
      scope.get<{ Params: Params & { panel: string } }>('/team-panels/:panel', async (req, reply) => {
        const s = sessions.get(req.params.sandbox);
        if (!s || s.ended || !s.access.has(bearer(req))) return reply.code(401).send({ error: 'access token expired' });
        const items = PANELS[req.params.panel];
        if (!items) return reply.code(404).send({ error: 'no such panel' });
        return { items };
      });
    },
    expireAccess(sandbox: string) {
      sessions.get(sandbox)?.access.clear();
    },
    end(sandbox: string) {
      const s = sessions.get(sandbox);
      if (s) {
        s.ended = true;
        s.access.clear();
      }
    },
    stats(sandbox: string) {
      const s = sessions.get(sandbox);
      return { refreshes: s?.refreshes ?? 0, ended: s?.ended ?? false };
    },
    clear(sandbox: string) {
      sessions.delete(sandbox);
    },
  };
}
