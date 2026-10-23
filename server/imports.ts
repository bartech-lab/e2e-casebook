import type { FastifyInstance } from 'fastify';
import type { ServerResponse } from 'node:http';

type Params = { sandbox: string };
type Event = { id: number; event: string; data: object };
type Job = { id: number; done: number; events: Event[]; manual: boolean; timer?: ReturnType<typeof setInterval>; streams: Set<ServerResponse> };

const TOTAL = 100;
const BAD: Record<number, string> = { 13: 'Row 13: email is missing.', 47: 'Row 47: date is not a date.' };

const frame = (e: Event) => `id: ${e.id}\nevent: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`;

export type Imports = ReturnType<typeof createImports>;

export function createImports() {
  const jobs = new Map<string, Job>();
  const manual = new Set<string>();

  function push(job: Job, event: string, data: object) {
    const e = { id: job.events.length + 1, event, data };
    job.events.push(e);
    for (const s of job.streams) s.write(frame(e));
  }

  function step(job: Job, rows: number) {
    for (let i = 0; i < rows && job.done < TOTAL; i++) {
      const row = ++job.done;
      if (BAD[row]) push(job, 'row-error', { row, message: BAD[row] });
      push(job, 'progress', { done: row, total: TOTAL });
      if (row === TOTAL) {
        push(job, 'complete', { imported: TOTAL - Object.keys(BAD).length, failed: Object.keys(BAD).length });
        clearInterval(job.timer);
        for (const s of job.streams) s.end();
        job.streams.clear();
      }
    }
  }

  function stop(sandbox: string) {
    const job = jobs.get(sandbox);
    if (!job) return;
    clearInterval(job.timer);
    for (const s of job.streams) s.end();
  }

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/imports', async (req) => {
        const previous = jobs.get(req.params.sandbox);
        stop(req.params.sandbox);
        const job: Job = { id: (previous?.id ?? 0) + 1, done: 0, events: [], manual: manual.has(req.params.sandbox), streams: new Set() };
        if (!job.manual) job.timer = setInterval(() => step(job, 1), 30);
        jobs.set(req.params.sandbox, job);
        return { id: job.id, total: TOTAL };
      });

      scope.get<{ Params: Params & { id: string } }>('/imports/:id/events', async (req, reply) => {
        const job = jobs.get(req.params.sandbox);
        if (!job || String(job.id) !== req.params.id) return reply.code(404).send({ error: 'No such import.' });
        const after = Number(req.headers['last-event-id'] ?? 0) || 0;
        reply.hijack();
        const res = reply.raw;
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write('retry: 500\n\n');
        for (const e of job.events) if (e.id > after) res.write(frame(e));
        if (job.done === TOTAL) return void res.end();
        job.streams.add(res);
        req.raw.on('close', () => job.streams.delete(res));
      });
    },
    setManual(sandbox: string, on: boolean) {
      if (on) manual.add(sandbox);
      else manual.delete(sandbox);
    },
    step(sandbox: string, rows: number) {
      const job = jobs.get(sandbox);
      if (job) step(job, rows);
    },
    drop(sandbox: string) {
      const job = jobs.get(sandbox);
      if (!job) return 0;
      const n = job.streams.size;
      for (const s of job.streams) s.end();
      job.streams.clear();
      return n;
    },
    clear(sandbox: string) {
      stop(sandbox);
      jobs.delete(sandbox);
      manual.delete(sandbox);
    },
  };
}
