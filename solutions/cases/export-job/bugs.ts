import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Cancel does not stop the job",
    edits: [
      { file: "server/exports.ts", find: "      if (job.status !== 'running') return;\n", replace: "      if (job.status === 'done') return;\n" },
      { file: "server/exports.ts", find: "      clearTimeout(job.timer);\n      job.status = 'cancelled';", replace: "      job.status = 'cancelled';" },
    ],
  },
  {
    name: "Retry reuses the old job",
    edits: [
      { file: "server/exports.ts", find: "      return start(sandbox, id);", replace: "      list(sandbox).delete(id);\n      return start(sandbox, id);" },
    ],
  },
  {
    name: "Polling stops after the first load",
    edits: [
      { file: "web/src/exports/Exports.tsx", find: "refetchInterval: (q) => (q.state.data?.some((j) => j.status === 'running') ? 1000 : false),", replace: "refetchInterval: false," },
    ],
  },
  {
    name: "Polling never stops",
    edits: [
      { file: "web/src/exports/Exports.tsx", find: "? 1000 : false),", replace: "? 1000 : 1000)," },
    ],
  },
  {
    name: "Download offered before done",
    edits: [
      { file: "web/src/exports/Exports.tsx", find: "{job.status === 'done' && (", replace: "{job.status !== 'failed' && (" },
    ],
  },
];
