import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { applyEdits, approachOf, failedApproaches, invert, impossibleVerdict, median, overlay, runOf, verdict, type Bug, type Edit, type JsonReport, type Tally } from './score-lib.ts';

const root = resolve(import.meta.dirname, '..');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { runs: { type: 'string', default: '10' }, port: { type: 'string', default: '3999' }, workers: { type: 'string', default: '4' }, config: { type: 'string' }, tests: { type: 'string' }, 'approach-by': { type: 'string', default: 'file' }, check: { type: 'boolean', default: false }, json: { type: 'string' }, load: { type: 'string', default: '0' }, runner: { type: 'string', default: 'playwright' }, 'clean-only': { type: 'boolean', default: false }, 'app-commit': { type: 'string' } },
});
const runs = Number(values.runs);
const load = Number(values.load);
const port = Number(values.port);
const baseURL = `http://localhost:${port}`;

const allCases = readdirSync(join(root, 'cases')).filter((c) => existsSync(join(root, 'cases', c, 'bugs.ts'))).sort();
const cases = positionals.length ? positionals : allCases;
for (const c of cases) if (!allCases.includes(c)) fail(`no cases/${c}/bugs.ts`);
if (!Number.isInteger(runs) || runs < 1) fail('--runs must be a positive integer');
if (!Number.isInteger(load) || load < 0) fail('--load must be a whole number of busy processes');
if (values.tests && cases.length !== 1) fail('--tests needs exactly one case, whose bugs.ts is used');
if (!['file', 'run'].includes(values['approach-by']!)) fail('--approach-by is file or run');
if (!['playwright', 'cypress'].includes(values.runner!)) fail('--runner is playwright or cypress');
const keyOf = values['approach-by'] === 'run' ? runOf : approachOf;

function fail(message: string): never {
  console.error(`score: ${message}`);
  process.exit(2);
}

const sh = (cmd: string, args: string[], cwd: string) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024 });

// Bugs are planted in a disposable clone, never in the live checkout: a commit made meanwhile, a killed
// run or a moving HEAD would otherwise put a planted bug into the real source or mix two builds.
// APP_DIR still points the scorer at a tree of your choice, and that tree is then planted in.
function prepareCopy(): string {
  const live = resolve(process.env.LIVE_APP_DIR ?? join(root, '..'));
  const copy = resolve(process.env.SCORE_COPY_DIR ?? join(homedir(), '.cache', 'e2e-casebook-score'));
  if (!existsSync(join(copy, '.git'))) sh('git', ['clone', '-q', '--no-hardlinks', live, copy], root);
  if (sh('git', ['status', '--porcelain', '--untracked-files=no'], copy).trim()) {
    fail(`${copy} has uncommitted changes (a killed run?); inspect them, then run: git -C ${copy} checkout -- .`);
  }
  const sha = sh('git', ['rev-parse', '--verify', `${values['app-commit'] ?? 'main'}^{commit}`], live).trim();
  sh('git', ['fetch', '-q', live, '+refs/heads/*:refs/remotes/live/*'], copy);
  sh('git', ['checkout', '-q', '--detach', sha], copy);
  if (!values.check) {
    const lock = createHash('sha256').update(readFileSync(join(copy, 'package-lock.json'))).digest('hex');
    const marker = join(copy, 'node_modules', '.score-lock-sha256');
    if (!existsSync(marker) || readFileSync(marker, 'utf8') !== lock) {
      sh('npm', ['ci', '--silent'], copy);
      writeFileSync(marker, lock);
    }
  }
  return copy;
}
const appDir = process.env.APP_DIR ? resolve(process.env.APP_DIR) : prepareCopy();

if (!values.check) {
  if (sh('git', ['status', '--porcelain', '--untracked-files=no'], appDir).trim()) {
    fail(`${appDir} has uncommitted changes; commit or stash them first`);
  }
  await new Promise<void>((ok) => {
    const probe = createServer().once('error', () => fail(`port ${port} is in use`));
    probe.listen(port, () => probe.close(() => ok()));
  });
}

