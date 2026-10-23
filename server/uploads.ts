import type { FastifyInstance } from 'fastify';
import type { Readable } from 'node:stream';
import { createHash } from 'node:crypto';

type Params = { sandbox: string };
type Upload = { name: string; size: number; sha256: string };

export const UPLOAD_LIMIT = 20 * 1024 * 1024;
const tooBig = 'Files can be at most 20 MB.';

export type Uploads = ReturnType<typeof createUploads>;

export function createUploads() {
  const files = new Map<string, Upload[]>();
  const pace = new Map<string, number>();
  const list = (sandbox: string) => {
    if (!files.has(sandbox)) files.set(sandbox, []);
    return files.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('application/octet-stream', (_req, payload, done) => done(null, payload));

      scope.get<{ Params: Params }>('/uploads', async (req) => list(req.params.sandbox));

      scope.put<{ Params: Params & { name: string } }>('/uploads/:name', { bodyLimit: 2 * UPLOAD_LIMIT }, async (req, reply) => {
        if (Number(req.headers['content-length'] ?? 0) > UPLOAD_LIMIT) return reply.code(413).send({ error: tooBig });
        const hash = createHash('sha256');
        let size = 0;
        try {
          for await (const chunk of req.body as Readable) {
            size += (chunk as Buffer).length;
            if (size > UPLOAD_LIMIT) return reply.code(413).send({ error: tooBig });
            hash.update(chunk as Buffer);
            const rate = pace.get(req.params.sandbox);
            const until = rate ? Date.now() + ((chunk as Buffer).length / rate) * 1000 : 0;
            while (pace.get(req.params.sandbox) && Date.now() < until) await new Promise((r) => setTimeout(r, 20));
          }
        } catch {
          return reply.code(400).send({ error: 'Upload interrupted.' });
        }
        const upload = { name: req.params.name, size, sha256: hash.digest('hex') };
        const all = list(req.params.sandbox).filter((u) => u.name !== upload.name);
        files.set(req.params.sandbox, [...all, upload]);
        return reply.code(201).send(upload);
      });
    },
    setPace(sandbox: string, bytesPerSecond: number) {
      if (bytesPerSecond > 0) pace.set(sandbox, bytesPerSecond);
      else pace.delete(sandbox);
    },
    clear(sandbox: string) {
      files.delete(sandbox);
      pace.delete(sandbox);
    },
  };
}
