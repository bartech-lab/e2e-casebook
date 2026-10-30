import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS: Record<string, RegExp> = {
  waitForTimeout: /\bwaitForTimeout\s*\(/g,
  skipOrFixme: /\btest\.(skip|fixme)\b/g,
  testFail: /\b(test|testInfo)\.fail\s*\(/g,
  evaluate: /\.(evaluate|evaluateHandle|addInitScript)\s*\(/g,
  dispatchEvent: /\.dispatchEvent\s*\(/g,
  force: /\bforce\s*:\s*true\b/g,
  route: /\.(route|routeWebSocket)\s*\(/g,
  clock: /\.clock\./g,
  testHooks: /__test__\//g,
  attachShadow: /\battachShadow\b/g,
  prototypePatch: /\.prototype\.\w+\s*=(?!=)/g,
  storage: /\b(localStorage|sessionStorage|addCookies|storageState)\b/g,
  absoluteUrl: /https?:\/\/(epg|app|localhost|\d+\.\d+\.\d+\.\d+)[:/]/g,
  whitespaceText: /\.toHaveText\(\s*(['"`])(?:(?!\1)[^\\]|\\.)*?(?:\\n|\\t| {2})/g,
};

export function audit(dir: string) {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name));
      else if (e.name.endsWith('.ts')) files.push(join(d, e.name));
    }
  };
  walk(dir);
  const counts = Object.fromEntries(Object.keys(PATTERNS).map((k) => [k, 0])) as Record<string, number>;
  let tests = 0;
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    tests += (text.match(/\btest\s*\(/g) ?? []).length;
    for (const [k, re] of Object.entries(PATTERNS)) counts[k]! += (text.match(re) ?? []).length;
  }
  return { specFiles: files.filter((f) => f.endsWith('.spec.ts')).length, tests, ...counts, unawaited: unawaited(files.map((f) => readFileSync(f, 'utf8'))), noMatcher: noMatcher(files.map((f) => readFileSync(f, 'utf8'))) };
}

const PLAYWRIGHT_ACTIONS =
  /^\s*(page|context|browser|request|\w+Page|locator)\.(goto|reload|click|dblclick|fill|press|type|check|uncheck|selectOption|hover|focus|addInitScript|addCookies|route|waitFor\w*|evaluate|close|setViewportSize)\s*\(/;

const WEB_FIRST =
  /^\s*expect(\.soft)?\(.*\)\.(not\.)?(toHaveText|toContainText|toBeVisible|toBeHidden|toHaveCount|toHaveValue|toHaveValues|toHaveAttribute|toBeChecked|toHaveURL|toHaveTitle|toBeEnabled|toBeDisabled|toBeFocused|toHaveClass|toBeAttached|toBeEditable|toBeEmpty|toHaveCSS|toBeInViewport|toHaveAccessibleName|toPass)\(/;

export function unawaited(texts: string[]): number {
  const all = texts.join('\n');
  const asyncNames = new Set<string>();
  for (const m of all.matchAll(/\basync\s+function\s+(\w+)/g)) asyncNames.add(m[1]!);
  for (const m of all.matchAll(/\b(?:const|let)\s+(\w+)\s*=\s*async\b/g)) asyncNames.add(m[1]!);
  let n = 0;
  for (const line of all.split('\n')) {
    const call = line.match(/^\s*(\w+)\s*\(/);
    if ((call && asyncNames.has(call[1]!)) || PLAYWRIGHT_ACTIONS.test(line) || WEB_FIRST.test(line)) n++;
  }
  return n;
}

export function noMatcher(texts: string[]): number {
  let n = 0;
  for (const raw of texts) {
    const text = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of text.matchAll(/\bexpect(?:\.soft|\.poll)?\s*\(/g)) {
      let depth = 1;
      let i = m.index! + m[0].length;
      let quote: string | null = null;
      for (; i < text.length && depth > 0; i++) {
        const c = text[i]!;
        if (quote) {
          if (c === '\\') i++;
          else if (c === quote) quote = null;
        } else if (c === "'" || c === '"' || c === '`') quote = c;
        else if (c === '(') depth++;
        else if (c === ')') depth--;
      }
      if (!/^\s*\.\s*(not\s*\.\s*|resolves\s*\.\s*|rejects\s*\.\s*)*to[A-Z]\w*\s*\(/.test(text.slice(i, i + 200))) n++;
    }
  }
  return n;
}