const bugsByCase = new Map<string, Bug[]>();
const cleanByCase = new Map<string, Edit[]>();
const keptByCase = new Map<string, Edit[]>();
const originals = new Map<string, string>();
for (const c of cases) {
  const { bugs, baseline = [], otherFixes = [], impossible = [] } = (await import(join(root, 'cases', c, 'bugs.ts'))) as { bugs: Bug[]; baseline?: Edit[]; otherFixes?: Edit[]; impossible?: Edit[] };
  const clean = [...otherFixes, ...baseline];
  for (const { file } of [...clean, ...impossible, ...bugs.flatMap((b) => b.edits)]) {
    if (!originals.has(file)) originals.set(file, readFileSync(join(appDir, file), 'utf8'));
  }
  let fixed = originals;
  try {
    fixed = overlay(originals, clean);
  } catch (error) {
    fail(`${c} / baseline: ${(error as Error).message}`);
  }
  for (const bug of bugs) {
    try {
      applyEdits(fixed, bug.edits);
    } catch (error) {
      fail(`${c} / ${bug.name}: ${(error as Error).message}`);
    }
  }
  try {
    applyEdits(fixed, impossible);
  } catch (error) {
    fail(`${c} / Promise kept: ${(error as Error).message}`);
  }
  if (impossible.length) keptByCase.set(c, impossible);
  const shipped = invert(baseline);
  try {
    applyEdits(fixed, shipped);
  } catch (error) {
    fail(`${c} / As shipped: ${(error as Error).message}`);
  }
  bugsByCase.set(c, baseline.length ? [{ name: 'As shipped', edits: shipped }, ...bugs] : bugs);
  cleanByCase.set(c, clean);
}
if (values.check) {
  const count = [...bugsByCase.values()].reduce((n, b) => n + b.length, 0) + keptByCase.size;
  console.log(`score: every anchor matches once (${count} bugs in ${bugsByCase.size} cases)`);
  process.exit(0);
}

let server: ChildProcess | undefined;
let dirty = false;

function writeAll(sources: Map<string, string>) {
  for (const [file, text] of sources) {
    if (readFileSync(join(appDir, file), 'utf8') !== text) writeFileSync(join(appDir, file), text);
  }
}

const restore = () => writeAll(originals);
const touchesWeb = (edits: Edit[]) => edits.some((e) => e.file.startsWith('web/'));

async function stopServer() {
  const running = server;
  server = undefined;
  if (!running || running.exitCode !== null) return;
  const exited = new Promise((r) => running.once('exit', r));
  running.kill('SIGTERM');
  await exited;
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server?.kill('SIGKILL');
    restore();
    if (dirty) sh('npm', ['run', '-s', 'build'], appDir);
    process.exit(130);
  });
}

