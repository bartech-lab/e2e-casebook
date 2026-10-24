import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const DEFAULT_PACE_MS = 120;

export const answerFor = (question: string) =>
  `About "${question}": the full answer is in the members' handbook, chapter three, which the office can post to you.`;

export type Assistant = ReturnType<typeof createAssistant>;

export function createAssistant() {
  const pace = new Map<string, number>();
  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: { question?: unknown } }>('/assistant/ask', async (req, reply) => {
        const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
        if (!question || question.length > 200) return reply.code(400).send({ error: 'Ask a question of up to 200 characters.' });
        const words = answerFor(question).split(/(?<= )/);
        const ms = pace.get(req.params.sandbox) ?? DEFAULT_PACE_MS;
        reply.hijack();
        const res = reply.raw;
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
        let closed = false;
        res.on('close', () => (closed = true));
        for (const w of words) {
          await new Promise((r) => setTimeout(r, ms));
          if (closed) return;
          res.write(w);
        }
        res.end();
      });
    },
    setPace(sandbox: string, ms: number) {
      pace.set(sandbox, ms);
    },
    clear(sandbox: string) {
      pace.delete(sandbox);
    },
  };
}
