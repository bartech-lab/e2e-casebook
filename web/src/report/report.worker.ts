import { CHUNKS, REGIONS, addChunk, type Totals } from './report-core.ts';

const pause = () => new Promise((r) => setTimeout(r, 50));

self.onmessage = async () => {
  const totals: Totals = { orders: REGIONS.map(() => 0), cents: REGIONS.map(() => 0) };
  for (let chunk = 0; chunk < CHUNKS; chunk++) {
    addChunk(totals, chunk);
    self.postMessage({ type: 'progress', done: chunk + 1, total: CHUNKS });
    await pause();
  }
  self.postMessage({ type: 'done', totals });
};
