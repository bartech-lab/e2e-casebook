import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const THEMES = ['system', 'light', 'dark'];
const MOTIONS = ['system', 'reduce', 'full'];
type Prefs = { theme: string; motion: string };

export type Appearances = ReturnType<typeof createAppearances>;

export function createAppearances() {
  const prefs = new Map<string, Prefs>();
  const of = (sandbox: string) => prefs.get(sandbox) ?? { theme: 'system', motion: 'system' };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/appearance', async (req) => of(req.params.sandbox));

      scope.put<{ Params: Params }>('/appearance', async (req, reply) => {
        const body = (req.body ?? {}) as { theme?: unknown; motion?: unknown };
        if (!THEMES.includes(body.theme as string)) return reply.code(400).send({ error: `theme must be one of ${THEMES.join(', ')}` });
        if (!MOTIONS.includes(body.motion as string)) return reply.code(400).send({ error: `motion must be one of ${MOTIONS.join(', ')}` });
        const next = { theme: body.theme as string, motion: body.motion as string };
        prefs.set(req.params.sandbox, next);
        return next;
      });
    },
    clear(sandbox: string) {
      prefs.delete(sandbox);
    },
  };
}
