import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BEGIN, END, label, renderBlock, replaceBlock } from './render-lib.ts';

const score = { app: 'abc1234', date: '2026-10-20', runs: 10, workers: 4, approaches: ['1-two-contexts', '2-api'], rows: [['Clean build', 'passed', 'passed'], ['Bug A', 'caught', 'flaky (3/10 failed)']] };

test('label keeps the number and spaces every word', () => {
  assert.equal(label('5-pin-against-the-fallback'), '5 pin against the fallback');
});

test('renderBlock writes the method line, header, and every row between the markers', () => {
  const block = renderBlock(score);
  assert.ok(block.startsWith(BEGIN) && block.endsWith(END));
  assert.match(block, /10 runs per row, 4 workers, app abc1234/);
  assert.match(block, /\| Planted bug \| 1 two contexts \| 2 api \|\n\|---\|---\|---\|/);
  assert.match(block, /\| Clean build \| passed \| passed \|\n/);
  assert.match(block, /\| Bug A \| caught \| flaky \(3\/10 failed\) \|/);
});

test('replaceBlock swaps only the block and keeps the text around it', () => {
  const card = `# Card\n\nIntro.\n\n${BEGIN}\nold table\n${END}\n\nAfter.\n`;
  assert.equal(replaceBlock(card, 'NEW'), '# Card\n\nIntro.\n\nNEW\n\nAfter.\n');
});

test('replaceBlock refuses a card without a block, or with two', () => {
  assert.throws(() => replaceBlock('# Card\n', 'NEW'), /no score block/);
  assert.throws(() => replaceBlock(`${BEGIN}\n${END}\n${BEGIN}\n${END}\n`, 'NEW'), /two score blocks/);
});
