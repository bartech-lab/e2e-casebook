import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';

type Params = { sandbox: string };
type Upload = { name: string; size: number; parts: Buffer[]; offset: number };
type Fault = { part: number; after: boolean };
const MAX = 50 * 1024 * 1024;

export type ResumableUploads = ReturnType<typeof createResumableUploads>;

export function createResumableUploads() {
  const uploads = new Map<string, Map<string, Upload>>();
  const received = new Map<string, number>();
  const puts = new Map<string, number>();
  const faults = new Map<string, Fault[]>();
  const of = (sandbox: string) => uploads.get(sandbox) ?? uploads.set(sandbox, new Map()).get(sandbox)!;

  function fault(sandbox: string) {
    const n = (puts.get(sandbox) ?? 0) + 1;
    puts.set(sandbox, n);
    return (faults.get(sandbox) ?? []).find((f) => f.part === n);
  }

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('application/offset+octet-stream', { parseAs: 'buffer', bodyLimit: 2 * 1024 * 1024 }, (_req, body, done) => done(null, body));

      scope.post<{ Params: Params; Body: { name?: unknown; size?: unknown } }>('/video-uploads', async (req, reply) => {
        const { name, size } = req.body ?? {};
        if (typeof name !== 'string' || !name || typeof size !== 'number' || size < 1 || size > MAX) {
          return reply.code(400).send({ error: 'body must be { name, size } with size up to 50 MB' });
        }
        const id = randomBytes(8).toString('hex');
        of(req.params.sandbox).set(id, { name, size, parts: [], offset: 0 });
        return reply.code(201).send({ id, offset: 0 });
      });

      scope.get<{ Params: Params & { id: string } }>('/video-uploads/:id', async (req, reply) => {
        const u = of(req.params.sandbox).get(req.params.id);
        if (!u) return reply.code(404).send({ error: 'no such upload' });
        return { offset: u.offset, size: u.size };
      });

      scope.patch<{ Params: Params & { id: string }; Body: Buffer }>(
        '/video-uploads/:id',
        async (req, reply) => {
          const u = of(req.params.sandbox).get(req.params.id);
          if (!u) return reply.code(404).send({ error: 'no such upload' });
          const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
          received.set(req.params.sandbox, (received.get(req.params.sandbox) ?? 0) + body.length);
          const f = fault(req.params.sandbox);
          if (f && !f.after) {
            reply.hijack();
            reply.raw.writeHead(200, { 'content-type': 'application/json', 'content-length': '64' });
            reply.raw.write('{"off', () => setTimeout(() => reply.raw.destroy(), 50));
            return;
          }
          const at = Number(req.headers['upload-offset']);
          if (at !== u.offset) return reply.code(409).send({ offset: u.offset });
          if (u.offset + body.length > u.size) return reply.code(400).send({ error: 'more bytes than the size' });
          u.parts.push(body);
          u.offset += body.length;
          if (f?.after) return reply.code(500).send({ error: 'server error' });
          return { offset: u.offset };
        },
      );

      scope.get<{ Params: Params }>('/video-uploads', async (req) => ({
        files: [...of(req.params.sandbox).values()]
          .filter((u) => u.offset === u.size)
          .map((u) => ({ name: u.name, size: u.size, sha256: createHash('sha256').update(Buffer.concat(u.parts)).digest('hex') })),
      }));
    },
    fail(sandbox: string, list: Fault[]) {
      faults.set(sandbox, list);
      puts.set(sandbox, 0);
    },
    received(sandbox: string) {
      return received.get(sandbox) ?? 0;
    },
    clear(sandbox: string) {
      uploads.delete(sandbox);
      received.delete(sandbox);
      puts.delete(sandbox);
      faults.delete(sandbox);
    },
  };
}
