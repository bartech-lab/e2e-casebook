import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Server never broadcasts",
    edits: [
      { file: "server/hub.ts", find: "      const r = room(sandbox);\n      const payload", replace: "      return;\n      const r = room(sandbox);\n      const payload" },
    ],
  },
  {
    name: "Server skips replay on reconnect",
    edits: [
      { file: "server/app.ts", find: "for (const msg of store.messagesSince(sandbox, Number(req.query.since ?? 0) || 0)) {", replace: "for (const msg of [] as ReturnType<typeof store.messagesSince>) {" },
    ],
  },
  {
    name: "Client keeps duplicates",
    edits: [
      { file: "web/src/chat/merge.ts", find: "  const bySeq = new Map(current.map((m) => [m.seq, m]));\n  for (const m of incoming) bySeq.set(m.seq, { seq: m.seq, name: m.name, text: m.text });\n  return [...bySeq.values()]", replace: "  return [...current, ...incoming.map((m) => ({ seq: m.seq, name: m.name, text: m.text }))]" },
    ],
  },
  {
    name: "Client orders by arrival, not `seq`",
    edits: [
      { file: "web/src/chat/merge.ts", find: ".sort((a, b) => a.seq - b.seq)", replace: "" },
    ],
  },
  {
    name: "Client never reconnects",
    edits: [
      { file: "web/src/chat/useLiveMessages.ts", find: "retry = setTimeout(connect, RECONNECT_MS);", replace: "void RECONNECT_MS;" },
    ],
  },
  {
    name: "Client ignores the `reset` push",
    edits: [
      { file: "web/src/chat/useLiveMessages.ts", find: "} else if (data.type === 'reset') {\n          queryClient.setQueryData<Message[]>(key, []);", replace: "} else if (data.type === 'reset') {" },
    ],
  },
];
