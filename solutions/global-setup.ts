import { request, type FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  const api = await request.newContext({ baseURL });
  const res = await api.post('/api/sandboxes');
  if (!res.ok()) throw new Error(`could not create the shared sandbox: ${res.status()}`);
  process.env.SHARED_SANDBOX = ((await res.json()) as { id: string }).id;
  await api.dispose();
}
