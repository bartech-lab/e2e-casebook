import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DESCRIPTION, MAX_NAME, byField, cardInput } from './validation.ts';

test('a card description of exactly the maximum length is accepted, one more is rejected', () => {
  const atMax = 'd'.repeat(MAX_DESCRIPTION);
  assert.equal(cardInput({ title: 'Plan', description: atMax })?.description, atMax);
  assert.equal(cardInput({ title: 'Plan', description: atMax + 'd' }), null);
});

test('byField accepts a name of exactly the maximum length after trimming', () => {
  const atMax = 'n'.repeat(MAX_NAME);
  assert.equal(byField({ by: `  ${atMax}  ` }), atMax);
  assert.equal(byField({ by: atMax + 'n' }), null);
});
