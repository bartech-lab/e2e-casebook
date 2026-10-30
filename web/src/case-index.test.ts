import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildIndex, indexFile, render } from '../../scripts/case-index.ts';

test('case-index.json is up to date (run npm run case-index)', () => {
  assert.equal(readFileSync(indexFile, 'utf8'), render(buildIndex()));
});

test('every case is listed once, in order', () => {
  assert.deepEqual(buildIndex().map((c) => c.n), Array.from({ length: 202 }, (_, i) => i + 1));
});
