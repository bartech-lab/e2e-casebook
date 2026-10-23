export const REGIONS = ['North', 'South', 'East', 'West'] as const;
export const CHUNKS = 20;
export const CHUNK_SIZE = 1_000_000;

export type Totals = { orders: number[]; cents: number[] };

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addChunk(totals: Totals, chunk: number) {
  const r = rng(2026 + chunk);
  for (let i = 0; i < CHUNK_SIZE; i++) {
    const region = Math.floor(r() * REGIONS.length);
    totals.orders[region]! += 1;
    totals.cents[region]! += 500 + Math.floor(r() * 20_000);
  }
}
