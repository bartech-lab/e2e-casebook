import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { createExports } from './exports.ts';
import { createFaults } from './faults.ts';
import type { Store } from './store.ts';

const store = { listCards: () => [{ id: 1, title: 'Plan', status: 'todo', version: 1 }] } as unknown as Store;

async function settle(read: () => { status: string } | undefined) {
  for (let i = 0; i < 200; i++) {
    const job = read();
    if (job && job.status !== 'running') return job;
    await sleep(5);
  }
  throw new Error('export never settled');
}

test('a failed export names the step it failed at and the total number of steps', async (t) => {
  const faults = createFaults();
  faults.setExportSettings('sb', { stepMs: 1, failAtStep: 3, failRuns: 1 });
  const exports = createExports(store, faults);
  t.after(() => exports.stop());
  const { id } = exports.start('sb');
  const job = await settle(() => exports.get('sb', id));
  assert.equal(job.status, 'failed');
  assert.equal(exports.get('sb', id)?.error, 'Export failed at step 3 of 10');
});

test('a finished export file ends with a newline after the last row', async (t) => {
  const faults = createFaults();
  faults.setExportSettings('sb', { stepMs: 1 });
  const exports = createExports(store, faults);
  t.after(() => exports.stop());
  const { id } = exports.start('sb');
  await settle(() => exports.get('sb', id));
  assert.equal(exports.file('sb', id), 'id,title,status,version\n"1","Plan","todo","1"\n');
});
