export type Edit = { file: string; find: string; replace: string };
export type Bug = { name: string; edits: Edit[] };

type JsonTest = { status: 'expected' | 'unexpected' | 'flaky' | 'skipped'; results?: { duration: number }[] };
type JsonSpec = { file: string; tests: JsonTest[] };
type JsonSuite = { specs?: JsonSpec[]; suites?: JsonSuite[] };
export type JsonReport = { errors: unknown[]; suites: JsonSuite[] };

export function applyEdits(sources: Map<string, string>, edits: Edit[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const { file, find, replace } of edits) {
    const current = out.get(file) ?? sources.get(file);
    if (current === undefined) throw new Error(`${file}: not loaded`);
    const count = current.split(find).length - 1;
    if (count !== 1) throw new Error(`${file}: expected the anchor once, found it ${count} times: ${JSON.stringify(find.slice(0, 80))}`);
    out.set(file, current.replace(find, () => replace));
  }
  return out;
}

export function overlay(sources: Map<string, string>, edits: Edit[]): Map<string, string> {
  return new Map([...sources, ...applyEdits(sources, edits)]);
}

export const invert = (edits: Edit[]): Edit[] => edits.map(({ file, find, replace }) => ({ file, find: replace, replace: find })).reverse();

export const approachOf = (file: string) => file.split('/').pop()!.replace(/\.(spec|cy)\.ts$/, '');

export const runOf = (file: string) => {
  const at = file.indexOf('/tests/');
  if (at < 0) throw new Error(`${file} is not inside a run's tests/ folder`);
  return file.slice(0, at);
};

export function failedApproaches(report: JsonReport, keyOf: (file: string) => string = approachOf): { ran: Set<string>; failed: Set<string>; ms: Map<string, number> } {
  if (report.errors.length) throw new Error(`Playwright reported errors: ${JSON.stringify(report.errors).slice(0, 500)}`);
  const ran = new Set<string>();
  const failed = new Set<string>();
  const ms = new Map<string, number>();
  const walk = (suite: JsonSuite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        if (test.status === 'skipped') continue;
        ran.add(keyOf(spec.file));
        if (test.status !== 'expected') failed.add(keyOf(spec.file));
        const took = (test.results ?? []).reduce((sum, r) => sum + r.duration, 0);
        ms.set(keyOf(spec.file), (ms.get(keyOf(spec.file)) ?? 0) + took);
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites) walk(suite);
  return { ran, failed, ms };
}

export type Tally = { failed: number; runs: number; ms?: number[] };

export function median(values: number[]): number {
  if (!values.length) throw new Error('median of nothing');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function verdict(baseline: Tally, buggy: Tally): string {
  if (baseline.failed > 0) return `unstable baseline (${baseline.failed}/${baseline.runs} failed)`;
  if (buggy.failed === buggy.runs) return 'caught';
  if (buggy.failed === 0) return 'missed';
  return `flaky (${buggy.failed}/${buggy.runs} failed)`;
}

export function impossibleVerdict(broken: Tally, kept: Tally): string {
  if (broken.failed === 0) return 'passes the broken app';
  if (broken.failed < broken.runs) return `flaky (${broken.failed}/${broken.runs} failed on the broken app)`;
  if (kept.failed === 0) return 'reported the conflict';
  if (kept.failed === kept.runs) return 'fails even with the promise kept';
  return `flaky (${kept.failed}/${kept.runs} failed with the promise kept)`;
}
