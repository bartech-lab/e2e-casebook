import { expect, test } from '../fixtures.ts';

test('the export lifecycle through the API', async ({ request, sandbox }) => {
  await sandbox.fault({ exports: { stepMs: 20, failAtStep: 2 } });
  const api = `/api/s/${sandbox.id}/exports`;
  expect((await request.post(api)).status()).toBe(201);
  await expect.poll(async () => (await sandbox.exportJob(1)).status).toBe('failed');

  const retry = await request.post(`${api}/1/retry`);
  expect(retry.status()).toBe(201);
  expect(await retry.json()).toMatchObject({ id: 2, retryOf: 1 });
  await expect.poll(async () => (await sandbox.exportJob(2)).status).toBe('done');
  expect((await sandbox.exportJob(1)).status).toBe('failed');

  await sandbox.fault({ exports: { stepMs: 200 } });
  await request.post(api);
  await expect.poll(async () => (await sandbox.exportJob(3)).progress).toBeGreaterThan(0);
  expect((await request.post(`${api}/3/cancel`)).status()).toBe(200);
  const frozen = (await sandbox.exportJob(3)).progress;
  await new Promise((r) => setTimeout(r, 600));
  expect((await sandbox.exportJob(3)).progress).toBe(frozen);
  expect((await request.get(`${api}/3/file`)).status()).toBe(409);
});
