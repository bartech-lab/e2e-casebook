import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const SPEAKERS = ['Chair', 'Cllr Nowak', 'Cllr Wiśniewska', 'Clerk', 'Cllr Zieliński'];
const AGENDA = ['Apologies', 'Minutes of the last meeting', 'Bus shelter on Lipowa', 'Playground budget', 'Any other business'];
const SENTENCE = 'The council discussed the matter at length and agreed to come back to it once the figures are in.';

const LINES = Array.from({ length: 220 }, (_, i) => {
  const n = i + 1;
  const words = 1 + ((n * 7) % 11);
  return {
    n,
    item: AGENDA[Math.min(AGENDA.length - 1, Math.floor(i / 44))]!,
    speaker: SPEAKERS[(n * 3) % SPEAKERS.length]!,
    text: `Line ${n}. ` + Array.from({ length: words }, () => SENTENCE).join(' '),
  };
});

export function registerTranscript(scope: FastifyInstance) {
  scope.get<{ Params: Params }>('/transcript', async () => {
    await new Promise((r) => setTimeout(r, 150));
    return { title: 'Parish council, 14 October 2026', lines: LINES };
  });
}
