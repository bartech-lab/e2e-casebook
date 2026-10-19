import type { Message } from './api.ts';

export function mergeMessages(current: readonly Message[], incoming: readonly Message[]): Message[] {
  const bySeq = new Map(current.map((m) => [m.seq, m]));
  for (const m of incoming) bySeq.set(m.seq, { seq: m.seq, name: m.name, text: m.text });
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}

export function lastSeq(messages: readonly Message[] | undefined) {
  return messages?.reduce((max, m) => Math.max(max, m.seq), 0) ?? 0;
}
