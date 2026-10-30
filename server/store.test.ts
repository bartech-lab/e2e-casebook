import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore } from './store.ts';

type Ctx = {
  after: (fn: () => void) => void;
  mock: { method: (obj: any, name: string, impl: () => number) => unknown };
};

function setup(t: Ctx, start = 1000) {
  const state = { clock: start };
  t.mock.method(Date, 'now', () => state.clock);
  const store = openStore(':memory:');
  t.after(() => {
    store.close();
  });
  return { store, state };
}

test('prune boundary: last-used equal to cutoff is kept, one less is pruned', (t) => {
  const { store } = setup(t, 1000);
  store.createSandbox('a');
  assert.deepEqual(store.pruneOlderThan(1000), []);
  assert.equal(store.hasSandbox('a'), true);
  assert.deepEqual(store.pruneOlderThan(1001), ['a']);
  assert.equal(store.hasSandbox('a'), false);
});

test('createCard keeps a sandbox alive past the cutoff', (t) => {
  const { store, state } = setup(t, 1000);
  store.createSandbox('live');
  store.createSandbox('idle');
  state.clock = 5000;
  store.createCard('live', { title: 'x' }, 'me');
  assert.deepEqual(store.pruneOlderThan(3000), ['idle']);
  assert.equal(store.hasSandbox('live'), true);
});

test('updateCard keeps a sandbox alive past the cutoff', (t) => {
  const { store, state } = setup(t, 1000);
  store.createSandbox('live');
  store.createSandbox('idle');
  const card = store.listCards("live")[0]!;
  state.clock = 5000;
  store.updateCard('live', card.id, { title: 'changed' }, 'me');
  assert.deepEqual(store.pruneOlderThan(3000), ['idle']);
  assert.equal(store.hasSandbox('live'), true);
});

test('addMessage keeps a sandbox alive past the cutoff', (t) => {
  const { store, state } = setup(t, 1000);
  store.createSandbox('live');
  store.createSandbox('idle');
  state.clock = 5000;
  store.addMessage('live', 'me', 'hello');
  assert.deepEqual(store.pruneOlderThan(3000), ['idle']);
  assert.equal(store.hasSandbox('live'), true);
});

test('prune cascades to cards and messages of the pruned sandbox only', (t) => {
  const { store, state } = setup(t, 1000);
  store.createSandbox('old');
  store.addMessage('old', 'me', 'old msg');
  store.createSandbox('kept');
  state.clock = 5000;
  store.createCard('kept', { title: 'extra' }, 'me');
  store.addMessage('kept', 'me', 'kept msg');
  assert.deepEqual(store.pruneOlderThan(3000), ['old']);
  assert.deepEqual(store.listCards('old'), []);
  assert.deepEqual(store.messagesSince('old', 0), []);
  assert.equal(store.hasSandbox('old'), false);
  assert.equal(store.listCards('kept').length, 5);
  assert.equal(store.messagesSince('kept', 0).length, 1);
});

test('createCard defaults status to todo and keeps an explicit status', (t) => {
  const { store } = setup(t);
  store.createSandbox('a');
  const plain = store.createCard('a', { title: 'p' }, 'me');
  const doing = store.createCard('a', { title: 'd', status: 'doing' }, 'me');
  assert.equal(plain.status, 'todo');
  assert.equal(doing.status, 'doing');
});
