import type { FastifyInstance } from 'fastify';
import type { Exports } from './exports.ts';
import type { Store } from './store.ts';
import { cardChange } from './validation.ts';

type Params = { sandbox: string };
type CardParams = Params & { id: string };

const etag = (version: number) => `"${version}"`;

function ifMatchVersion(header: string | string[] | undefined) {
  if (typeof header !== 'string') return undefined;
  const m = /^(?:W\/)?"(\d+)"$/.exec(header.trim());
  return m ? Number(m[1]) : NaN;
}

export function registerBoardRoutes(scope: FastifyInstance, store: Store, exportJobs: Exports) {
  scope.get<{ Params: Params }>('/cards', async (req) => ({ cards: store.listCards(req.params.sandbox) }));

  scope.get<{ Params: CardParams }>('/cards/:id', async (req, reply) => {
    const card = store.getCard(req.params.sandbox, Number(req.params.id));
    if (!card) return reply.code(404).send({ error: 'unknown card' });
    return reply.header('etag', etag(card.version)).send(card);
  });

  scope.patch<{ Params: CardParams }>('/cards/:id', async (req, reply) => {
    const { sandbox } = req.params;
    const id = Number(req.params.id);
    const current = store.getCard(sandbox, id);
    if (!current) return reply.code(404).send({ error: 'unknown card' });
    const input = cardChange(req.body);
    if (!input) return reply.code(400).send({ error: 'invalid change' });
    const expected = ifMatchVersion(req.headers['if-match']);
    if (Number.isNaN(expected)) return reply.code(400).send({ error: 'malformed If-Match' });
    if (expected !== undefined && expected !== current.version) {
      return reply.code(412).header('etag', etag(current.version)).send({ error: 'version mismatch', current });
    }
    const card = store.updateCard(sandbox, id, input.change, input.by)!;
    return reply.header('etag', etag(card.version)).send(card);
  });

  scope.get<{ Params: Params }>('/exports', async (req) => ({ exports: exportJobs.all(req.params.sandbox) }));

  scope.post<{ Params: Params }>('/exports', async (req, reply) =>
    reply.code(201).send(exportJobs.start(req.params.sandbox)),
  );

  scope.get<{ Params: CardParams }>('/exports/:id', async (req, reply) => {
    const job = exportJobs.get(req.params.sandbox, Number(req.params.id));
    return job ? job : reply.code(404).send({ error: 'unknown export' });
  });

  scope.post<{ Params: CardParams }>('/exports/:id/cancel', async (req, reply) => {
    const job = exportJobs.cancel(req.params.sandbox, Number(req.params.id));
    if (job === undefined) return reply.code(404).send({ error: 'unknown export' });
    if (job === null) return reply.code(409).send({ error: 'only a running export can be cancelled' });
    return job;
  });

  scope.post<{ Params: CardParams }>('/exports/:id/retry', async (req, reply) => {
    const job = exportJobs.retry(req.params.sandbox, Number(req.params.id));
    if (job === undefined) return reply.code(404).send({ error: 'unknown export' });
    if (job === null) return reply.code(409).send({ error: 'only a failed or cancelled export can be retried' });
    return reply.code(201).send(job);
  });

  scope.get<{ Params: CardParams }>('/exports/:id/file', async (req, reply) => {
    const { sandbox } = req.params;
    const id = Number(req.params.id);
    if (!exportJobs.get(sandbox, id)) return reply.code(404).send({ error: 'unknown export' });
    const csv = exportJobs.file(sandbox, id);
    if (csv === undefined) return reply.code(409).send({ error: 'export is not done' });
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="board-export-${id}.csv"`)
      .send(csv);
  });
}
