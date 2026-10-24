import { countPrimes } from './primes.ts';

self.onmessage = (e: MessageEvent<{ job: number; n: number }>) => {
  const { job, n } = e.data;
  const count = countPrimes(n, (percent) => self.postMessage({ job, percent }));
  self.postMessage({ job, count });
};
