import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFaults, parseHttpRules } from './faults.ts';

test('clear drops the export failure settings, so a reset sandbox exports normally', () => {
  const faults = createFaults();
  const fresh = faults.exportSettings('sb');
  faults.setExportSettings('sb', { stepMs: 20, failAtStep: 2, failRuns: 3 });
  faults.clear('sb');
  assert.deepEqual(faults.exportSettings('sb'), fresh);
  assert.equal(faults.consumeExportFailure('sb'), null);
});

test('a second export settings change keeps the fields the first one set', () => {
  const faults = createFaults();
  faults.setExportSettings('sb', { failAtStep: 4, failRuns: 1 });
  faults.setExportSettings('sb', { stepMs: 50 });
  assert.deepEqual(faults.exportSettings('sb'), { stepMs: 50, failAtStep: 4, failRuns: 1 });
  assert.equal(faults.consumeExportFailure('sb'), 4);
  assert.equal(faults.consumeExportFailure('sb'), null);
});

test('settings for one sandbox do not reach another', () => {
  const faults = createFaults();
  const fresh = faults.exportSettings('other');
  faults.setExportSettings('sb', { failAtStep: 1, failRuns: 1 });
  faults.clear('other');
  assert.deepEqual(faults.exportSettings('other'), fresh);
  assert.equal(faults.consumeExportFailure('sb'), 1);
});

test('an http rule with a non-boolean always is rejected', () => {
  assert.equal(parseHttpRules([{ method: 'GET', path: '/api/x', status: 500, always: 'yes' }]), null);
  assert.equal(parseHttpRules([{ method: 'GET', path: '/api/x', status: 500, always: 1 }]), null);
  assert.deepEqual(parseHttpRules([{ method: 'GET', path: '/api/x', status: 500, always: false }])?.length, 1);
});
