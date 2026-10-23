import type { FastifyInstance, FastifyRequest } from 'fastify';

type Params = { sandbox: string };
export type Role = 'viewer' | 'editor' | 'admin';
type Team = { body: string; roles: Map<string, Role> };

const ROLES: Role[] = ['viewer', 'editor', 'admin'];
const fresh = (): Team => ({
  body: 'Ship the new checkout in March.',
  roles: new Map<string, Role>([
    ['ann', 'admin'],
    ['bob', 'editor'],
    ['cy', 'viewer'],
  ]),
});

export type Teams = ReturnType<typeof createTeams>;

export function createTeams() {
  const teams = new Map<string, Team>();
  const team = (sandbox: string) => {
    if (!teams.has(sandbox)) teams.set(sandbox, fresh());
    return teams.get(sandbox)!;
  };
  const roleOf = (req: FastifyRequest<{ Params: Params }>) => team(req.params.sandbox).roles.get(String(req.headers['x-user'] ?? ''));
  const view = (t: Team, user: string) => ({ body: t.body, me: { user, role: t.roles.get(user) }, members: [...t.roles].map(([name, role]) => ({ name, role })) });

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/team', async (req, reply) => {
        if (!roleOf(req)) return reply.code(401).send({ error: 'Not a member.' });
        return view(team(req.params.sandbox), String(req.headers['x-user']));
      });

      scope.put<{ Params: Params }>('/team/doc', async (req, reply) => {
        const role = roleOf(req);
        if (!role) return reply.code(401).send({ error: 'Not a member.' });
        if (role !== 'editor' && role !== 'admin') return reply.code(403).send({ error: 'Only editors and admins can edit.', role });
        const body = (req.body as { body?: unknown } | undefined)?.body;
        if (typeof body !== 'string') return reply.code(400).send({ error: 'body must be a string' });
        team(req.params.sandbox).body = body;
        return view(team(req.params.sandbox), String(req.headers['x-user']));
      });

      scope.put<{ Params: Params & { user: string } }>('/team/members/:user', async (req, reply) => {
        const role = roleOf(req);
        if (!role) return reply.code(401).send({ error: 'Not a member.' });
        if (role !== 'admin') return reply.code(403).send({ error: 'Only admins can change roles.', role });
        const t = team(req.params.sandbox);
        const next = (req.body as { role?: unknown } | undefined)?.role as Role;
        if (!ROLES.includes(next) || !t.roles.has(req.params.user)) return reply.code(400).send({ error: 'Unknown member or role.' });
        const admins = [...t.roles.values()].filter((r) => r === 'admin').length;
        if (t.roles.get(req.params.user) === 'admin' && next !== 'admin' && admins === 1) return reply.code(409).send({ error: 'A team needs at least one admin.' });
        t.roles.set(req.params.user, next);
        return view(t, String(req.headers['x-user']));
      });
    },
    setRole(sandbox: string, user: string, role: Role) {
      team(sandbox).roles.set(user, role);
    },
    clear(sandbox: string) {
      teams.delete(sandbox);
    },
  };
}