async function startServer() {
  server = spawn('node', ['server/main.ts'], { cwd: appDir, env: { ...process.env, TEST_HOOKS: '1', PORT: String(port) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`the app exited with code ${server.exitCode}`);
    try {
      if ((await fetch(`${baseURL}/api/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('the app did not start');
}

async function serve(build: boolean) {
  await stopServer();
  if (build) sh('npm', ['run', '-s', 'build'], appDir);
  await startServer();
}

function playwright(c: string): ReturnType<typeof failedApproaches> {
  let out: string;
  try {
    const config = values.config ? ['--config', values.config] : [];
    out =
      values.runner === 'cypress'
        ? sh('node', ['scripts/cypress-run.ts', values.tests ?? `cypress/cases/${c}/*.cy.ts`], root)
        : sh('npx', ['playwright', 'test', ...config, values.tests ?? `cases/${c}`, '--retries=0', `--workers=${values.workers}`, '--reporter=json'], root);
  } catch (error) {
    out = String((error as { stdout?: string }).stdout ?? '');
  }
  const marked = out.lastIndexOf('@@cypress-report@@');
  if (marked >= 0) out = out.slice(marked + '@@cypress-report@@'.length);
  const start = out.indexOf('{');
  if (start < 0) throw new Error(`no JSON report from ${values.runner} for ${c}`);
  return failedApproaches(JSON.parse(out.slice(start)) as JsonReport, keyOf);
}

async function tally(c: string): Promise<Map<string, Tally>> {
  const result = new Map<string, Tally>();
  for (let i = 0; i < runs; i++) {
    const { ran, failed, ms } = playwright(c);
    for (const a of ran) {
      const t = result.get(a) ?? { failed: 0, runs: 0, ms: [] };
      t.runs++;
      t.ms!.push(ms.get(a) ?? 0);
      if (failed.has(a)) t.failed++;
      result.set(a, t);
    }
  }
  for (const [a, t] of result) if (t.runs !== runs) throw new Error(`${c}/${a} ran ${t.runs} of ${runs} times`);
  return result;
}

const started = Date.now();
const startSha = sh('git', ['rev-parse', '--short', 'HEAD'], appDir).trim();
const hogs: ChildProcess[] = [];
process.on('exit', () => hogs.forEach((h) => h.kill()));
try {
  process.env.BASE_URL = baseURL;
  await serve(true);
  for (let i = 0; i < load; i++) hogs.push(spawn(process.execPath, ['-e', 'for (;;) {}'], { stdio: 'ignore' }));
  for (const [c, bugs] of bugsByCase) {
    const shipped = cleanByCase.get(c)!;
    const fixed = overlay(originals, shipped);
    if (shipped.length) {
      writeAll(fixed);
      dirty ||= touchesWeb(shipped);
      await serve(touchesWeb(shipped));
    }
    const baseline = await tally(c);
    const approaches = [...baseline.keys()].sort();
    const rows: string[][] = [];
    const kept = keptByCase.get(c);
    rows.push([kept ? 'Clean build (breaks the promise on purpose)' : 'Clean build', ...approaches.map((a) => (baseline.get(a)!.failed ? `${baseline.get(a)!.failed}/${runs} failed` : 'passed'))]);
    rows.push(['Median time, clean build', ...approaches.map((a) => `${Math.round(median(baseline.get(a)!.ms!)).toLocaleString('en-US')} ms`)]);
    if (kept) {
      for (const [file, text] of applyEdits(fixed, kept)) writeFileSync(join(appDir, file), text);
      const web = touchesWeb(kept);
      dirty ||= web;
      try {
        await serve(web);
        const keptTally = await tally(c);
        rows.push(['Promise kept (private fix)', ...approaches.map((a) => (keptTally.get(a)?.failed ? `${keptTally.get(a)!.failed}/${runs} failed` : 'passed'))]);
        rows.push(['Verdict', ...approaches.map((a) => impossibleVerdict(baseline.get(a)!, keptTally.get(a) ?? { failed: runs, runs }))]);
      } finally {
        writeAll(fixed);
      }
      await serve(web);
      dirty = touchesWeb(shipped);
    }
    for (const bug of values['clean-only'] || kept ? [] : bugs) {
      for (const [file, text] of applyEdits(fixed, bug.edits)) writeFileSync(join(appDir, file), text);
      const web = touchesWeb(bug.edits);
      dirty ||= web;
      try {
        await serve(web);
        const buggy = await tally(c);
        rows.push([bug.name, ...approaches.map((a) => verdict(baseline.get(a)!, buggy.get(a) ?? { failed: 0, runs: 0 }))]);
      } finally {
        writeAll(fixed);
      }
      await serve(web);
      dirty = touchesWeb(shipped);
    }
    if (shipped.length) {
      restore();
      await serve(touchesWeb(shipped));
      dirty = false;
    }
    console.log(`\n### ${c} (${runs} runs per row)\n`);
    console.log(`| Planted bug | ${approaches.join(' | ')} |`);
    console.log(`|---|${approaches.map(() => '---').join('|')}|`);
    for (const r of rows) console.log(`| ${r.join(' | ')} |`);
    if (values.json) {
      const file = resolve(values.json);
      const all = (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}) as Record<string, unknown>;
      all[c] = {
        app: sh('git', ['rev-parse', '--short', 'HEAD'], appDir).trim(),
        date: new Date().toISOString().slice(0, 10),
        runs,
        workers: Number(values.workers),
        ...(load ? { load } : {}),
        approaches,
        rows,
      };
      writeFileSync(file, JSON.stringify(all, null, 2) + '\n');
    }
  }
} finally {
  for (const h of hogs) h.kill();
  await stopServer();
  restore();
  if (dirty) sh('npm', ['run', '-s', 'build'], appDir);
}
if (sh('git', ['status', '--porcelain', '--untracked-files=no'], appDir).trim()) fail(`${appDir} was not restored cleanly`);
if (sh('git', ['rev-parse', '--short', 'HEAD'], appDir).trim() !== startSha) fail(`${appDir} moved from ${startSha} during scoring (git-auto-pull?); the results mix two builds`);
console.log(`\nApp ${sh('git', ['rev-parse', '--short', 'HEAD'], appDir).trim()}, ${runs} runs per row, ${values.workers} workers${load ? `, ${load} busy processes` : ''}, ${Math.round((Date.now() - started) / 1000)} s.`);
