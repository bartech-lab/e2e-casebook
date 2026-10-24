export function countPrimes(n: number, onProgress: (percent: number) => void) {
  if (n < 2) return 0;
  const root = Math.floor(Math.sqrt(n));
  const small = new Uint8Array(root + 1);
  const base: number[] = [];
  for (let i = 2; i <= root; i++) {
    if (small[i]) continue;
    base.push(i);
    for (let j = i * i; j <= root; j += i) small[j] = 1;
  }
  const size = 1 << 20;
  const seg = new Uint8Array(size);
  let count = 0;
  let lastPercent = -1;
  for (let low = 2; low <= n; low += size) {
    const high = Math.min(low + size - 1, n);
    seg.fill(0);
    for (const p of base) {
      if (p * p > high) break;
      let start = Math.max(p * p, Math.ceil(low / p) * p);
      for (let j = start; j <= high; j += p) seg[j - low] = 1;
    }
    for (let i = 0; i <= high - low; i++) if (!seg[i]) count++;
    const percent = Math.floor(((high - 1) / (n - 1)) * 100);
    if (percent !== lastPercent) onProgress((lastPercent = percent));
  }
  return count;
}
