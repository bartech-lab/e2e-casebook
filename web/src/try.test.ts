import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { tryPage } from './try.ts';

const pages = ['chat', 'booking/dates', 'shop'];

test('a known page in ?try= is returned', () => {
  assert.equal(tryPage('?try=chat', pages), 'chat');
  assert.equal(tryPage('?try=booking%2Fdates', pages), 'booking/dates');
  assert.equal(tryPage('?try=booking/dates&x=1', pages), 'booking/dates');
});

test('no try, an empty one or an unknown page gives null', () => {
  assert.equal(tryPage('', pages), null);
  assert.equal(tryPage('?try=', pages), null);
  assert.equal(tryPage('?try=Chat', pages), null);
  assert.equal(tryPage('?try=chat/../admin', pages), null);
  assert.equal(tryPage('?page=chat', pages), null);
});
