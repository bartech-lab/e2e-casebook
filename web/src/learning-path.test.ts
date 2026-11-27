import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildIndex } from '../../scripts/case-index.ts';

const doc = new URL('../../docs/learning-path.md', import.meta.url);
const text = readFileSync(doc, 'utf8');
const themes = JSON.parse(readFileSync(new URL('../../cases/themes.json', import.meta.url), 'utf8')) as Record<string, number[]>;

test('docs/learning-path.md has one step per theme', () => {
  const steps = [...text.matchAll(/^## \d+\. (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual([...steps].sort(), Object.keys(themes).sort());
});

test('every relative link in docs/learning-path.md points at a file', () => {
  const missing = [...text.matchAll(/\]\((\.\.\/[^)#]+)/g)].map((m) => m[1]!).filter((p) => !existsSync(new URL(p, doc)));
  assert.deepEqual(missing, []);
});

test('every Try link in docs/learning-path.md opens a page some case uses', () => {
  const pages = new Set(buildIndex().map((c) => c.page));
  const unknown = [...text.matchAll(/\?try=([^)\s]+)\)/g)].map((m) => decodeURIComponent(m[1]!)).filter((p) => !pages.has(p));
  assert.deepEqual(unknown, []);
});
