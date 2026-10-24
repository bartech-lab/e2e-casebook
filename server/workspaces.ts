import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type State = { setupDone: boolean; delayMs: number; name: string };
const DEFAULT: State = { setupDone: true, delayMs: 300, name: 'Bakery Kowalski' };

export type Workspaces = ReturnType<typeof createWorkspaces>;

export function createWorkspaces() {
  const states = new Map<string, State>();
  const of = (sandbox: string) => {
    if (!states.has(sandbox)) states.set(sandbox, { ...DEFAULT });
    return states.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/workspace', async (req) => {
        const s = of(req.params.sandbox);
        await new Promise((r) => setTimeout(r, s.delayMs));
        return { name: s.name, setupDone: s.setupDone };
      });
      scope.post<{ Params: Params }>('/workspace/finish-setup', async (req) => {
        of(req.params.sandbox).setupDone = true;
        return { setupDone: true };
      });
    },
    set(sandbox: string, patch: Partial<Pick<State, 'setupDone' | 'delayMs'>>) {
      Object.assign(of(sandbox), patch);
      const { setupDone, delayMs } = of(sandbox);
      return { setupDone, delayMs };
    },
    clear(sandbox: string) {
      states.delete(sandbox);
    },
  };
}
