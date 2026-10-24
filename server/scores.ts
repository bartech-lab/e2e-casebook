import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Score = { home: number; away: number };

export type Scores = ReturnType<typeof createScores>;

export function createScores() {
  const scores = new Map<string, Score>();
  const reads = new Map<string, number>();
  const of = (sandbox: string) => {
    if (!scores.has(sandbox)) scores.set(sandbox, { home: 0, away: 0 });
    return scores.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/score', async (req) => {
        reads.set(req.params.sandbox, (reads.get(req.params.sandbox) ?? 0) + 1);
        return { ...of(req.params.sandbox) };
      });
    },
    goal(sandbox: string, team: 'home' | 'away') {
      of(sandbox)[team]++;
      return { ...of(sandbox), reads: reads.get(sandbox) ?? 0 };
    },
    reads(sandbox: string) {
      return { reads: reads.get(sandbox) ?? 0 };
    },
    clear(sandbox: string) {
      scores.delete(sandbox);
      reads.delete(sandbox);
    },
  };
}
