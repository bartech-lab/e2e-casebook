import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { renderBlock, replaceBlock, type CaseScore } from './render-lib.ts';

const root = resolve(import.meta.dirname, '..');
const scores = JSON.parse(readFileSync(join(root, 'scores', 'cases.json'), 'utf8')) as Record<string, CaseScore>;
let changed = 0;
for (const [c, score] of Object.entries(scores)) {
  const path = join(root, 'cases', c, 'README.md');
  const before = readFileSync(path, 'utf8');
  const after = replaceBlock(before, renderBlock(score));
  if (after !== before) {
    writeFileSync(path, after);
    changed++;
  }
}
console.log(`render-cards: ${changed} of ${Object.keys(scores).length} cards changed`);
