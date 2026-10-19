import type { Faults } from './faults.ts';
import type { Store } from './store.ts';

export type ExportStatus = 'running' | 'done' | 'failed' | 'cancelled';
export type ExportJob = {
  id: number;
  status: ExportStatus;
  progress: number;
  error: string | null;
  retryOf: number | null;
};

const STEPS = 10;

export type Exports = ReturnType<typeof createExports>;

export function createExports(store: Store, faults: Faults) {
  const jobs = new Map<string, Map<number, ExportJob & { timer?: NodeJS.Timeout; csv?: string }>>();

  function list(sandbox: string) {
    let m = jobs.get(sandbox);
    if (!m) {
      m = new Map();
      jobs.set(sandbox, m);
    }
    return m;
  }

  function view(job: ExportJob): ExportJob {
    const { id, status, progress, error, retryOf } = job;
    return { id, status, progress, error, retryOf };
  }

  function csv(sandbox: string) {
    const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
    const rows = store.listCards(sandbox).map((c) => [c.id, c.title, c.status, c.version].map(quote).join(','));
    return ['id,title,status,version', ...rows].join('\n') + '\n';
  }

  function start(sandbox: string, retryOf: number | null) {
    const m = list(sandbox);
    const id = Math.max(0, ...m.keys()) + 1;
    const job: ExportJob & { timer?: NodeJS.Timeout; csv?: string } = {
      id,
      status: 'running',
      progress: 0,
      error: null,
      retryOf,
    };
    m.set(id, job);
    const { stepMs } = faults.exportSettings(sandbox);
    const failAt = faults.consumeExportFailure(sandbox);
    let step = 0;
    const tick = () => {
      if (job.status !== 'running') return;
      step += 1;
      if (failAt !== null && step === failAt) {
        job.status = 'failed';
        job.error = `Export failed at step ${step} of ${STEPS}`;
        return;
      }
      job.progress = step * (100 / STEPS);
      if (step === STEPS) {
        job.status = 'done';
        job.csv = csv(sandbox);
        return;
      }
      job.timer = setTimeout(tick, stepMs);
    };
    job.timer = setTimeout(tick, stepMs);
    return view(job);
  }

  return {
    start: (sandbox: string) => start(sandbox, null),
    all: (sandbox: string) => [...list(sandbox).values()].sort((a, b) => b.id - a.id).map(view),
    get: (sandbox: string, id: number) => {
      const job = list(sandbox).get(id);
      return job && view(job);
    },
    file: (sandbox: string, id: number) => list(sandbox).get(id)?.csv,
    cancel(sandbox: string, id: number) {
      const job = list(sandbox).get(id);
      if (!job) return undefined;
      if (job.status !== 'running') return null;
      clearTimeout(job.timer);
      job.status = 'cancelled';
      return view(job);
    },
    retry(sandbox: string, id: number) {
      const job = list(sandbox).get(id);
      if (!job) return undefined;
      if (job.status !== 'failed' && job.status !== 'cancelled') return null;
      return start(sandbox, id);
    },
    clear(sandbox: string) {
      for (const job of list(sandbox).values()) clearTimeout(job.timer);
      jobs.delete(sandbox);
    },
    stop() {
      for (const m of jobs.values()) for (const job of m.values()) clearTimeout(job.timer);
    },
  };
}
