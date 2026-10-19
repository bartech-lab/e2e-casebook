export type HttpRule = {
  method: string;
  path: string;
  status?: number;
  delayMs?: number;
  times?: number;
  always?: boolean;
};

export type ExportSettings = { stepMs: number; failAtStep: number | null; failRuns: number };

const DEFAULT_EXPORTS: ExportSettings = { stepMs: 500, failAtStep: null, failRuns: 0 };

export type Faults = ReturnType<typeof createFaults>;

function matches(pattern: string, path: string) {
  const want = pattern.split('/').filter(Boolean);
  const got = path.split('/').filter(Boolean);
  return want.length === got.length && want.every((seg, i) => seg === '*' || seg === got[i]);
}

export function createFaults() {
  const rules = new Map<string, (HttpRule & { left: number })[]>();
  const exports = new Map<string, ExportSettings>();

  return {
    addHttpRules(sandbox: string, add: HttpRule[]) {
      const list = rules.get(sandbox) ?? [];
      for (const r of add) list.push({ ...r, method: r.method.toUpperCase(), left: r.times ?? 1 });
      rules.set(sandbox, list);
    },
    take(sandbox: string, method: string, path: string) {
      const list = rules.get(sandbox);
      if (!list) return undefined;
      const i = list.findIndex((r) => r.method === method && matches(r.path, path));
      if (i < 0) return undefined;
      const rule = list[i]!;
      if (!rule.always && --rule.left <= 0) list.splice(i, 1);
      return { status: rule.status, delayMs: rule.delayMs ?? 0 };
    },
    exportSettings(sandbox: string): ExportSettings {
      return exports.get(sandbox) ?? DEFAULT_EXPORTS;
    },
    setExportSettings(sandbox: string, change: Partial<ExportSettings>) {
      exports.set(sandbox, { ...this.exportSettings(sandbox), ...change });
    },
    consumeExportFailure(sandbox: string) {
      const s = this.exportSettings(sandbox);
      if (s.failAtStep === null || s.failRuns <= 0) return null;
      exports.set(sandbox, { ...s, failRuns: s.failRuns - 1 });
      return s.failAtStep;
    },
    clear(sandbox: string) {
      rules.delete(sandbox);
      exports.delete(sandbox);
    },
  };
}

export function parseHttpRules(value: unknown): HttpRule[] | null {
  if (!Array.isArray(value)) return null;
  const out: HttpRule[] = [];
  for (const r of value) {
    if (typeof r !== 'object' || r === null) return null;
    const { method, path, status, delayMs, times, always } = r as Record<string, unknown>;
    if (typeof method !== 'string' || typeof path !== 'string') return null;
    if (status !== undefined && (typeof status !== 'number' || status < 400 || status > 599)) return null;
    if (delayMs !== undefined && (typeof delayMs !== 'number' || delayMs < 0 || delayMs > 30_000)) return null;
    if (times !== undefined && (typeof times !== 'number' || times < 1)) return null;
    if (always !== undefined && typeof always !== 'boolean') return null;
    if (status === undefined && delayMs === undefined) return null;
    out.push({ method, path, status, delayMs, times, always } as HttpRule);
  }
  return out;
}
