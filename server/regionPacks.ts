import { gzipSync } from 'node:zlib';
import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string; region: string };

export type RegionPacks = ReturnType<typeof createRegionPacks>;

type Region = { slug: string; body: Buffer; gzip: boolean; length: boolean };

function packBytes(size: number, seed: number) {
  const out = Buffer.alloc(size);
  let x = seed;
  for (let i = 0; i < size; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out[i] = 97 + ((x >>> 16) % 4);
  }
  return out;
}

const REGIONS: Region[] = [
  { slug: 'krakow', body: packBytes(2_000_000, 1), gzip: false, length: true },
  { slug: 'gdansk', body: packBytes(3_000_000, 2), gzip: true, length: true },
  { slug: 'tatry', body: packBytes(1_500_000, 3), gzip: false, length: false },
];
const zipped = new Map(REGIONS.filter((r) => r.gzip).map((r) => [r.slug, gzipSync(r.body)]));
const CHUNKS = 16;

export function createRegionPacks() {
  const pace = new Map<string, number>();
  const cut = new Map<string, string>();
  const stats = new Map<string, { completed: number; stopped: number }>();
  const stat = (sandbox: string) => {
    let s = stats.get(sandbox);
    if (!s) stats.set(sandbox, (s = { completed: 0, stopped: 0 }));
    return s;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/region-packs/:region', async (req, reply) => {
        const region = REGIONS.find((r) => r.slug === req.params.region);
        if (!region) return reply.code(404).send({ error: 'no such region' });
        const sandbox = req.params.sandbox;
        const body = zipped.get(region.slug) ?? region.body;
        const headers: Record<string, string | number> = { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' };
        if (region.gzip) headers['content-encoding'] = 'gzip';
        if (region.length) headers['content-length'] = body.length;
        const cutHere = cut.get(sandbox) === region.slug;
        if (cutHere) cut.delete(sandbox);
        const wait = pace.get(sandbox) ?? 40;
        reply.hijack();
        const res = reply.raw;
        res.writeHead(200, headers);
        let done = false;
        res.on('close', () => {
          if (!done) stat(sandbox).stopped += 1;
        });
        const step = Math.ceil(body.length / CHUNKS);
        for (let i = 0; i < CHUNKS; i++) {
          if (cutHere && i === CHUNKS / 2) {
            setTimeout(() => res.destroy(), 50);
            return;
          }
          if (i > 0) await new Promise((r) => setTimeout(r, wait));
          if (res.destroyed) return;
          res.write(body.subarray(i * step, (i + 1) * step));
        }
        if (res.destroyed) return;
        done = true;
        stat(sandbox).completed += 1;
        res.end();
      });
    },
    setPace(sandbox: string, ms: number) {
      pace.set(sandbox, ms);
    },
    cutNext(sandbox: string, region: string) {
      cut.set(sandbox, region);
    },
    stats(sandbox: string) {
      return stat(sandbox);
    },
    clear(sandbox: string) {
      pace.delete(sandbox);
      cut.delete(sandbox);
      stats.delete(sandbox);
    },
  };
}
